import {
  type IAgentRuntime,
  logger,
  type Metadata,
  ModelType,
  Service,
  type UUID,
} from "@elizaos/core";
import { N8nApiClient } from "../api/index.js";
import { searchNodes } from "../catalog/index.js";
import { extractKeywords, generateWorkflow } from "../generation/index.js";
import { positionNodes, validateWorkflow } from "../workflow/index.js";
import { resolveCredentials } from "../credentials/index.js";
import type {
  N8nWorkflow,
  N8nExecution,
  N8nCredential,
  WorkflowCreationResult,
} from "../types/index.js";

export const N8N_WORKFLOW_SERVICE_TYPE = "n8n_workflow";

/**
 * Configuration for the N8n Workflow Service
 */
export interface N8nWorkflowServiceConfig {
  apiKey: string;
  host: string;
  credentials?: Record<string, string>; // Pre-configured credential IDs
}

/**
 * N8n Workflow Service - Orchestrates the RAG pipeline for workflow generation
 *
 * Pipeline:
 * 1. Extract keywords from user prompt (LLM - OBJECT_SMALL)
 * 2. Search node catalog for relevant nodes (local search)
 * 3. Generate workflow JSON (LLM - TEXT_LARGE)
 * 4. Validate workflow structure
 * 5. Position nodes on canvas
 * 6. Resolve credentials (cloud/local/placeholder)
 * 7. Deploy to n8n Cloud via REST API
 */
export class N8nWorkflowService extends Service {
  static override readonly serviceType = N8N_WORKFLOW_SERVICE_TYPE;

  override capabilityDescription =
    "Generate and deploy n8n workflows from natural language using RAG pipeline. " +
    "Supports workflow CRUD, execution management, and credential resolution.";

  private apiClient: N8nApiClient | null = null;
  private serviceConfig: N8nWorkflowServiceConfig | null = null;

  /**
   * Start the N8n Workflow Service
   */
  static async start(runtime: IAgentRuntime): Promise<N8nWorkflowService> {
    logger.info("Starting N8n Workflow Service...");

    // Validate configuration
    const apiKey = runtime.getSetting("N8N_API_KEY");
    const host = runtime.getSetting("N8N_HOST");

    if (!apiKey || typeof apiKey !== "string") {
      throw new Error("N8N_API_KEY is required in settings");
    }

    if (!host || typeof host !== "string") {
      throw new Error(
        "N8N_HOST is required in settings (e.g., https://your.n8n.cloud)",
      );
    }

    // Get optional pre-configured credentials
    const n8nSettings = runtime.getSetting("n8n");
    const credentials =
      n8nSettings &&
      typeof n8nSettings === "object" &&
      "credentials" in n8nSettings &&
      typeof n8nSettings.credentials === "object"
        ? (n8nSettings.credentials as Record<string, string>)
        : undefined;

    const service = new N8nWorkflowService(runtime);
    service.serviceConfig = {
      apiKey,
      host,
      credentials,
    };

    // Initialize API client
    service.apiClient = new N8nApiClient(apiKey, host);

    logger.info(`N8n Workflow Service started - connected to ${host}`);
    if (credentials) {
      logger.info(
        `Pre-configured credentials: ${Object.keys(credentials).join(", ")}`,
      );
    }

    return service;
  }

  override async stop(): Promise<void> {
    logger.info("Stopping N8n Workflow Service...");
    this.apiClient = null;
    this.serviceConfig = null;
    logger.info("N8n Workflow Service stopped");
  }

  /**
   * Get the API client (throws if service not initialized)
   */
  private getClient(): N8nApiClient {
    if (!this.apiClient) {
      throw new Error("N8n Workflow Service not initialized");
    }
    return this.apiClient;
  }

  /**
   * Get the service configuration (throws if service not initialized)
   */
  private getConfig(): N8nWorkflowServiceConfig {
    if (!this.serviceConfig) {
      throw new Error("N8n Workflow Service not initialized");
    }
    return this.serviceConfig;
  }

