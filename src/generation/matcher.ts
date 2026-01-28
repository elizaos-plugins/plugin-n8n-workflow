import {
  type IAgentRuntime,
  logger,
  type Memory,
  ModelType,
  type State,
} from '@elizaos/core';
import { WORKFLOW_MATCHING_SYSTEM_PROMPT } from '../prompts/workflowMatching.js';
import type { N8nWorkflow, WorkflowMatchResult } from '../types/index.js';

/**
 * Match user request to available workflows using LLM semantic matching with conversation context
 *
 * @param runtime - Agent runtime with LLM access
 * @param userRequest - User's current message (for context-aware matching, include conversation history)
 * @param workflows - List of available workflows
 * @returns Match result with workflow ID and confidence
 */
export async function matchWorkflow(
  runtime: IAgentRuntime,
  userRequest: string,
  workflows: N8nWorkflow[],
): Promise<WorkflowMatchResult> {
  if (workflows.length === 0) {
    return {
      matchedWorkflowId: null,
      confidence: 'none',
      matches: [],
      reason: 'No workflows available',
    };
  }

  try {
    // Build workflow list for LLM
    const workflowList = workflows
      .map(
        (wf, index) =>
          `${index + 1}. "${wf.name}" (ID: ${wf.id}, Status: ${wf.active ? 'ACTIVE' : 'INACTIVE'})`,
      )
      .join('\n');

    const userPrompt = `${userRequest}

Available workflows:
${workflowList}`;

    const response = await runtime.useModel(ModelType.OBJECT_SMALL, {
      prompt: `${WORKFLOW_MATCHING_SYSTEM_PROMPT}\n\n${userPrompt}`,
      schema: {
        type: 'object',
        properties: {
          matchedWorkflowId: {
            type: 'string',
            nullable: true,
          },
          confidence: {
            type: 'string',
            enum: ['high', 'medium', 'low', 'none'],
          },
          matches: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                name: { type: 'string' },
                score: { type: 'number' },
              },
              required: ['id', 'name', 'score'],
            },
          },
          reason: {
            type: 'string',
          },
        },
        required: ['matchedWorkflowId', 'confidence', 'matches', 'reason'],
      },
    });

    const result = response as unknown as WorkflowMatchResult;

    logger.debug(
      `Workflow match: ${result.matchedWorkflowId || 'none'} (confidence: ${result.confidence})`,
    );

    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(
        { src: 'plugin:n8n-workflow:generation:matcher' },
        `Workflow matching failed: ${errorMessage}`);

    return {
      matchedWorkflowId: null,
      confidence: 'none',
      matches: [],
      reason: `Workflow matching service unavailable: ${errorMessage}`,
    };
  }
}

/**
 * Match workflow with conversation context support
 *
 * Helper that builds conversation context from recent messages and performs semantic matching.
 * Supports multi-turn conversations by including the last 5 messages.
 *
 * @param runtime - Agent runtime with LLM access
 * @param message - Current message
 * @param state - Current state with recentMessages
 * @param workflows - Available workflows to match against
 * @returns Match result with workflow ID and confidence
 */
export async function matchWorkflowWithContext(
  runtime: IAgentRuntime,
  message: Memory,
  state: State | undefined,
  workflows: N8nWorkflow[],
): Promise<WorkflowMatchResult> {
  const recentMessages = (state?.data?.recentMessages as Memory[]) || [];
  const conversationContext = recentMessages
    .slice(-5)
    .map(
      (m) =>
        `${m.entityId === runtime.agentId ? 'Assistant' : 'User'}: ${m.content.text}`,
    )
    .join('\n');

  const fullContext = conversationContext
    ? `Recent conversation:\n${conversationContext}\n\nCurrent request: ${message.content.text || ''}`
    : message.content.text || '';

  return matchWorkflow(runtime, fullContext, workflows);
}
