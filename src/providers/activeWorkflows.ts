import {
  type IAgentRuntime,
  logger,
  type Memory,
  type Provider,
  type State,
} from '@elizaos/core';
import {
  N8N_WORKFLOW_SERVICE_TYPE,
  type N8nWorkflowService,
} from '../services/index.js';

/**
 * Provider that enriches state with user's active workflows
 *
 * This provider runs for every message and adds workflow information to the state,
 * allowing the LLM to automatically extract workflow IDs and references from context.
 *
 * Example: User says "run my Stripe workflow" → LLM can see all workflows and extract the right ID
 */
export const activeWorkflowsProvider: Provider = {
  name: 'ACTIVE_N8N_WORKFLOWS',
  description: "User's active n8n workflows with IDs and descriptions",

  get: async (runtime: IAgentRuntime, message: Memory, _state: State) => {
    try {
      const service = runtime.getService<N8nWorkflowService>(
        N8N_WORKFLOW_SERVICE_TYPE,
      );

      if (!service) {
        return {
          text: '',
          data: {},
          values: {},
        };
      }

      const userId = (message.userId as string) || undefined;
      const workflows = await service.listWorkflows(userId);

      if (workflows.length === 0) {
        return {
          text: '',
          data: { workflows: [] },
          values: { hasWorkflows: false },
        };
      }

      // Format workflows for LLM context
      const workflowList = workflows
        .slice(0, 20) // Limit to 20 most recent
        .map((wf) => {
          const status = wf.active ? 'ACTIVE' : 'INACTIVE';
          const nodeCount = wf.nodes?.length || 0;

          return `- **${wf.name}** (ID: ${wf.id}, Status: ${status}, Nodes: ${nodeCount})`;
        })
        .join('\n');

      const text = `# Available Workflows\n\n${workflowList}`;

      // Create workflow lookup for easy access
      const workflowMap: Record<
        string,
        { id: string; name: string; active: boolean }
      > = {};
      const workflowsByKeyword: Record<string, string[]> = {};

      for (const wf of workflows) {
        workflowMap[wf.id] = {
          id: wf.id,
          name: wf.name,
          active: wf.active || false,
        };

        // Index by keywords from workflow name for semantic matching
        const keywords = wf.name.toLowerCase().split(/\s+/);
        for (const keyword of keywords) {
          if (keyword.length > 3) {
            // Ignore short words
            if (!workflowsByKeyword[keyword]) {
              workflowsByKeyword[keyword] = [];
            }
            workflowsByKeyword[keyword].push(wf.id);
          }
        }
      }

      return {
        text,
        data: {
          workflows: workflows.map((wf) => ({
            id: wf.id,
            name: wf.name,
            active: wf.active || false,
            nodeCount: wf.nodes?.length || 0,
          })),
          workflowMap,
          workflowsByKeyword,
        },
        values: {
          hasWorkflows: true,
          workflowCount: workflows.length,
        },
      };
    } catch (error) {
      logger.error(
        `Failed to get active workflows: ${error instanceof Error ? error.message : String(error)}`,
      );
      return {
        text: '',
        data: {},
        values: {},
      };
    }
  },
};

export default activeWorkflowsProvider;
