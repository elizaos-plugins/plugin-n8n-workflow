import { type IAgentRuntime, logger, type Plugin } from "@elizaos/core";
import { N8nWorkflowService } from "./services/index.js";
import {
  createWorkflowAction,
  listWorkflowsAction,
  getExecutionsAction,
  activateWorkflowAction,
  deactivateWorkflowAction,
  deleteWorkflowAction,
  executeWorkflowAction,
  listCredentialsAction,
} from "./actions/index.js";
import {
  workflowStatusProvider,
  capabilitiesProvider,
} from "./providers/index.js";

/**
 * n8n Workflow Plugin for ElizaOS
 *
 * Generate and manage n8n workflows from natural language using RAG pipeline.
 * Supports workflow CRUD, execution management, and credential resolution.
 *
 * **Required Configuration:**
 * - `N8N_API_KEY`: Your n8n API key
 * - `N8N_HOST`: Your n8n instance URL (e.g., https://your.n8n.cloud)
 *
 * **Optional Configuration:**
 * - `n8n.credentials`: Pre-configured credential IDs for local mode
 *
 * **Example Character Configuration:**
 * ```json
 * {
 *   "name": "AI Workflow Builder",
 *   "plugins": ["@elizaos/plugin-n8n-workflow"],
 *   "settings": {
 *     "N8N_API_KEY": "env:N8N_API_KEY",
 *     "N8N_HOST": "https://your.n8n.cloud",
 *     "n8n": {
 *       "credentials": {
 *         "gmailOAuth2Api": "cred_gmail_123",
 *         "stripeApi": "cred_stripe_456"
 *       }
 *     }
 *   }
 * }
 * ```
 */
export const n8nWorkflowPlugin: Plugin = {
  name: "n8n-workflow",
  description:
    "Generate and deploy n8n workflows from natural language. " +
    "Supports 450+ native n8n nodes (Gmail, Slack, Stripe, etc.) with intelligent " +
    "credential resolution and workflow management.",

  services: [N8nWorkflowService],

  actions: [
    createWorkflowAction,
    listWorkflowsAction,
    getExecutionsAction,
    activateWorkflowAction,
    deactivateWorkflowAction,
    deleteWorkflowAction,
    executeWorkflowAction,
    listCredentialsAction,
  ],

  providers: [workflowStatusProvider, capabilitiesProvider],

  init: async (
    _config: Record<string, string>,
    runtime: IAgentRuntime,
  ): Promise<void> => {
    const apiKey = runtime.getSetting("N8N_API_KEY");
    const host = runtime.getSetting("N8N_HOST");

    logger.info(
      `n8n Workflow Plugin - API Key: ${apiKey ? "configured" : "not configured"}, Host: ${host || "not set"}`,
    );

    if (!apiKey) {
      logger.warn(
        "N8N_API_KEY not provided - plugin will not be functional. " +
          "Please set N8N_API_KEY in your environment or character settings.",
      );
    }

    if (!host) {
      logger.warn(
        "N8N_HOST not provided - plugin will not be functional. " +
          "Please set N8N_HOST to your n8n instance URL (e.g., https://your.n8n.cloud).",
      );
    }

    // Check for pre-configured credentials (optional)
    const n8nSettings = runtime.getSetting("n8n");
    if (
      n8nSettings &&
      typeof n8nSettings === "object" &&
      "credentials" in n8nSettings
    ) {
      const credCount = Object.keys(
        n8nSettings.credentials as Record<string, string>,
      ).length;
      logger.info(
        `n8n Workflow Plugin - Pre-configured credentials: ${credCount} credential types`,
      );
    }

    logger.info("n8n Workflow Plugin initialized successfully");
  },
};

export default n8nWorkflowPlugin;