  /**
   * Main RAG pipeline: Create workflow from natural language prompt
   *
   * @param prompt - User's natural language request
   * @param userId - User ID for tagging and credential resolution
   * @returns Workflow creation result with ID and metadata
   */
  async createWorkflowFromPrompt(
    prompt: string,
    userId?: string,
  ): Promise<WorkflowCreationResult> {
    logger.info(
      `Creating workflow from prompt for user ${userId || "unknown"}`,
    );

    try {
      // Step 1: Extract keywords (LLM - OBJECT_SMALL)
      logger.debug("Step 1: Extracting keywords...");
      const keywords = await extractKeywords(this.runtime, prompt);
      logger.debug(`Extracted keywords: ${keywords.join(", ")}`);

      // Step 2: Search node catalog (local)
      logger.debug("Step 2: Searching node catalog...");
      const relevantNodes = searchNodes(keywords, 15);
      logger.debug(`Found ${relevantNodes.length} relevant nodes`);

      if (relevantNodes.length === 0) {
        throw new Error(
          "No relevant n8n nodes found for the given prompt. Please be more specific about the integrations you want to use (e.g., Gmail, Slack, Stripe).",
        );
      }

      // Step 3: Generate workflow JSON (LLM - TEXT_LARGE)
      logger.debug("Step 3: Generating workflow JSON...");
      const workflow = await generateWorkflow(
        this.runtime,
        prompt,
        relevantNodes,
      );
      logger.debug(
        `Generated workflow with ${workflow.nodes?.length || 0} nodes`,
      );

      // Step 4: Validate workflow structure
      logger.debug("Step 4: Validating workflow...");
      const validationResult = validateWorkflow(workflow);
      if (!validationResult.valid) {
        logger.error(
          `Validation errors: ${validationResult.errors.join(", ")}`,
        );
        throw new Error(
          `Generated workflow is invalid: ${validationResult.errors[0]}`,
        );
      }
      if (validationResult.warnings.length > 0) {
        logger.warn(
          `Validation warnings: ${validationResult.warnings.join(", ")}`,
        );
      }

      // Step 5: Position nodes on canvas
      logger.debug("Step 5: Positioning nodes...");
      const positionedWorkflow = positionNodes(workflow);

      // Step 6: Resolve credentials
      logger.debug("Step 6: Resolving credentials...");
      const config = this.getConfig();
      const workflowWithCredentials = await resolveCredentials(
        positionedWorkflow,
        config.credentials,
        undefined, // No OAuth service in this version
        userId,
      );

      // Step 7: Deploy to n8n Cloud
      logger.debug("Step 7: Deploying to n8n Cloud...");
      const client = this.getClient();
      const createdWorkflow = await client.createWorkflow(
        workflowWithCredentials,
      );

      // Tag workflow with user ID if provided
      if (userId) {
        try {
          // Check if tag exists, create if not
          const tags = await client.listTags();
          let userTag = tags.find((t) => t.name === `user:${userId}`);

          if (!userTag) {
            userTag = await client.createTag(`user:${userId}`);
          }

          // Assign tag to workflow
          await client.updateWorkflowTags(createdWorkflow.id, [userTag.id]);
          logger.debug(
            `Tagged workflow ${createdWorkflow.id} with user:${userId}`,
          );
        } catch (error) {
          logger.warn(
            `Failed to tag workflow: ${error instanceof Error ? error.message : String(error)}`,
          );
        }
      }

      logger.info(`Workflow created successfully: ${createdWorkflow.id}`);

      return {
        id: createdWorkflow.id,
        name: createdWorkflow.name,
        active: createdWorkflow.active,
        nodeCount: createdWorkflow.nodes?.length || 0,
        missingCredentials: this.getMissingCredentials(workflowWithCredentials),
      };
    } catch (error) {
      logger.error(
        `Failed to create workflow: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  /**
   * List workflows (optionally filtered by user)
   */
  async listWorkflows(userId?: string): Promise<N8nWorkflow[]> {
    const client = this.getClient();

    if (userId) {
      // Filter by user tag
      const tags = await client.listTags();
      const userTag = tags.find((t) => t.name === `user:${userId}`);

      if (!userTag) {
        return []; // No workflows for this user
      }

      // Get all workflows and filter by tag
      const allWorkflows = await client.listWorkflows();
      return allWorkflows.filter((w) =>
        w.tags?.some((t) => t.id === userTag.id),
      );
    }

    return client.listWorkflows();
  }

  /**
   * Activate a workflow
   */
  async activateWorkflow(workflowId: string): Promise<void> {
    const client = this.getClient();
    await client.activateWorkflow(workflowId);
    logger.info(`Workflow ${workflowId} activated`);
  }

  /**
   * Deactivate a workflow
   */
  async deactivateWorkflow(workflowId: string): Promise<void> {
    const client = this.getClient();
    await client.deactivateWorkflow(workflowId);
    logger.info(`Workflow ${workflowId} deactivated`);
  }

  /**
   * Delete a workflow
   */
  async deleteWorkflow(workflowId: string): Promise<void> {
    const client = this.getClient();
    await client.deleteWorkflow(workflowId);
    logger.info(`Workflow ${workflowId} deleted`);
  }

  /**
   * Execute a workflow manually
   */
  async executeWorkflow(workflowId: string): Promise<N8nExecution> {
    const client = this.getClient();
    const execution = await client.executeWorkflow(workflowId);
    logger.info(
      `Workflow ${workflowId} executed - execution ID: ${execution.id}`,
    );
    return execution;
  }

  /**
   * Get execution history for a workflow
   */
  async getWorkflowExecutions(
    workflowId: string,
    limit?: number,
  ): Promise<N8nExecution[]> {
    const client = this.getClient();
    return client.listExecutions({ workflowId, limit });
  }

  /**
   * Get detailed execution information
   */
  async getExecutionDetail(executionId: string): Promise<N8nExecution> {
    const client = this.getClient();
    return client.getExecution(executionId);
  }

  /**
   * List available credentials (for local mode)
   */
  async listCredentials(): Promise<N8nCredential[]> {
    const client = this.getClient();
    return client.listCredentials();
  }

  /**
   * Helper: Extract missing credential types from a workflow
   */
  private getMissingCredentials(workflow: N8nWorkflow): string[] {
    const missing: Set<string> = new Set();

    for (const node of workflow.nodes || []) {
      if (node.credentials) {
        for (const [credType, credRef] of Object.entries(node.credentials)) {
          if (
            typeof credRef === "object" &&
            "id" in credRef &&
            credRef.id === "PLACEHOLDER"
          ) {
            missing.add(credType);
          }
        }
      }
    }

    return Array.from(missing);
  }
}
