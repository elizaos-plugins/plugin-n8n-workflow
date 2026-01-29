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
        text: 'Show me my n8n credentials',
      },
    },
    {
      name: '{{agent}}',
      content: {
        text: "I'll list all your configured n8n credentials.",
        actions: ['LIST_N8N_CREDENTIALS'],
      },
    },
  ],
];

export const listCredentialsAction: Action = {
  name: 'LIST_N8N_CREDENTIALS',
  similes: [
    'LIST_CREDENTIALS',
    'SHOW_CREDENTIALS',
    'GET_CREDENTIALS',
    'MY_CREDENTIALS',
    'LIST_CONNECTIONS',
  ],
  description:
    'List all configured credentials in n8n (Gmail, Slack, Stripe, etc.). ' +
    'Useful in local mode to see which services are connected and get their credential IDs.',

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
        { src: 'plugin:n8n-workflow:action:list-credentials' },
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
      const credentials = await service.listCredentials();

      logger.info(
        { src: 'plugin:n8n-workflow:action:list-credentials' },
        `Retrieved ${credentials.length} credentials`
      );

      if (credentials.length === 0) {
        if (callback) {
          await callback({
            text:
              "You don't have any configured credentials in n8n yet. " +
              'Connect services in n8n Cloud to use them in workflows.',
          });
        }
        return { success: true, data: { credentials: [] } };
      }

      let responseText = `🔑 **Your n8n Credentials** (${credentials.length} total)\n\n`;

      for (const cred of credentials) {
        responseText += `**${cred.name}**\n`;
        responseText += `   Type: ${cred.type}\n`;
        responseText += `   ID: ${cred.id}\n`;
        responseText += `   Created: ${new Date(cred.createdAt).toLocaleDateString()}\n\n`;
      }

      responseText +=
        '\n💡 **Tip:** To use pre-configured credentials in workflows, add them to your character settings:\n';
      responseText += '```json\n';
      responseText += '{\n';
      responseText += '  "settings": {\n';
      responseText += '    "n8n": {\n';
      responseText += '      "credentials": {\n';
      responseText += '        "gmailOAuth2Api": "YOUR_GMAIL_CRED_ID",\n';
      responseText += '        "slackApi": "YOUR_SLACK_CRED_ID"\n';
      responseText += '      }\n';
      responseText += '    }\n';
      responseText += '  }\n';
      responseText += '}\n';
      responseText += '```';

      if (callback) {
        await callback({
          text: responseText,
        });
      }

      return {
        success: true,
        data: { credentials },
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error(
        { src: 'plugin:n8n-workflow:action:list-credentials' },
        `Failed to list credentials: ${errorMessage}`
      );

      if (callback) {
        await callback({
          text: `Failed to list credentials: ${errorMessage}`,
        });
      }

      return { success: false };
    }
  },

  examples,
};

export default listCredentialsAction;
