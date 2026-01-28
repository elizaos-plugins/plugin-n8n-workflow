import type { IAgentRuntime, ModelType } from "@elizaos/core";
// ModelType imported from IAgentRuntime type
import { N8nWorkflow, NodeDefinition } from "../types/index.js";
import { WORKFLOW_GENERATION_SYSTEM_PROMPT } from "../prompts/index.js";

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
    responseFormat: { type: "json_object" },
  });

  // Parse workflow JSON
  let workflow: N8nWorkflow;
  try {
    // Remove markdown code fences if present
    const cleanedResponse = response
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/```\s*$/, "")
      .trim();

    workflow = JSON.parse(cleanedResponse) as N8nWorkflow;
  } catch (error) {
    throw new Error(
      `Failed to parse workflow JSON: ${error instanceof Error ? error.message : String(error)}\n\nRaw response: ${response}`,
    );
  }

  // Basic validation
  if (!workflow.nodes || !Array.isArray(workflow.nodes)) {
    throw new Error("Invalid workflow: missing or invalid nodes array");
  }

  if (!workflow.connections || typeof workflow.connections !== "object") {
    throw new Error("Invalid workflow: missing or invalid connections object");
  }

  return workflow;
}
