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
        text: "Delete workflow abc123",
      },
    },
    {
      name: "{{agent}}",
      content: {
        text: "I'll delete that workflow for you.",
        actions: ["DELETE_N8N_WORKFLOW"],
      },
    },
  ],
];

export const deleteWorkflowAction: Action = {
  name: "DELETE_N8N_WORKFLOW",
  similes: ["DELETE_WORKFLOW", "REMOVE_WORKFLOW", "DESTROY_WORKFLOW"],
  description:
    "Delete an n8n workflow permanently. This action cannot be undone.",

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
      (text.includes("delete") || text.includes("remove")) &&
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

      await service.deleteWorkflow(workflowId);

      logger.info(`Deleted workflow ${workflowId}`);

      if (callback) {
        await callback({
          text: `🗑️  Workflow ${workflowId} has been deleted permanently.`,
        });
      }

      return { success: true };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      logger.error(`Failed to delete workflow: ${errorMessage}`);

      if (callback) {
        await callback({
          text: `Failed to delete workflow: ${errorMessage}`,
        });
      }

      return { success: false };
    }
  },

  examples,
};

export default deleteWorkflowAction;
