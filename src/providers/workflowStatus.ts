import { type IAgentRuntime, logger, type Provider } from "@elizaos/core";
import {
  N8N_WORKFLOW_SERVICE_TYPE,
  type N8nWorkflowService,
} from "../services/index.js";

export const workflowStatusProvider: Provider = {
  name: "n8n_workflow_status",

  get: async (runtime: IAgentRuntime, _message?: unknown): Promise<string> => {
    try {
      const service = runtime.getService<N8nWorkflowService>(
        N8N_WORKFLOW_SERVICE_TYPE,
      );

      if (!service) {
        logger.warn("N8n Workflow service not available for provider");
        return "";
      }

      // Get workflows (optionally filtered by user if message has userId)
      const userId =
        _message && typeof _message === "object" && "userId" in _message
          ? (_message.userId as string)
          : undefined;

      const workflows = await service.listWorkflows(userId);

      if (workflows.length === 0) {
        return "No n8n workflows configured yet.";
      }

      let status = `Current n8n workflows (${workflows.length}):\n\n`;

      for (const workflow of workflows.slice(0, 10)) {
        // Limit to 10 for context
        const statusEmoji = workflow.active ? "✅" : "⏸️";
        status += `${statusEmoji} ${workflow.name} (ID: ${workflow.id})\n`;
        status += `   Nodes: ${workflow.nodes?.length || 0}\n`;

        // Try to get last execution (if possible)
        try {
          const executions = await service.getWorkflowExecutions(
            workflow.id,
            1,
          );
          if (executions.length > 0) {
            const lastExec = executions[0];
            const execEmoji =
              lastExec.status === "success"
                ? "✅"
                : lastExec.status === "error"
                  ? "❌"
                  : "⏳";
            status += `   Last run: ${execEmoji} ${lastExec.status} at ${new Date(lastExec.startedAt).toLocaleString()}\n`;
          }
        } catch (error) {
          // Ignore execution fetch errors
          logger.debug(
            `Could not fetch executions for workflow ${workflow.id}`,
          );
        }

        status += `\n`;
      }

      if (workflows.length > 10) {
        status += `\n... and ${workflows.length - 10} more workflows.`;
      }

      return status;
    } catch (error) {
      logger.error(
        `Failed to get workflow status: ${error instanceof Error ? error.message : String(error)}`,
      );
      return "";
    }
  },
};

export default workflowStatusProvider;
