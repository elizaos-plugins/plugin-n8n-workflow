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
} from '@elizaos/core';
import {
  N8N_WORKFLOW_SERVICE_TYPE,
  type N8nWorkflowService,
} from '../services/index';

const examples: ActionExample[][] = [
  [
    {
      name: '{{user1}}',
      content: {
        text: 'Create a workflow that sends me Stripe payment summaries every Monday via Gmail',
      },
    },
    {
      name: '{{agent}}',
      content: {
        text: "I'll create an n8n workflow that fetches Stripe payments weekly and emails you a summary via Gmail.",
        actions: ['CREATE_N8N_WORKFLOW'],
      },
    },
  ],
  [
    {
      name: '{{user1}}',
      content: {
        text: 'Build a workflow to notify me on Slack when a new GitHub issue is created',
      },
    },
    {
      name: '{{agent}}',
      content: {
        text: 'Creating a workflow that monitors GitHub for new issues and sends Slack notifications.',
        actions: ['CREATE_N8N_WORKFLOW'],
      },
    },
  ],
  [
    {
      name: '{{user1}}',
      content: {
        text: 'Set up automation to save Gmail attachments to Google Drive',
      },
    },
    {
      name: '{{agent}}',
      content: {
        text: "I'll build an n8n workflow that watches for Gmail attachments and automatically saves them to Google Drive.",
        actions: ['CREATE_N8N_WORKFLOW'],
      },
    },
  ],
];

export const createWorkflowAction: Action = {
  name: 'CREATE_N8N_WORKFLOW',
  similes: [
    'CREATE_WORKFLOW',
    'BUILD_WORKFLOW',
    'GENERATE_WORKFLOW',
    'MAKE_AUTOMATION',
    'CREATE_AUTOMATION',
    'BUILD_N8N_WORKFLOW',
    'SETUP_WORKFLOW',
  ],
  description:
    'Generate and deploy an n8n workflow from a natural language description. ' +
    'The workflow will be created using native n8n nodes (Gmail, Slack, Stripe, etc.) ' +
    'and deployed to n8n Cloud. Use this action when the user wants to automate a task ' +
    'or create an integration between different services.',

  validate: async (runtime: IAgentRuntime): Promise<boolean> => {
    return !!runtime.getService(N8N_WORKFLOW_SERVICE_TYPE);
  },

  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    _state: State | undefined,
    _options?: unknown,
    callback?: HandlerCallback,
  ): Promise<ActionResult> => {
    const service = runtime.getService<N8nWorkflowService>(
      N8N_WORKFLOW_SERVICE_TYPE,
    );

    if (!service) {
      logger.error(
        { src: 'plugin:n8n-workflow:action:create' },
        'N8n Workflow service not available',
      );
      if (callback) {
        await callback({
          text: 'N8n Workflow service is not available. Please ensure the plugin is properly configured with N8N_API_KEY and N8N_HOST.',
        });
      }
      return { success: false };
    }

    try {
      const content = message.content as Content;
      const prompt = (content.text ?? '').trim();

      if (!prompt) {
        logger.error(
          { src: 'plugin:n8n-workflow:action:create' },
          'No prompt provided for workflow creation',
        );
        if (callback) {
          await callback({
            text: 'Please provide a description of the workflow you want to create.',
          });
        }
        return { success: false };
      }

      logger.info(
        { src: 'plugin:n8n-workflow:action:create' },
        `Creating workflow from prompt: ${prompt.slice(0, 100)}...`,
      );

      if (callback) {
        await callback({
          text: 'Analyzing your request and searching for relevant n8n nodes...',
        });
      }

      // Create workflow using the service's RAG pipeline
      const result = await service.createWorkflowFromPrompt(
        prompt,
        message.entityId,
      );

      logger.info(
        { src: 'plugin:n8n-workflow:action:create' },
        `Workflow created successfully: ${result.id} (${result.nodeCount} nodes)`,
      );

      // Build response message
      let responseText = `✅ Workflow "${result.name}" created successfully!\n\n`;
      responseText += `**Workflow ID:** ${result.id}\n`;
      responseText += `**Nodes:** ${result.nodeCount}\n`;
      responseText += `**Status:** ${result.active ? 'Active' : 'Inactive'}\n`;

      if (result.missingCredentials.length > 0) {
        responseText += '\n⚠️  **Action Required:**\n';
        responseText += 'Please connect the following services in n8n Cloud:\n';
        for (const credType of result.missingCredentials) {
          responseText += `- ${credType}\n`;
        }
        responseText +=
          '\nThe workflow will be ready to run once these connections are configured.';
      } else {
        responseText +=
          '\n✅ All credentials configured - workflow is ready to run!';
      }

      if (callback) {
        await callback({
          text: responseText,
        });
      }

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      logger.error(
        { src: 'plugin:n8n-workflow:action:create' },
        `Failed to create workflow: ${errorMessage}`,
      );

      if (callback) {
        await callback({
          text: `Failed to create workflow: ${errorMessage}\n\nPlease try rephrasing your request or being more specific about the integrations you want to use.`,
        });
      }

      return { success: false };
    }
  },

  examples,
};

export default createWorkflowAction;
