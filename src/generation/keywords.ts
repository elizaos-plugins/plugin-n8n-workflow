import type { IAgentRuntime, ModelType } from "@elizaos/core";
import { KeywordExtractionResult } from "../types/index.js";
import { KEYWORD_EXTRACTION_SYSTEM_PROMPT } from "../prompts/index.js";

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
  // Use OBJECT_SMALL for structured JSON output
  const result = (await runtime.useModel(ModelType.OBJECT_SMALL, {
    prompt: `${KEYWORD_EXTRACTION_SYSTEM_PROMPT}\n\nUser request: ${userPrompt}`,
    schema: {
      type: "object",
      properties: {
        keywords: {
          type: "array",
          items: { type: "string" },
          description: "Up to 5 relevant keywords or phrases",
        },
      },
      required: ["keywords"],
    },
  })) as KeywordExtractionResult;

  // Validate structure
  if (!result || !result.keywords || !Array.isArray(result.keywords)) {
    throw new Error(
      "Invalid keyword extraction response: missing or invalid keywords array",
    );
  }

  // Validate all items are strings
  if (!result.keywords.every((kw) => typeof kw === "string")) {
    throw new Error("Keywords array contains non-string elements");
  }

  // Limit to 5 keywords max, filter empty strings
  return result.keywords
    .slice(0, 5)
    .map((kw) => kw.trim())
    .filter((kw) => kw.length > 0);
}
