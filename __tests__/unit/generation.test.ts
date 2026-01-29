import { describe, test, expect, mock } from "bun:test";
import {
  extractKeywords,
  matchWorkflow,
  generateWorkflow,
} from "../../src/utils/generation";
import { createMockRuntime } from "../helpers/mockRuntime";
import { createTriggerNode, createGmailNode } from "../fixtures/workflows";
import type { ModelType } from "@elizaos/core";

// ============================================================================
// extractKeywords
// ============================================================================

describe("extractKeywords", () => {
  test("returns keywords from valid LLM response", async () => {
    const runtime = createMockRuntime({
      useModel: mock(() =>
        Promise.resolve({ keywords: ["gmail", "stripe", "send"] }),
      ),
    });

    const result = await extractKeywords(runtime, "Send Stripe via Gmail");
    expect(result).toEqual(["gmail", "stripe", "send"]);
  });

  test("trims and filters empty keywords", async () => {
    const runtime = createMockRuntime({
      useModel: mock(() =>
        Promise.resolve({ keywords: [" gmail ", "", "  slack  ", " "] }),
      ),
    });

    const result = await extractKeywords(runtime, "Gmail and Slack");
    expect(result).toEqual(["gmail", "slack"]);
  });

  test("limits to 5 keywords", async () => {
    const runtime = createMockRuntime({
      useModel: mock(() =>
        Promise.resolve({
          keywords: ["a", "b", "c", "d", "e", "f", "g"],
        }),
      ),
    });

    const result = await extractKeywords(runtime, "Many keywords");
    expect(result).toHaveLength(5);
  });

  test("throws when LLM returns null", async () => {
    const runtime = createMockRuntime({
      useModel: mock(() => Promise.resolve(null)),
    });

    expect(extractKeywords(runtime, "test")).rejects.toThrow(
      "Invalid keyword extraction response",
    );
  });

  test("throws when LLM returns object without keywords", async () => {
    const runtime = createMockRuntime({
      useModel: mock(() => Promise.resolve({ result: "no keywords field" })),
    });

    expect(extractKeywords(runtime, "test")).rejects.toThrow(
      "Invalid keyword extraction response",
    );
  });

  test("throws when keywords contains non-strings", async () => {
    const runtime = createMockRuntime({
      useModel: mock(() => Promise.resolve({ keywords: ["valid", 42, null] })),
    });

    expect(extractKeywords(runtime, "test")).rejects.toThrow(
      "non-string elements",
    );
  });
});

// ============================================================================
// matchWorkflow
// ============================================================================

describe("matchWorkflow", () => {
  test("returns no-match for empty workflow list", async () => {
    const runtime = createMockRuntime();
    const result = await matchWorkflow(runtime, "Activate Stripe", []);

    expect(result.matchedWorkflowId).toBeNull();
    expect(result.confidence).toBe("none");
    expect(result.matches).toHaveLength(0);
    expect(result.reason).toContain("No workflows available");
  });

  test("calls useModel with workflow list in prompt", async () => {
    const useModel = mock(() =>
      Promise.resolve({
        matchedWorkflowId: "wf-001",
        confidence: "high",
        matches: [{ id: "wf-001", name: "Stripe", score: 0.9 }],
        reason: "matched",
      }),
    );
    const runtime = createMockRuntime({ useModel });

    const workflows = [
      {
        id: "wf-001",
        name: "Stripe Payments",
        active: true,
        nodes: [],
        connections: {},
      },
      {
        id: "wf-002",
        name: "Gmail Auto",
        active: false,
        nodes: [],
        connections: {},
      },
    ];

    await matchWorkflow(runtime, "Activate Stripe", workflows as any);

    // Verify useModel was called
    expect(useModel).toHaveBeenCalledTimes(1);
    // Verify the prompt includes workflow names
    const callArgs = useModel.mock.calls[0] as any[];
    const params = callArgs[1] as { prompt: string };
    expect(params.prompt).toContain("Stripe Payments");
    expect(params.prompt).toContain("Gmail Auto");
    expect(params.prompt).toContain("ACTIVE");
    expect(params.prompt).toContain("INACTIVE");
  });

  test("returns graceful failure when LLM throws", async () => {
    const runtime = createMockRuntime({
      useModel: mock(() => Promise.reject(new Error("LLM timeout"))),
    });

    const workflows = [
      {
        id: "wf-001",
        name: "Test",
        active: true,
        nodes: [],
        connections: {},
      },
    ];

    const result = await matchWorkflow(
      runtime,
      "Activate Test",
      workflows as any,
    );

    expect(result.matchedWorkflowId).toBeNull();
    expect(result.confidence).toBe("none");
    expect(result.reason).toContain("LLM timeout");
  });

  test("passes through LLM match result", async () => {
    const matchResult = {
      matchedWorkflowId: "wf-002",
      confidence: "medium",
      matches: [{ id: "wf-002", name: "Gmail", score: 0.7 }],
      reason: "Partial match by name",
    };
    const runtime = createMockRuntime({
      useModel: mock(() => Promise.resolve(matchResult)),
    });

    const workflows = [
      {
        id: "wf-002",
        name: "Gmail",
        active: true,
        nodes: [],
        connections: {},
      },
    ];

    const result = await matchWorkflow(
      runtime,
      "the Gmail one",
      workflows as any,
    );

    expect(result.matchedWorkflowId).toBe("wf-002");
    expect(result.confidence).toBe("medium");
  });
});

