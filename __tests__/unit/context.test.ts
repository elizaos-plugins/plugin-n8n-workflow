import { describe, test, expect } from "bun:test";
import { buildConversationContext } from "../../src/utils/context";
import {
  createMockRuntime,
  createMockMessage,
  createMockState,
} from "../helpers/mockRuntime";

describe("buildConversationContext", () => {
  test("returns message text when no recent messages", () => {
    const runtime = createMockRuntime();
    const message = createMockMessage({
      content: { text: "Activate my workflow" },
    });
    const state = createMockState();

    const result = buildConversationContext(runtime, message, state);
    expect(result).toBe("Activate my workflow");
  });

  test("returns empty string when no text and no recent messages", () => {
    const runtime = createMockRuntime();
    const message = createMockMessage({ content: { text: "" } });
    const state = createMockState();

    const result = buildConversationContext(runtime, message, state);
    expect(result).toBe("");
  });

  test("handles undefined state", () => {
    const runtime = createMockRuntime();
    const message = createMockMessage({ content: { text: "Hello" } });

    const result = buildConversationContext(runtime, message, undefined);
    expect(result).toBe("Hello");
  });

  test("includes recent messages in context", () => {
    const runtime = createMockRuntime({ agentId: "agent-001" });
    const message = createMockMessage({ content: { text: "Activate it" } });
    const state = createMockState({
      data: {
        recentMessages: [
          {
            entityId: "user-001",
            content: { text: "Show me my workflows" },
          },
          {
            entityId: "agent-001",
            content: { text: "Here are your workflows: Stripe, Gmail" },
          },
        ],
      },
    });

    const result = buildConversationContext(runtime, message, state);
    expect(result).toContain("User: Show me my workflows");
    expect(result).toContain("Assistant: Here are your workflows");
    expect(result).toContain("Current request: Activate it");
  });

  test("limits to last 5 messages", () => {
    const runtime = createMockRuntime({ agentId: "agent-001" });
    const message = createMockMessage({ content: { text: "Current" } });

    const messages = Array.from({ length: 10 }, (_, i) => ({
      entityId: "user-001",
      content: { text: `Message ${i}` },
    }));

    const state = createMockState({
      data: { recentMessages: messages },
    });

    const result = buildConversationContext(runtime, message, state);
    // Should only contain the last 5 messages (5-9)
    expect(result).not.toContain("Message 4");
    expect(result).toContain("Message 5");
    expect(result).toContain("Message 9");
  });

  test("labels agent messages as Assistant", () => {
    const runtime = createMockRuntime({ agentId: "agent-001" });
    const message = createMockMessage({ content: { text: "Next" } });
    const state = createMockState({
      data: {
        recentMessages: [
          { entityId: "agent-001", content: { text: "Bot response" } },
        ],
      },
    });

    const result = buildConversationContext(runtime, message, state);
    expect(result).toContain("Assistant: Bot response");
  });

  test("labels non-agent messages as User", () => {
    const runtime = createMockRuntime({ agentId: "agent-001" });
    const message = createMockMessage({ content: { text: "Next" } });
    const state = createMockState({
      data: {
        recentMessages: [
          { entityId: "someone-else", content: { text: "User msg" } },
        ],
      },
    });

    const result = buildConversationContext(runtime, message, state);
    expect(result).toContain("User: User msg");
  });
});
