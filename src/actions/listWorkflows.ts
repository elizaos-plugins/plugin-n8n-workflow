import {
  type Action,
  type ActionExample,
  type ActionResult,
  type HandlerCallback,
  type IAgentRuntime,
  logger,
  type Memory,
  type State,
} from '@elizaos/core';
import { N8N_WORKFLOW_SERVICE_TYPE, type N8nWorkflowService } from '../services/index';

const examples: ActionExample[][] = [
  [
    {
      name: '{{user1}}',
      content: {
        text: 'Show me my n8n workflows',
      },
    },
    {
      name: '{{agent}}',
      content: {
        text: "I'll list all your n8n workflows.",
        actions: ['LIST_N8N_WORKFLOWS'],
      },
    },
  ],
  [
    {
      name: '{{user1}}',
      content: {
        text: 'What workflows do I have?',
      },
    },
    {
      name: '{{agent}}',
      content: {
        text: 'Let me fetch your workflows.',
        actions: ['LIST_N8N_WORKFLOWS'],
      },
    },
  ],
];

export const listWorkflowsAction: Action = {
  name: 'LIST_N8N_WORKFLOWS',
  similes: ['LIST_WORKFLOWS', 'SHOW_WORKFLOWS', 'GET_WORKFLOWS', 'VIEW_WORKFLOWS', 'MY_WORKFLOWS'],
  description:
    'List all n8n workflows for the current user. Shows workflow ID, name, status (active/inactive), and node count.',

  validate: async (runtime: IAgentRuntime): Promise<boolean> => {
    return !!runtime.getService(N8N_WORKFLOW_SERVICE_TYPE);
  },

  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    _state: State | undefined,
    _options?: unknown,
    callback?: HandlerCallback
  ): Promise<ActionResult> => {
    const service = runtime.getService<N8nWorkflowService>(N8N_WORKFLOW_SERVICE_TYPE);

    if (!service) {
      logger.error(
        { src: 'plugin:n8n-workflow:action:list' },
        'N8n Workflow service not available'
      );
      if (callback) {
        await callback({
          text: 'N8n Workflow service is not available.',
        });
      }
      return { success: false };
    }

    try {
      const userId = message.entityId;
      const workflows = await service.listWorkflows(userId);

      logger.info(
        { src: 'plugin:n8n-workflow:action:list' },
        `Retrieved ${workflows.length} workflows for user ${userId || 'all'}`
      );

      if (workflows.length === 0) {
        if (callback) {
          await callback({
            text: "You don't have any n8n workflows yet. Would you like me to create one for you?",
          });
        }
        return { success: true, data: { workflows: [] } };
      }

      let responseText = `📋 **Your n8n Workflows** (${workflows.length} total)\n\n`;

      for (const workflow of workflows) {
        const statusEmoji = workflow.active ? '✅' : '⏸️';
        responseText += `${statusEmoji} **${workflow.name}**\n`;
        responseText += `   ID: ${workflow.id}\n`;
        responseText += `   Nodes: ${workflow.nodes?.length || 0}\n`;
        responseText += `   Status: ${workflow.active ? 'Active' : 'Inactive'}\n\n`;
      }

      if (callback) {
        await callback({
          text: responseText,
        });
      }

      return {
        success: true,
        data: { workflows },
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error(
        { src: 'plugin:n8n-workflow:action:list' },
        `Failed to list workflows: ${errorMessage}`
      );

      if (callback) {
        await callback({
          text: `Failed to list workflows: ${errorMessage}`,
        });
      }

      return { success: false };
    }
  },

  examples,
};
