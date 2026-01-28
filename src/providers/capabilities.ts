import { type Provider } from '@elizaos/core';

export const capabilitiesProvider: Provider = {
  name: 'n8n_capabilities',

  get: async (): Promise<string> => {
    return `Available n8n workflow operations:

**Workflow Creation:**
- Create workflows from natural language descriptions
- Supports 450+ native n8n nodes (Gmail, Slack, Stripe, GitHub, etc.)
- Automatic node positioning and workflow validation
- Intelligent credential resolution (local + cloud modes)

**Workflow Management:**
- List all workflows with status and metadata
- Activate/deactivate workflows
- Delete workflows permanently
- Execute workflows manually
- View execution history and logs

**Credential Management:**
- List configured credentials and connections
- Support for pre-configured credential IDs (local mode)
- OAuth integration support (cloud mode)

**Example requests:**
- "Create a workflow that sends me Stripe payment summaries via Gmail"
- "Show my workflows"
- "Activate workflow abc123"
- "Show execution history for workflow xyz"
- "List my n8n credentials"

**Technical Details:**
- Uses RAG pipeline: keyword extraction → node search → LLM generation → validation
- Generates valid n8n workflow JSON with proper node connections
- Deploys directly to n8n Cloud via REST API
- Per-user workflow tagging for multi-tenant support`;
  },
};

export default capabilitiesProvider;