// ============================================================================
// generateWorkflow
// ============================================================================

describe("generateWorkflow", () => {
  test("parses valid JSON response", async () => {
    const workflowJson = JSON.stringify({
      name: "Test Workflow",
      nodes: [
        { name: "Start", type: "n8n-nodes-base.start", position: [0, 0] },
      ],
      connections: {},
    });

    const runtime = createMockRuntime({
      useModel: mock(() => Promise.resolve(workflowJson)),
    });

    const result = await generateWorkflow(runtime, "test", []);
    expect(result.name).toBe("Test Workflow");
    expect(result.nodes).toHaveLength(1);
  });

  test("strips markdown code fences from response", async () => {
    const workflowJson = `\`\`\`json
{
  "name": "Fenced",
  "nodes": [{ "name": "A", "type": "t", "position": [0, 0] }],
  "connections": {}
}
\`\`\``;

    const runtime = createMockRuntime({
      useModel: mock(() => Promise.resolve(workflowJson)),
    });

    const result = await generateWorkflow(runtime, "test", []);
    expect(result.name).toBe("Fenced");
  });

  test("throws when response is not valid JSON", async () => {
    const runtime = createMockRuntime({
      useModel: mock(() => Promise.resolve("not json at all")),
    });

    expect(generateWorkflow(runtime, "test", [])).rejects.toThrow(
      "Failed to parse workflow JSON",
    );
  });

  test("throws when workflow has no nodes array", async () => {
    const runtime = createMockRuntime({
      useModel: mock(() =>
        Promise.resolve(JSON.stringify({ name: "Bad", connections: {} })),
      ),
    });

    expect(generateWorkflow(runtime, "test", [])).rejects.toThrow(
      "missing or invalid nodes array",
    );
  });

  test("throws when workflow has no connections object", async () => {
    const runtime = createMockRuntime({
      useModel: mock(() =>
        Promise.resolve(
          JSON.stringify({ name: "Bad", nodes: [{ name: "A" }] }),
        ),
      ),
    });

    expect(generateWorkflow(runtime, "test", [])).rejects.toThrow(
      "missing or invalid connections object",
    );
  });

  test("includes relevant nodes in prompt", async () => {
    const useModel = mock(() =>
      Promise.resolve(
        JSON.stringify({
          name: "WF",
          nodes: [{ name: "A", type: "t", position: [0, 0] }],
          connections: {},
        }),
      ),
    );
    const runtime = createMockRuntime({ useModel });

    const nodes = [
      {
        name: "n8n-nodes-base.gmail",
        displayName: "Gmail",
        description: "Send email",
        group: ["output"],
        properties: [],
      },
    ];

    await generateWorkflow(runtime, "send email", nodes as any);

    const callArgs = useModel.mock.calls[0] as any[];
    const params = callArgs[1] as { prompt: string };
    expect(params.prompt).toContain("Gmail");
    expect(params.prompt).toContain("Send email");
  });
});
