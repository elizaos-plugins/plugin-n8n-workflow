import { describe, test, expect, mock } from "bun:test";
import { createWorkflowAction } from "../../../src/actions/createWorkflow";
import { N8N_WORKFLOW_SERVICE_TYPE } from "../../../src/services/n8n-workflow-service";
import {
  createMockRuntime,
  createMockMessage,
  createMockState,
  createMockCallback,
} from "../../helpers/mockRuntime";
import { createMockService } from "../../helpers/mockService";

describe("CREATE_N8N_WORKFLOW action", () => {
  describe("validate", () => {
    test("returns true when service is available", async () => {
      const runtime = createMockRuntime({
        services: { [N8N_WORKFLOW_SERVICE_TYPE]: createMockService() },
      });
      const result = await createWorkflowAction.validate(runtime, {} as any);
      expect(result).toBe(true);
    });

    test("returns false when service is unavailable", async () => {
      const runtime = createMockRuntime();
      const result = await createWorkflowAction.validate(runtime, {} as any);
      expect(result).toBe(false);
    });
  });

  describe("handler", () => {
    test("creates workflow from prompt successfully", async () => {
      const mockService = createMockService();
      const runtime = createMockRuntime({
        services: { [N8N_WORKFLOW_SERVICE_TYPE]: mockService },
      });
      const message = createMockMessage({
        content: {
          text: "Create a workflow that sends Stripe summaries via Gmail",
        },
      });
      const callback = createMockCallback();

      const result = await createWorkflowAction.handler(
        runtime,
        message,
        createMockState(),
        {},
        callback,
      );

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(mockService.createWorkflowFromPrompt).toHaveBeenCalledWith(
        "Create a workflow that sends Stripe summaries via Gmail",
        "user-001",
      );
      expect(callback).toHaveBeenCalled();
    });

    test("fails when prompt is empty", async () => {
      const runtime = createMockRuntime({
        services: { [N8N_WORKFLOW_SERVICE_TYPE]: createMockService() },
      });
      const message = createMockMessage({ content: { text: "" } });
      const callback = createMockCallback();

      const result = await createWorkflowAction.handler(
        runtime,
        message,
        createMockState(),
        {},
        callback,
      );

      expect(result.success).toBe(false);
      expect(callback).toHaveBeenCalled();
      const callbackText = (callback as any).mock.calls[0][0].text;
      expect(callbackText).toContain("description");
    });

    test("fails when service is unavailable", async () => {
      const runtime = createMockRuntime();
      const message = createMockMessage({
        content: { text: "Create a workflow" },
      });
      const callback = createMockCallback();

      const result = await createWorkflowAction.handler(
        runtime,
        message,
        createMockState(),
        {},
        callback,
      );

      expect(result.success).toBe(false);
    });

    test("reports missing credentials in response", async () => {
      const mockService = createMockService({
        createWorkflowFromPrompt: mock(() =>
          Promise.resolve({
            id: "wf-001",
            name: "Test",
            active: false,
            nodeCount: 2,
            missingCredentials: ["gmailOAuth2Api", "stripeApi"],
          }),
        ),
      });
      const runtime = createMockRuntime({
        services: { [N8N_WORKFLOW_SERVICE_TYPE]: mockService },
      });
      const message = createMockMessage({
        content: { text: "Create Gmail + Stripe workflow" },
      });
      const callback = createMockCallback();

      await createWorkflowAction.handler(
        runtime,
        message,
        createMockState(),
        {},
        callback,
      );

      // Find the second callback call (first is "Analyzing...", second is result)
      const calls = (callback as any).mock.calls;
      const resultCall = calls[calls.length - 1][0].text;
      expect(resultCall).toContain("gmailOAuth2Api");
      expect(resultCall).toContain("stripeApi");
    });

    test("handles service error gracefully", async () => {
      const mockService = createMockService({
        createWorkflowFromPrompt: mock(() =>
          Promise.reject(new Error("LLM generation failed")),
        ),
      });
      const runtime = createMockRuntime({
        services: { [N8N_WORKFLOW_SERVICE_TYPE]: mockService },
      });
      const message = createMockMessage({
        content: { text: "Create a workflow" },
      });
      const callback = createMockCallback();

      const result = await createWorkflowAction.handler(
        runtime,
        message,
        createMockState(),
        {},
        callback,
      );

      expect(result.success).toBe(false);
      const calls = (callback as any).mock.calls;
      const errorText = calls[calls.length - 1][0].text;
      expect(errorText).toContain("LLM generation failed");
    });
  });
});
