import { type IAgentRuntime, logger, Service } from '@elizaos/core';
import { N8nApiClient } from '../utils/api';
import { searchNodes } from '../utils/catalog';
import { extractKeywords, generateWorkflow } from '../utils/generation';
import { positionNodes, validateWorkflow } from '../utils/workflow';
import { resolveCredentials, getMissingCredentials } from '../utils/credentialResolver';
import type {
  N8nWorkflow,
  N8nWorkflowResponse,
  N8nExecution,
  WorkflowCreationResult,
} from '../types/index';

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
 * N8n Workflow Service - Orchestrates the RAG pipeline for workflow generation.
 *
 * generateWorkflowDraft(): keywords → node search → LLM generation → validation → positioning
 * deployWorkflow(): credential resolution → n8n Cloud API → tagging
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
   * Generate a workflow draft from natural language.
   * Does NOT resolve credentials or deploy — returns a preview-ready workflow.
   */
  async generateWorkflowDraft(prompt: string): Promise<N8nWorkflow> {
    logger.info(
      { src: 'plugin:n8n-workflow:service:main' },
      'Generating workflow draft from prompt'
    );

    const keywords = await extractKeywords(this.runtime, prompt);
    logger.debug(
      { src: 'plugin:n8n-workflow:service:main' },
      `Extracted keywords: ${keywords.join(', ')}`
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

    const workflow = await generateWorkflow(
      this.runtime,
      prompt,
      relevantNodes.map((r) => r.node)
    );
    logger.debug(
      { src: 'plugin:n8n-workflow:service:main' },
      `Generated workflow with ${workflow.nodes?.length || 0} nodes`
    );

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

    return positionNodes(workflow);
  }

  /**
   * Deploy a previously generated workflow.
   * Resolves credentials and creates the workflow via n8n API.
   */
  async deployWorkflow(workflow: N8nWorkflow, userId: string): Promise<WorkflowCreationResult> {
    logger.info(
      { src: 'plugin:n8n-workflow:service:main' },
      `Deploying workflow "${workflow.name}" for user ${userId}`
    );

    const config = this.getConfig();
    const client = this.getClient();
    const credentialResult = await resolveCredentials(
      workflow,
      userId,
      this.runtime,
      client,
      config
    );

    const createdWorkflow = await client.createWorkflow(credentialResult.workflow);

    if (userId) {
      try {
        const tagsResponse = await client.listTags();
        let userTag = tagsResponse.data.find((t) => t.name === `user:${userId}`);

        if (!userTag) {
          userTag = await client.createTag(`user:${userId}`);
        }

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
