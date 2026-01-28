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
        text: "Show me the execution history for workflow abc123",
      },
    },
    {
      name: "{{agent}}",
      content: {
        text: "I'll fetch the execution history for that workflow.",
        actions: ["GET_N8N_EXECUTIONS"],
      },
    },
  ],
];

export const getExecutionsAction: Action = {
  name: "GET_N8N_EXECUTIONS",
  similes: [
    "GET_EXECUTIONS",
    "SHOW_EXECUTIONS",
    "EXECUTION_HISTORY",
    "WORKFLOW_RUNS",
    "WORKFLOW_EXECUTIONS",
  ],
  description:
    "Get execution history for an n8n workflow. Shows status, start time, and error messages if any.",

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
      (text.includes("execution") ||
        text.includes("run") ||
        text.includes("history")) &&
      (text.includes("workflow") ||
        text.includes("show") ||
        text.includes("get"))
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
      logger.error(
        { src: "plugin:n8n-workflow:action:get-executions" },
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

      const executions = await service.getWorkflowExecutions(workflowId, 10);

      logger.info(
        { src: "plugin:n8n-workflow:action:get-executions" },
        `Retrieved ${executions.length} executions for workflow ${workflowId}`,
      );

      if (executions.length === 0) {
        if (callback) {
          await callback({
            text: `No executions found for workflow ${workflowId}. The workflow may not have run yet.`,
          });
        }
        return { success: true, data: { executions: [] } };
      }

      let responseText = `📊 **Execution History** (Last ${executions.length} runs)\n\n`;

      for (const execution of executions) {
        const statusEmoji =
          execution.status === "success"
            ? "✅"
            : execution.status === "error"
              ? "❌"
              : execution.status === "running"
                ? "⏳"
                : "⏸️";

        responseText += `${statusEmoji} ${execution.status.toUpperCase()}\n`;
        responseText += `   Execution ID: ${execution.id}\n`;
        responseText += `   Started: ${new Date(execution.startedAt).toLocaleString()}\n`;

        if (execution.stoppedAt) {
          responseText += `   Finished: ${new Date(execution.stoppedAt).toLocaleString()}\n`;
        }

        if (execution.data?.resultData?.error) {
          responseText += `   Error: ${execution.data.resultData.error.message}\n`;
        }

        responseText += "\n";
      }

      if (callback) {
        await callback({
          text: responseText,
        });
      }

      return {
        success: true,
        data: { executions },
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      logger.error(
        { src: "plugin:n8n-workflow:action:get-executions" },
        `Failed to get executions: ${errorMessage}`,
      );

      if (callback) {
        await callback({
          text: `Failed to get executions: ${errorMessage}`,
        });
      }

      return { success: false };
    }
  },

  examples,
};

export default getExecutionsAction;
