import {
  type Action,
  type ActionExample,
  type ActionResult,
  type Content,
  type HandlerCallback,
  type IAgentRuntime,
  logger,
  type Memory,
  type State,
} from "@elizaos/core";
import {
  N8N_WORKFLOW_SERVICE_TYPE,
  type N8nWorkflowService,
} from "../services/index.js";

const examples: ActionExample[][] = [
  [
    {
      name: "{{user1}}",
      content: {
        text: "Pause workflow abc123",
      },
    },
    {
      name: "{{agent}}",
      content: {
        text: "I'll deactivate that workflow for you.",
        actions: ["DEACTIVATE_N8N_WORKFLOW"],
      },
    },
  ],
];

export const deactivateWorkflowAction: Action = {
  name: "DEACTIVATE_N8N_WORKFLOW",
  similes: [
    "DEACTIVATE_WORKFLOW",
    "DISABLE_WORKFLOW",
    "STOP_WORKFLOW",
    "PAUSE_WORKFLOW",
    "TURN_OFF_WORKFLOW",
  ],
  description:
    "Deactivate an n8n workflow to stop it from processing triggers and running automatically.",

  validate: async (
    runtime: IAgentRuntime,
    message: Memory,
    _state?: State,
  ): Promise<boolean> => {
    const service = runtime.getService(N8N_WORKFLOW_SERVICE_TYPE);
    if (!service) {
      return false;
    }

    const text = (message.content as Content).text?.toLowerCase() ?? "";
    return (
      (text.includes("deactivate") ||
        text.includes("disable") ||
        text.includes("stop") ||
        text.includes("pause") ||
        text.includes("turn off")) &&
      text.includes("workflow")
    );
  },

  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    state: State | undefined,
    _options?: unknown,
    callback?: HandlerCallback,
  ): Promise<ActionResult> => {
    const service = runtime.getService<N8nWorkflowService>(
      N8N_WORKFLOW_SERVICE_TYPE,
    );

    if (!service) {
      logger.error("N8n Workflow service not available");
      if (callback) {
        await callback({
          text: "N8n Workflow service is not available.",
        });
      }
      return { success: false };
    }

    try {
      const workflowId = (state?.workflowId as string) || "";

      if (!workflowId) {
        if (callback) {
          await callback({
            text: "Please provide a workflow ID.",
          });
        }
        return { success: false };
      }

      await service.deactivateWorkflow(workflowId);

      logger.info(`Deactivated workflow ${workflowId}`);

      if (callback) {
        await callback({
          text: `⏸️  Workflow ${workflowId} has been deactivated and will no longer run automatically.`,
        });
      }

      return { success: true };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      logger.error(`Failed to deactivate workflow: ${errorMessage}`);

      if (callback) {
        await callback({
          text: `Failed to deactivate workflow: ${errorMessage}`,
        });
      }

      return { success: false };
    }
  },

  examples,
};

export default deactivateWorkflowAction;
