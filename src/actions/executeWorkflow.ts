import {
  type Action,
  type ActionExample,
  type ActionResult,
  type HandlerCallback,
  type IAgentRuntime,
  logger,
  type Memory,
  type State,
} from "@elizaos/core";
import {
  N8N_WORKFLOW_SERVICE_TYPE,
  type N8nWorkflowService,
} from "../services/index";

const examples: ActionExample[][] = [
  [
    {
      name: "{{user1}}",
      content: {
        text: "Run workflow abc123 manually",
      },
    },
    {
      name: "{{agent}}",
      content: {
        text: "I'll execute that workflow for you.",
        actions: ["EXECUTE_N8N_WORKFLOW"],
      },
    },
  ],
];

export const executeWorkflowAction: Action = {
  name: "EXECUTE_N8N_WORKFLOW",
  similes: [
    "EXECUTE_WORKFLOW",
    "RUN_WORKFLOW",
    "TRIGGER_WORKFLOW",
    "MANUAL_RUN_WORKFLOW",
  ],
  description:
    "Manually execute an n8n workflow. Runs the workflow immediately, regardless of triggers.",

  validate: async (runtime: IAgentRuntime): Promise<boolean> => {
    return !!runtime.getService(N8N_WORKFLOW_SERVICE_TYPE);
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
      logger.error(
        { src: "plugin:n8n-workflow:action:execute" },
        "N8n Workflow service not available",
      );
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

      const execution = await service.executeWorkflow(workflowId);

      logger.info(
        { src: "plugin:n8n-workflow:action:execute" },
        `Executed workflow ${workflowId}, execution ID: ${execution.id}`,
      );

      if (callback) {
        await callback({
          text: `▶️  Workflow ${workflowId} has been triggered.\n\nExecution ID: ${execution.id}\nStatus: ${execution.status}`,
        });
      }

      return {
        success: true,
        data: { execution },
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      logger.error(
        { src: "plugin:n8n-workflow:action:execute" },
        `Failed to execute workflow: ${errorMessage}`,
      );

      if (callback) {
        await callback({
          text: `Failed to execute workflow: ${errorMessage}`,
        });
      }

      return { success: false };
    }
  },

  examples,
};

export default executeWorkflowAction;
