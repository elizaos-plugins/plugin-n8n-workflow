import { type IAgentRuntime, ModelType, logger } from '@elizaos/core';
import {
  KeywordExtractionResult,
  N8nWorkflow,
  WorkflowMatchResult,
  WorkflowDraft,
  DraftIntentResult,
  NodeDefinition,
} from '../types/index';
import {
  KEYWORD_EXTRACTION_SYSTEM_PROMPT,
  WORKFLOW_GENERATION_SYSTEM_PROMPT,
  DRAFT_INTENT_SYSTEM_PROMPT,
} from '../prompts/index';
import { WORKFLOW_MATCHING_SYSTEM_PROMPT } from '../prompts/workflowMatching';
import {
  keywordExtractionSchema,
  workflowMatchingSchema,
  draftIntentSchema,
} from '../schemas/index';
import { getNodeDefinition } from './catalog';

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
  userPrompt: string
): Promise<string[]> {
  const result = (await runtime.useModel(ModelType.OBJECT_SMALL, {
    prompt: `${KEYWORD_EXTRACTION_SYSTEM_PROMPT}\n\nUser request: ${userPrompt}`,
    schema: keywordExtractionSchema,
  })) as KeywordExtractionResult;

  // Validate structure
  if (!result || !result.keywords || !Array.isArray(result.keywords)) {
    throw new Error('Invalid keyword extraction response: missing or invalid keywords array');
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
  workflows: N8nWorkflow[]
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
          `${index + 1}. "${wf.name}" (ID: ${wf.id}, Status: ${wf.active ? 'ACTIVE' : 'INACTIVE'})`
      )
      .join('\n');

    const userPrompt = `${userRequest}

Available workflows:
${workflowList}`;

    const result = (await runtime.useModel(ModelType.OBJECT_SMALL, {
      prompt: `${WORKFLOW_MATCHING_SYSTEM_PROMPT}\n\n${userPrompt}`,
      schema: workflowMatchingSchema,
    })) as WorkflowMatchResult;

    logger.debug(
      { src: 'plugin:n8n-workflow:generation:matcher' },
      `Workflow match: ${result.matchedWorkflowId || 'none'} (confidence: ${result.confidence})`
    );

    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(
      { src: 'plugin:n8n-workflow:generation:matcher' },
      `Workflow matching failed: ${errorMessage}`
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
 * Classify user intent when a workflow draft exists in cache
 *
 * The LLM determines whether the user wants to confirm, cancel, modify, or create a new workflow
 * based on their message and the existing draft context.
 *
 * @param runtime - ElizaOS runtime for model access
 * @param userMessage - User's current message
 * @param draft - The existing workflow draft from cache
 * @returns Intent classification with optional modification request
 */
export async function classifyDraftIntent(
  runtime: IAgentRuntime,
  userMessage: string,
  draft: WorkflowDraft
): Promise<DraftIntentResult> {
  const draftSummary = `Workflow: "${draft.workflow.name}"
Nodes: ${draft.workflow.nodes.map((n) => `${n.name} (${n.type})`).join(', ')}
Original prompt: "${draft.prompt}"`;

  let result: DraftIntentResult;
  try {
    result = (await runtime.useModel(ModelType.OBJECT_SMALL, {
      prompt: `${DRAFT_INTENT_SYSTEM_PROMPT}

## Current Draft

${draftSummary}

## User Message

${userMessage}`,
      schema: draftIntentSchema,
    })) as DraftIntentResult;
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    logger.error(
      { src: 'plugin:n8n-workflow:generation:intent', error: errMsg },
      `classifyDraftIntent failed: ${errMsg}`
    );
    return {
      intent: 'show_preview',
      reason: `Intent classification failed (${errMsg}) — re-showing preview`,
    };
  }

  const validIntents = ['confirm', 'cancel', 'modify', 'new'] as const;
  if (!result?.intent || !validIntents.includes(result.intent as (typeof validIntents)[number])) {
    logger.warn(
      { src: 'plugin:n8n-workflow:generation:intent' },
      `Invalid intent from LLM: ${JSON.stringify(result)}, re-showing preview`
    );
    return { intent: 'show_preview', reason: 'Could not classify intent — re-showing preview' };
  }

  logger.debug(
    { src: 'plugin:n8n-workflow:generation:intent' },
    `Draft intent: ${result.intent} — ${result.reason}`
  );

  return result;
}

/**
 * Parse LLM response into an N8nWorkflow object.
 * Strips markdown code fences and validates basic structure.
 */
function parseWorkflowResponse(response: string): N8nWorkflow {
  const cleaned = response
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```\s*$/, '')
    .trim();

  let workflow: N8nWorkflow;
  try {
    workflow = JSON.parse(cleaned) as N8nWorkflow;
  } catch (error) {
    throw new Error(
      `Failed to parse workflow JSON: ${error instanceof Error ? error.message : String(error)}\n\nRaw response: ${response}`
    );
  }

  if (!workflow.nodes || !Array.isArray(workflow.nodes)) {
    throw new Error('Invalid workflow: missing or invalid nodes array');
  }

  if (!workflow.connections || typeof workflow.connections !== 'object') {
    throw new Error('Invalid workflow: missing or invalid connections object');
  }

  return workflow;
}

/**
 * Generate n8n workflow from natural language using LLM
 *
 * @param runtime - ElizaOS runtime for model access
 * @param userPrompt - User's workflow description
 * @param relevantNodes - Nodes found by keyword search
 * @returns Generated workflow JSON
 */
export async function generateWorkflow(
  runtime: IAgentRuntime,
  userPrompt: string,
  relevantNodes: NodeDefinition[]
): Promise<N8nWorkflow> {
  const fullPrompt = `${WORKFLOW_GENERATION_SYSTEM_PROMPT}

## Relevant Nodes Available

${JSON.stringify(relevantNodes, null, 2)}

Use these node definitions to generate the workflow. Each node's "properties" field defines the available parameters.

## User Request

${userPrompt}

Generate a valid n8n workflow JSON that fulfills this request.`;

  const response = await runtime.useModel(ModelType.TEXT_LARGE, {
    prompt: fullPrompt,
    temperature: 0,
    responseFormat: { type: 'json_object' },
  });

  const workflow = parseWorkflowResponse(response);

  if (!workflow.name) {
    workflow.name = `Workflow - ${userPrompt.slice(0, 50).trim()}`;
  }

  return workflow;
}

/**
 * Modify an existing n8n workflow based on user instructions.
 *
 * Sends the existing workflow JSON + modification instructions to the LLM,
 * which patches the workflow (add/remove/change nodes, connections, parameters).
 * Reuses WORKFLOW_GENERATION_SYSTEM_PROMPT so the LLM has full n8n knowledge.
 *
 * @param runtime - ElizaOS runtime for model access
 * @param existingWorkflow - The current workflow to modify
 * @param modificationRequest - What the user wants changed
 * @param relevantNodes - Node definitions (existing + any new ones from keyword search)
 * @returns Modified workflow JSON
 */
export async function modifyWorkflow(
  runtime: IAgentRuntime,
  existingWorkflow: N8nWorkflow,
  modificationRequest: string,
  relevantNodes: NodeDefinition[]
): Promise<N8nWorkflow> {
  const { _meta, ...workflowForLLM } = existingWorkflow;

  const fullPrompt = `${WORKFLOW_GENERATION_SYSTEM_PROMPT}

## Relevant Nodes Available

${JSON.stringify(relevantNodes, null, 2)}

Use these node definitions to modify the workflow. Each node's "properties" field defines the available parameters.

## Existing Workflow (modify this)

${JSON.stringify(workflowForLLM, null, 2)}

## Modification Request

${modificationRequest}

Modify the existing workflow according to the request above. Return the COMPLETE modified workflow JSON.
Keep all unchanged nodes and connections intact. Only add, remove, or change what the user asked for.`;

  const response = await runtime.useModel(ModelType.TEXT_LARGE, {
    prompt: fullPrompt,
    temperature: 0,
    responseFormat: { type: 'json_object' },
  });

  return parseWorkflowResponse(response);
}

/**
 * Collect node definitions for all nodes already in a workflow.
 * Used to give the LLM full context about existing nodes during modification.
 */
export function collectExistingNodeDefinitions(workflow: N8nWorkflow): NodeDefinition[] {
  const defs: NodeDefinition[] = [];
  const seen = new Set<string>();

  for (const node of workflow.nodes) {
    if (seen.has(node.type)) {
      continue;
    }
    seen.add(node.type);

    const def = getNodeDefinition(node.type);
    if (def) {
      defs.push(def);
    } else {
      logger.warn(
        { src: 'plugin:n8n-workflow:generation:modify' },
        `No catalog definition found for node type "${node.type}" — LLM will have limited context for this node`
      );
    }
  }

  return defs;
}
