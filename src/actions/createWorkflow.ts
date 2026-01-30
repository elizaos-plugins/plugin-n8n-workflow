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
import { N8N_WORKFLOW_SERVICE_TYPE, type N8nWorkflowService } from '../services/index';
import type { N8nWorkflow, WorkflowDraft } from '../types/index';
import { classifyDraftIntent } from '../utils/generation';

const DRAFT_TTL_MS = 30 * 60 * 1000;

/**
 * Build a human-readable preview of a workflow draft
 */
function formatPreview(workflow: N8nWorkflow): string {
  const lines: string[] = [];

  lines.push(`**Workflow Preview: "${workflow.name}"**`);
  lines.push('');

  // Nodes summary
  lines.push(`**Nodes (${workflow.nodes.length}):**`);
  for (let i = 0; i < workflow.nodes.length; i++) {
    const node = workflow.nodes[i];
    const typeName = node.type.replace('n8n-nodes-base.', '');
    lines.push(`  ${i + 1}. **${node.name}** — \`${typeName}\``);
  }
  lines.push('');

  // Flow summary (from connections)
  const connectionNames = Object.keys(workflow.connections);
  if (connectionNames.length > 0) {
    const flowParts: string[] = [];
    const visited = new Set<string>();

    // Find the starting node (one that is a source but not a target)
    const targets = new Set<string>();
    for (const sourceName of connectionNames) {
      const outputs = workflow.connections[sourceName];
      for (const outputType of Object.values(outputs)) {
        for (const connections of outputType) {
          for (const conn of connections) {
            targets.add(conn.node);
          }
        }
      }
    }
    const startNodes = connectionNames.filter((n) => !targets.has(n));
    const queue = startNodes.length > 0 ? [startNodes[0]] : [connectionNames[0]];

    while (queue.length > 0) {
      const current = queue.shift();
      if (!current || visited.has(current)) {
        continue;
      }
      visited.add(current);
      flowParts.push(current);

      const outputs = workflow.connections[current];
      if (outputs) {
        for (const outputType of Object.values(outputs)) {
          for (const connections of outputType) {
            for (const conn of connections) {
              queue.push(conn.node);
            }
          }
        }
      }
    }

    lines.push(`**Flow:** ${flowParts.join(' → ')}`);
    lines.push('');
  }

  // Credentials needed
  const credTypes = new Set<string>();
  for (const node of workflow.nodes) {
    if (node.credentials) {
      for (const credType of Object.keys(node.credentials)) {
        credTypes.add(credType);
      }
    }
  }
  if (credTypes.size > 0) {
    lines.push('**Credentials needed:**');
    for (const cred of credTypes) {
      lines.push(`  - \`${cred}\``);
    }
    lines.push('');
  }

  // Meta: assumptions
  if (workflow._meta?.assumptions?.length) {
    lines.push('**Assumptions made:**');
    for (const a of workflow._meta.assumptions) {
      lines.push(`  - ${a}`);
    }
    lines.push('');
  }

  // Meta: suggestions
  if (workflow._meta?.suggestions?.length) {
    lines.push('**Suggestions:**');
    for (const s of workflow._meta.suggestions) {
      lines.push(`  - ${s}`);
    }
    lines.push('');
  }

  lines.push('---');
  lines.push('This workflow is a **draft** and has **not been deployed** yet.');
  lines.push('Reply **confirm** to deploy, **modify** to change, or **cancel** to discard.');

  return lines.join('\n');
}

/**
 * Format clarification questions from the LLM
 */
