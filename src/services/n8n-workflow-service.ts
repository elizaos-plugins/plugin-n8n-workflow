import { type IAgentRuntime, logger, Service } from '@elizaos/core';
import { N8nApiClient } from '../utils/api';
import { searchNodes } from '../utils/catalog';
import { extractKeywords, generateWorkflow } from '../utils/generation';
import { positionNodes, validateWorkflow } from '../utils/workflow';
import { resolveCredentials, getMissingCredentials } from '../utils/credentialResolver';
import type { N8nWorkflowResponse, N8nExecution, WorkflowCreationResult } from '../types/index';

export const N8N_WORKFLOW_SERVICE_TYPE = 'n8n_workflow';

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
    'Generate and deploy n8n workflows from natural language using RAG pipeline. ' +
    'Supports workflow CRUD, execution management, and credential resolution.';

  private apiClient: N8nApiClient | null = null;
  private serviceConfig: N8nWorkflowServiceConfig | null = null;

  /**
   * Start the N8n Workflow Service
   */
  static async start(runtime: IAgentRuntime): Promise<N8nWorkflowService> {
    logger.info({ src: 'plugin:n8n-workflow:service:main' }, 'Starting N8n Workflow Service...');

    // Validate configuration
    const apiKey = runtime.getSetting('N8N_API_KEY');
    const host = runtime.getSetting('N8N_HOST');

    if (!apiKey || typeof apiKey !== 'string') {
      throw new Error('N8N_API_KEY is required in settings');
    }

    if (!host || typeof host !== 'string') {
      throw new Error('N8N_HOST is required in settings (e.g., https://your.n8n.cloud)');
    }

    // Get optional pre-configured credentials
    const n8nSettings = runtime.getSetting('n8n') as
      | { credentials?: Record<string, string> }
      | undefined;
    const credentials = n8nSettings?.credentials;

    const service = new N8nWorkflowService(runtime);
    service.serviceConfig = {
      apiKey,
      host,
      credentials,
    };

    // Initialize API client
    service.apiClient = new N8nApiClient(host, apiKey);

    logger.info(
      { src: 'plugin:n8n-workflow:service:main' },
      `N8n Workflow Service started - connected to ${host}`
    );
    if (credentials) {
      logger.info(
        { src: 'plugin:n8n-workflow:service:main' },
        `Pre-configured credentials: ${Object.keys(credentials).join(', ')}`
      );
    }

    return service;
  }

  override async stop(): Promise<void> {
    logger.info({ src: 'plugin:n8n-workflow:service:main' }, 'Stopping N8n Workflow Service...');
    this.apiClient = null;
    this.serviceConfig = null;
    logger.info({ src: 'plugin:n8n-workflow:service:main' }, 'N8n Workflow Service stopped');
  }

  /**
   * Get the API client (throws if service not initialized)
   */
  private getClient(): N8nApiClient {
    if (!this.apiClient) {
      throw new Error('N8n Workflow Service not initialized');
    }
    return this.apiClient;
  }

  /**
   * Get the service configuration (throws if service not initialized)
   */
  private getConfig(): N8nWorkflowServiceConfig {
    if (!this.serviceConfig) {
      throw new Error('N8n Workflow Service not initialized');
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
  async createWorkflowFromPrompt(prompt: string, userId?: string): Promise<WorkflowCreationResult> {
    logger.info(
      { src: 'plugin:n8n-workflow:service:main' },
      `Creating workflow from prompt for user ${userId || 'unknown'}`
    );

    try {
      // Step 1: Extract keywords (LLM - OBJECT_SMALL)
      logger.debug({ src: 'plugin:n8n-workflow:service:main' }, 'Step 1: Extracting keywords...');
      const keywords = await extractKeywords(this.runtime, prompt);
      logger.debug(
        { src: 'plugin:n8n-workflow:service:main' },
        `Extracted keywords: ${keywords.join(', ')}`
      );

      // Step 2: Search node catalog (local)
      logger.debug(
        { src: 'plugin:n8n-workflow:service:main' },
        'Step 2: Searching node catalog...'
      );
      const relevantNodes = searchNodes(keywords, 15);
      logger.debug(
        { src: 'plugin:n8n-workflow:service:main' },
        `Found ${relevantNodes.length} relevant nodes`
      );

      if (relevantNodes.length === 0) {
        throw new Error(
          'No relevant n8n nodes found for the given prompt. Please be more specific about the integrations you want to use (e.g., Gmail, Slack, Stripe).'
        );
      }

      // Step 3: Generate workflow JSON (LLM - TEXT_LARGE)
      logger.debug(
        { src: 'plugin:n8n-workflow:service:main' },
        'Step 3: Generating workflow JSON...'
      );
      const workflow = await generateWorkflow(
        this.runtime,
        prompt,
        relevantNodes.map((r) => r.node)
      );
      logger.debug(
        { src: 'plugin:n8n-workflow:service:main' },
        `Generated workflow with ${workflow.nodes?.length || 0} nodes`
      );

      // Step 4: Validate workflow structure
      logger.debug({ src: 'plugin:n8n-workflow:service:main' }, 'Step 4: Validating workflow...');
      const validationResult = validateWorkflow(workflow);
      if (!validationResult.valid) {
        logger.error(
          { src: 'plugin:n8n-workflow:service:main' },
          `Validation errors: ${validationResult.errors.join(', ')}`
        );
        throw new Error(`Generated workflow is invalid: ${validationResult.errors[0]}`);
      }
      if (validationResult.warnings.length > 0) {
        logger.warn(
          { src: 'plugin:n8n-workflow:service:main' },
          `Validation warnings: ${validationResult.warnings.join(', ')}`
        );
      }

      // Step 5: Position nodes on canvas
      logger.debug({ src: 'plugin:n8n-workflow:service:main' }, 'Step 5: Positioning nodes...');
      const positionedWorkflow = positionNodes(workflow);

      // Step 6: Resolve credentials
      logger.debug({ src: 'plugin:n8n-workflow:service:main' }, 'Step 6: Resolving credentials...');
      const config = this.getConfig();
      const client = this.getClient();
      const credentialResult = await resolveCredentials(
        positionedWorkflow,
        userId || '',
        this.runtime,
        client,
        config
      );

      // Step 7: Deploy to n8n Cloud
      logger.debug(
        { src: 'plugin:n8n-workflow:service:main' },
        'Step 7: Deploying to n8n Cloud...'
      );
      const createdWorkflow = await client.createWorkflow(credentialResult.workflow);

      // Tag workflow with user ID if provided
      if (userId) {
        try {
          // Check if tag exists, create if not
          const tagsResponse = await client.listTags();
          let userTag = tagsResponse.data.find((t) => t.name === `user:${userId}`);

          if (!userTag) {
            userTag = await client.createTag(`user:${userId}`);
          }

          // Assign tag to workflow
          await client.updateWorkflowTags(createdWorkflow.id, [userTag.id]);
          logger.debug(
            { src: 'plugin:n8n-workflow:service:main' },
            `Tagged workflow ${createdWorkflow.id} with user:${userId}`
          );
        } catch (error) {
          logger.warn(
            { src: 'plugin:n8n-workflow:service:main' },
            `Failed to tag workflow: ${error instanceof Error ? error.message : String(error)}`
          );
        }
      }

      logger.info(
        { src: 'plugin:n8n-workflow:service:main' },
        `Workflow created successfully: ${createdWorkflow.id}`
      );

      return {
        id: createdWorkflow.id,
        name: createdWorkflow.name,
        active: createdWorkflow.active ?? false,
        nodeCount: createdWorkflow.nodes?.length || 0,
        missingCredentials: getMissingCredentials(credentialResult.workflow),
      };
    } catch (error) {
      logger.error(
        { src: 'plugin:n8n-workflow:service:main' },
        `Failed to create workflow: ${error instanceof Error ? error.message : String(error)}`
      );
      throw error;
    }
  }

  /**
   * List workflows (optionally filtered by user)
   */
  async listWorkflows(userId?: string): Promise<N8nWorkflowResponse[]> {
    const client = this.getClient();

    if (userId) {
      // Filter by user tag
      const tagsResponse = await client.listTags();
      const userTag = tagsResponse.data.find((t) => t.name === `user:${userId}`);

      if (!userTag) {
        return []; // No workflows for this user
      }

      // Get all workflows and filter by tag
      const workflowsResponse = await client.listWorkflows();
      return workflowsResponse.data.filter((w) => w.tags?.some((t) => t.id === userTag.id));
    }

    const response = await client.listWorkflows();
    return response.data;
  }

  /**
   * Activate a workflow
   */
  async activateWorkflow(workflowId: string): Promise<void> {
    const client = this.getClient();
    await client.activateWorkflow(workflowId);
    logger.info({ src: 'plugin:n8n-workflow:service:main' }, `Workflow ${workflowId} activated`);
  }

  /**
   * Deactivate a workflow
   */
  async deactivateWorkflow(workflowId: string): Promise<void> {
    const client = this.getClient();
    await client.deactivateWorkflow(workflowId);
    logger.info({ src: 'plugin:n8n-workflow:service:main' }, `Workflow ${workflowId} deactivated`);
  }

  /**
   * Delete a workflow
   */
  async deleteWorkflow(workflowId: string): Promise<void> {
    const client = this.getClient();
    await client.deleteWorkflow(workflowId);
    logger.info({ src: 'plugin:n8n-workflow:service:main' }, `Workflow ${workflowId} deleted`);
  }

  /**
   * Execute a workflow manually
   */
  async executeWorkflow(workflowId: string): Promise<N8nExecution> {
    const client = this.getClient();
    const execution = await client.executeWorkflow(workflowId);
    logger.info(
      { src: 'plugin:n8n-workflow:service:main' },
      `Workflow ${workflowId} executed - execution ID: ${execution.id}`
    );
    return execution;
  }

  /**
   * Get execution history for a workflow
   */
  async getWorkflowExecutions(workflowId: string, limit?: number): Promise<N8nExecution[]> {
    const client = this.getClient();
    const response = await client.listExecutions({ workflowId, limit });
    return response.data;
  }

  /**
   * Get detailed execution information
   */
  async getExecutionDetail(executionId: string): Promise<N8nExecution> {
    const client = this.getClient();
    return client.getExecution(executionId);
  }
}
