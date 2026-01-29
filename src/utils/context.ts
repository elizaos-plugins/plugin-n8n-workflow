import { type IAgentRuntime, type Memory, type State } from '@elizaos/core';

/**
 * Build conversation context from recent messages
 *
 * Takes last 5 messages from state and formats them for LLM context.
 */
export function buildConversationContext(
  runtime: IAgentRuntime,
  message: Memory,
  state: State | undefined,
): string {
  const recentMessages = (state?.data?.recentMessages as Memory[]) || [];

  if (recentMessages.length === 0) {
    return message.content.text || '';
  }

  const context = recentMessages
    .slice(-5)
    .map(
      (m) =>
        `${m.entityId === runtime.agentId ? 'Assistant' : 'User'}: ${m.content.text}`,
    )
    .join('\n');

  return `Recent conversation:\n${context}\n\nCurrent request: ${message.content.text || ''}`;
}
