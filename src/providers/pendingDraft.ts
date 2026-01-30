import { type IAgentRuntime, type Memory, type Provider, type State } from '@elizaos/core';
import type { WorkflowDraft } from '../types/index';

const DRAFT_TTL_MS = 30 * 60 * 1000;

/**
 * Provider that tells the LLM when a workflow draft is pending confirmation.
 *
 * Without this, the LLM has no context about pending drafts and will route
 * confirmation messages (e.g. "yes, deploy it") to REPLY instead of
 * CREATE_N8N_WORKFLOW.
 */
export const pendingDraftProvider: Provider = {
  name: 'PENDING_WORKFLOW_DRAFT',
  description: 'Pending workflow draft awaiting user confirmation, modification, or cancellation',

  get: async (runtime: IAgentRuntime, message: Memory, _state: State) => {
    const cacheKey = `workflow_draft:${message.entityId}`;
    const draft = await runtime.getCache<WorkflowDraft>(cacheKey);

    if (!draft || Date.now() - draft.createdAt > DRAFT_TTL_MS) {
      return { text: '', data: {}, values: {} };
    }

    const nodeNames = draft.workflow.nodes.map((n) => n.name).join(' → ');

    return {
      text:
        '# Pending Workflow Draft\n\n' +
        `A workflow draft "${draft.workflow.name}" is waiting for user confirmation.\n` +
        `Nodes: ${nodeNames}\n\n` +
        'If the user confirms, modifies, or cancels this draft, use the CREATE_N8N_WORKFLOW action.\n' +
        'Do NOT just reply with text — the action must run to deploy or manage the draft.',
      data: { hasPendingDraft: true },
      values: { hasPendingDraft: true },
    };
  },
};
