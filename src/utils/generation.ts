import { type IAgentRuntime, ModelType, logger } from '@elizaos/core';
import {
  KeywordExtractionResult,
  N8nWorkflow,
  WorkflowMatchResult,
  NodeDefinition,
} from '../types/index';
import {
  KEYWORD_EXTRACTION_SYSTEM_PROMPT,
  WORKFLOW_GENERATION_SYSTEM_PROMPT,
} from '../prompts/index';
import { WORKFLOW_MATCHING_SYSTEM_PROMPT } from '../prompts/workflowMatching';
import {
  keywordExtractionSchema,
  workflowMatchingSchema,
} from '../schemas/index';

/**
 * Extracts keywords from user prompt using LLM
 * Adapted from n8n-intelligence to use ElizaOS runtime
 *
 * @param runtime - ElizaOS runtime for model access
 * @param userPrompt - User's workflow description
 * @returns Array of 1-5 keywords for node search
 *
 * @example
 * ```typescript
 * const keywords = await extractKeywords(runtime, "Send Stripe summaries via Gmail");
 * // Returns: ["stripe", "gmail", "send", "email"]
 * ```
 */
export async function extractKeywords(
  runtime: IAgentRuntime,
  userPrompt: string,
): Promise<string[]> {
  const result = (await runtime.useModel(ModelType.OBJECT_SMALL, {
    prompt: `${KEYWORD_EXTRACTION_SYSTEM_PROMPT}\n\nUser request: ${userPrompt}`,
    schema: keywordExtractionSchema,
  })) as KeywordExtractionResult;

  // Validate structure
  if (!result || !result.keywords || !Array.isArray(result.keywords)) {
    throw new Error(
      'Invalid keyword extraction response: missing or invalid keywords array',
    );
  }

  // Validate all items are strings
  if (!result.keywords.every((kw) => typeof kw === 'string')) {
    throw new Error('Keywords array contains non-string elements');
  }

  // Limit to 5 keywords max, filter empty strings
  return result.keywords
    .slice(0, 5)
    .map((kw) => kw.trim())
    .filter((kw) => kw.length > 0);
}

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
      schema: workflowMatchingSchema,
    });

    const result = response as unknown as WorkflowMatchResult;

    logger.debug(
      { src: 'plugin:n8n-workflow:generation:matcher' },
      `Workflow match: ${result.matchedWorkflowId || 'none'} (confidence: ${result.confidence})`,
    );

    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(
      { src: 'plugin:n8n-workflow:generation:matcher' },
      `Workflow matching failed: ${errorMessage}`,
    );

    return {
      matchedWorkflowId: null,
      confidence: 'none',
      matches: [],
      reason: `Workflow matching service unavailable: ${errorMessage}`,
    };
  }
}

/**
 * Generate n8n workflow from natural language using LLM
 * Adapted from n8n-intelligence to use ElizaOS runtime
 *
 * @param runtime - ElizaOS runtime for model access
 * @param userPrompt - User's workflow description
 * @param relevantNodes - Nodes found by keyword search
 * @returns Generated workflow JSON
 *
 * @example
 * ```typescript
 * const workflow = await generateWorkflow(
 *   runtime,
 *   "Send me Stripe summaries via Gmail",
 *   [gmailNode, stripeNode, scheduleNode]
 * );
 * ```
 */
export async function generateWorkflow(
  runtime: IAgentRuntime,
  userPrompt: string,
  relevantNodes: NodeDefinition[],
): Promise<N8nWorkflow> {
  // Build full prompt with system instructions + relevant nodes + user request
  const fullPrompt = `${WORKFLOW_GENERATION_SYSTEM_PROMPT}

## Relevant Nodes Available

${JSON.stringify(relevantNodes, null, 2)}

Use these node definitions to generate the workflow. Each node's "properties" field defines the available parameters.

## User Request

${userPrompt}

Generate a valid n8n workflow JSON that fulfills this request.`;

  // Use TEXT_LARGE with JSON response format
  const response = await runtime.useModel(ModelType.TEXT_LARGE, {
    prompt: fullPrompt,
    temperature: 0,
    responseFormat: { type: 'json_object' },
  });

  // Parse workflow JSON
  let workflow: N8nWorkflow;
  try {
    // Remove markdown code fences if present
    const cleanedResponse = response
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/```\s*$/, '')
      .trim();

    workflow = JSON.parse(cleanedResponse) as N8nWorkflow;
  } catch (error) {
    throw new Error(
      `Failed to parse workflow JSON: ${error instanceof Error ? error.message : String(error)}\n\nRaw response: ${response}`,
    );
  }

  // Basic validation
  if (!workflow.nodes || !Array.isArray(workflow.nodes)) {
    throw new Error('Invalid workflow: missing or invalid nodes array');
  }

  if (!workflow.connections || typeof workflow.connections !== 'object') {
    throw new Error('Invalid workflow: missing or invalid connections object');
  }

  return workflow;
}