function formatClarification(workflow: N8nWorkflow): string {
  const questions = workflow._meta?.requiresClarification || [];
  const lines: string[] = [];

  lines.push('I need a bit more information before I can create this workflow:');
  lines.push('');
  for (const q of questions) {
    lines.push(`- ${q}`);
  }
  lines.push('');
  lines.push("Please provide more details and I'll generate the workflow.");

  return lines.join('\n');
}

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
  [
    {
      name: '{{user1}}',
      content: {
        text: 'Yes, deploy it',
      },
    },
    {
      name: '{{agent}}',
      content: {
        text: 'Deploying your workflow now...',
        actions: ['CREATE_N8N_WORKFLOW'],
      },
    },
  ],
  [
    {
      name: '{{user1}}',
      content: {
        text: 'Looks good, confirm',
      },
    },
    {
      name: '{{agent}}',
      content: {
        text: 'Deploying your workflow...',
        actions: ['CREATE_N8N_WORKFLOW'],
      },
    },
  ],
  [
    {
      name: '{{user1}}',
      content: {
        text: 'Go ahead and create it',
      },
    },
    {
      name: '{{agent}}',
      content: {
        text: 'Deploying your workflow...',
        actions: ['CREATE_N8N_WORKFLOW'],
      },
    },
  ],
  [
    {
      name: '{{user1}}',
      content: {
        text: 'Cancel the workflow',
      },
    },
    {
      name: '{{agent}}',
      content: {
        text: 'Workflow draft cancelled.',
        actions: ['CREATE_N8N_WORKFLOW'],
      },
    },
  ],
  [
    {
      name: '{{user1}}',
      content: {
        text: 'Actually, use Outlook instead of Gmail',
      },
    },
    {
      name: '{{agent}}',
      content: {
        text: 'Regenerating the workflow with Outlook...',
        actions: ['CREATE_N8N_WORKFLOW'],
      },
    },
  ],
  [
    {
      name: '{{user1}}',
      content: {
        text: 'Ok',
      },
    },
    {
      name: '{{agent}}',
      content: {
        text: 'Deploying your workflow...',
        actions: ['CREATE_N8N_WORKFLOW'],
      },
    },
  ],
  [
    {
      name: '{{user1}}',
      content: {
        text: 'Yes',
      },
    },
    {
      name: '{{agent}}',
      content: {
        text: 'Deploying your workflow now.',
        actions: ['CREATE_N8N_WORKFLOW'],
      },
    },
  ],
  [
    {
      name: '{{user1}}',
      content: {
        text: 'Do it',
      },
    },
    {
      name: '{{agent}}',
      content: {
        text: 'Deploying your workflow...',
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
    'CONFIRM_WORKFLOW',
    'DEPLOY_WORKFLOW',
    'CANCEL_WORKFLOW',
  ],
  description:
    'Generate, preview, and deploy n8n workflows from natural language. ' +
    'Handles the full lifecycle: generate a draft, show preview, then deploy on user confirmation. ' +
    'Also handles modify/cancel of pending drafts. ' +
    'IMPORTANT: When a workflow draft is pending, this action MUST be used for ANY user response ' +
    'about the draft — including "yes", "ok", "deploy it", "cancel", or modification requests. ' +
    'Never reply with text only when a draft is pending.',

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
        { src: 'plugin:n8n-workflow:action:create' },
        'N8n Workflow service not available'
      );
      if (callback) {
        await callback({
          text: 'N8n Workflow service is not available. Please ensure the plugin is properly configured with N8N_API_KEY and N8N_HOST.',
        });
      }
      return { success: false };
    }

    const content = message.content as Content;
    const userText = (content.text ?? '').trim();
    const userId = message.entityId;
    const cacheKey = `workflow_draft:${userId}`;

    try {
      let existingDraft = await runtime.getCache<WorkflowDraft>(cacheKey);

      if (existingDraft && Date.now() - existingDraft.createdAt > DRAFT_TTL_MS) {
        logger.debug({ src: 'plugin:n8n-workflow:action:create' }, 'Draft expired, clearing cache');
        await runtime.deleteCache(cacheKey);
        existingDraft = undefined;
      }

      if (existingDraft) {
        const intentResult = await classifyDraftIntent(runtime, userText, existingDraft);
        logger.info(
          { src: 'plugin:n8n-workflow:action:create' },
          `Draft intent: ${intentResult.intent} — ${intentResult.reason}`
        );

        // If the draft was awaiting clarification and the user answered, treat "confirm" as "modify"
        // to regenerate with the user's answers instead of deploying an incomplete draft.
        const effectiveIntent =
          intentResult.intent === 'confirm' &&
          existingDraft.workflow._meta?.requiresClarification?.length
            ? 'modify'
            : intentResult.intent;

        if (effectiveIntent !== intentResult.intent) {
          logger.info(
            { src: 'plugin:n8n-workflow:action:create' },
            'Draft has pending clarification — overriding "confirm" → "modify" to regenerate with user\'s answers'
          );
        }

        switch (effectiveIntent) {
          case 'confirm': {
            const result = await service.deployWorkflow(existingDraft.workflow, userId);
            await runtime.deleteCache(cacheKey);

            let responseText = `Workflow "${result.name}" deployed successfully!\n\n`;
            responseText += `**Workflow ID:** ${result.id}\n`;
            responseText += `**Nodes:** ${result.nodeCount}\n`;
            responseText += `**Status:** ${result.active ? 'Active' : 'Inactive'}\n`;

            if (result.missingCredentials.length > 0) {
              responseText += '\n**Action Required:**\n';
              responseText += 'Please connect the following services in n8n Cloud:\n';
              for (const credType of result.missingCredentials) {
                responseText += `- \`${credType}\`\n`;
              }
              responseText +=
                '\nThe workflow will be ready to run once these connections are configured.';
            } else {
              responseText += '\nAll credentials configured — workflow is ready to run!';
            }

            if (callback) {
              await callback({ text: responseText });
            }

            return { success: true, data: result };
          }

          case 'cancel': {
            await runtime.deleteCache(cacheKey);

            if (callback) {
              await callback({ text: 'Workflow draft cancelled.' });
            }

            return { success: true };
          }

          case 'modify': {
            const modification = intentResult.modificationRequest || userText;
            logger.info(
              { src: 'plugin:n8n-workflow:action:create' },
              `Modifying draft: ${modification.slice(0, 100)}`
            );

            const modifiedWorkflow = await service.modifyWorkflowDraft(
              existingDraft.workflow,
              modification
            );

            const modifiedDraft: WorkflowDraft = {
              workflow: modifiedWorkflow,
              prompt: existingDraft.prompt,
              userId,
              createdAt: Date.now(),
            };
            await runtime.setCache(cacheKey, modifiedDraft);

            if (modifiedWorkflow._meta?.requiresClarification?.length) {
              if (callback) {
                await callback({ text: formatClarification(modifiedWorkflow) });
              }
              return { success: true };
            }

            if (callback) {
              await callback({ text: formatPreview(modifiedWorkflow) });
            }
            return { success: true };
          }

          case 'new': {
            // User wants something completely different — but only if the message actually
            // describes a new workflow. If generation fails (e.g. vague prompt), recover
            // by restoring the existing draft instead of losing it.
            if (!userText) {
              if (callback) {
                await callback({
                  text: 'Previous draft cancelled. Please describe the workflow you want to create.',
                });
              }
              await runtime.deleteCache(cacheKey);
              return { success: false };
            }

            await runtime.deleteCache(cacheKey);
            try {
              return await generateAndPreview(
                runtime,
                service,
                userText,
                userId,
                cacheKey,
                callback
              );
            } catch {
              // Generation failed (likely vague prompt) — restore the draft and re-show preview
              logger.warn(
                { src: 'plugin:n8n-workflow:action:create' },
                'New workflow generation failed — restoring previous draft'
              );
              await runtime.setCache(cacheKey, existingDraft);
              if (callback) {
                await callback({
                  text: `I couldn't generate a new workflow from that message. Here is your current draft:\n\n${formatPreview(
                    existingDraft.workflow
                  )}`,
                });
              }
              return { success: true };
            }
          }

          default: {
            // show_preview fallback — re-display the draft preview
            logger.info(
              { src: 'plugin:n8n-workflow:action:create' },
              'Intent classification unclear — re-showing preview'
            );
            if (callback) {
              await callback({ text: formatPreview(existingDraft.workflow) });
            }
            return { success: true };
          }
        }
      }

      if (!userText) {
        if (callback) {
          await callback({
            text: 'Please provide a description of the workflow you want to create.',
          });
        }
        return { success: false };
      }

      return await generateAndPreview(runtime, service, userText, userId, cacheKey, callback);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error(
        { src: 'plugin:n8n-workflow:action:create' },
        `Failed to create workflow: ${errorMessage}`
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

/**
 * Generate a workflow draft, store it in cache, and show preview or clarification
 */
async function generateAndPreview(
  runtime: IAgentRuntime,
  service: N8nWorkflowService,
  prompt: string,
  userId: string,
  cacheKey: string,
  callback?: HandlerCallback
): Promise<ActionResult> {
  logger.info(
    { src: 'plugin:n8n-workflow:action:create' },
    `Generating workflow from prompt: ${prompt.slice(0, 100)}...`
  );

  const workflow = await service.generateWorkflowDraft(prompt);

  const draft: WorkflowDraft = {
    workflow,
    prompt,
    userId,
    createdAt: Date.now(),
  };
  await runtime.setCache(cacheKey, draft);

  // ElizaOS allows only one callback per handler invocation (same message ID is reused).
  // Send either clarification questions or the full preview — never both.
  if (workflow._meta?.requiresClarification?.length) {
    if (callback) {
      await callback({ text: formatClarification(workflow) });
    }
    return { success: true };
  }

  if (callback) {
    await callback({ text: formatPreview(workflow) });
  }

  return { success: true };
}
