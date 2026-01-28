# @elizaos/plugin-n8n-workflow

ElizaOS plugin for generating and managing n8n workflows from natural language.

## Features

- 🤖 **Natural Language to Workflow**: Generate complete n8n workflows from conversational prompts
- 🔄 **RAG Pipeline**: Keyword extraction → Node catalog search → LLM generation → Validation
- 🔌 **Native n8n Nodes**: Uses official n8n nodes (Gmail, Slack, Stripe, etc.)
- 🔐 **Dual Mode**: Works standalone (local) or with cloud OAuth plugin
- 📊 **Full Lifecycle**: Create, list, activate, deactivate, delete, execute workflows
- 🎯 **Auto-positioning**: Intelligent node layout on canvas
- ✅ **Validation**: Structural validation + auto-fix of workflow JSON

## Installation

```bash
bun add @elizaos/plugin-n8n-workflow
```

## Configuration

### Environment Variables

```env
N8N_API_KEY=your_n8n_api_key      # Required
N8N_HOST=https://your.n8n.cloud   # Required
```

### Character Configuration

```json
{
  "name": "AI Workflow Builder",
  "plugins": ["@elizaos/plugin-n8n-workflow"],
  "settings": {
    "n8n": {
      "apiKey": "env:N8N_API_KEY",
      "host": "env:N8N_HOST"
    }
  }
}
```

## Usage

### Basic Example

```typescript
import { n8nWorkflowPlugin } from "@elizaos/plugin-n8n-workflow";
import { AgentRuntime } from "@elizaos/core";

const runtime = new AgentRuntime({
  character: myCharacter,
  plugins: [n8nWorkflowPlugin],
});

// User: "Create a workflow that sends me Stripe payment summaries every Monday via Gmail"
// Agent generates the workflow and deploys it to n8n Cloud
```

### Local Mode (Pre-configured Credentials)

For users who want to pre-configure n8n credentials:

```json
{
  "settings": {
    "n8n": {
      "credentials": {
        "gmailOAuth2Api": "cred_gmail_123",
        "stripeApi": "cred_stripe_456"
      }
    }
  }
}
```

Use the `LIST_N8N_CREDENTIALS` action to view your credential IDs:

```
User: "list my n8n credentials"
Agent: Shows all connected apps with their credential IDs
```

### Cloud Mode (with OAuth Plugin)

When used with `@eliza-cloud/plugin-oauth`, the plugin automatically handles OAuth flows:

```json
{
  "plugins": [
    "@eliza-cloud/plugin-oauth",
    "@elizaos/plugin-n8n-workflow"
  ]
}
```

## Actions

| Action | Description | Example |
|--------|-------------|---------|
| `CREATE_N8N_WORKFLOW` | Generate and deploy workflow | "Create a workflow that..." |
| `LIST_N8N_WORKFLOWS` | List all workflows | "Show my workflows" |
| `GET_N8N_EXECUTIONS` | View execution history | "Show runs for workflow X" |
| `ACTIVATE_N8N_WORKFLOW` | Activate a workflow | "Enable the Gmail workflow" |
| `DEACTIVATE_N8N_WORKFLOW` | Deactivate a workflow | "Pause the Stripe workflow" |
| `DELETE_N8N_WORKFLOW` | Delete a workflow | "Delete workflow X" |
| `EXECUTE_N8N_WORKFLOW` | Manually trigger workflow | "Run the email workflow" |
| `LIST_N8N_CREDENTIALS` | List n8n credentials (local mode) | "Show my n8n credentials" |

## Architecture

### Clean Code Organization

```
src/
├── api/              # n8n API client
│   └── client.ts     # Full REST API coverage
├── catalog/          # Node catalog & search
│   └── search.ts     # Keyword-based node search
├── generation/       # LLM workflow generation
│   ├── keywords.ts   # Keyword extraction (OBJECT_SMALL)
│   └── generator.ts  # Workflow generation (TEXT_LARGE)
├── workflow/         # Workflow manipulation
│   ├── validator.ts  # Structural validation
│   └── positioner.ts # Auto-layout algorithm
├── credentials/      # Credential management
│   └── resolver.ts   # 3-mode resolution (cloud/local/placeholder)
├── services/         # ElizaOS services
├── actions/          # ElizaOS actions
├── providers/        # ElizaOS providers
├── types/            # TypeScript definitions
├── prompts/          # LLM prompts
└── data/             # Static data (node catalog)
```

### RAG Pipeline

```
User Prompt
    ↓
1. Keyword Extraction (LLM - OBJECT_SMALL)
    ↓
2. Node Catalog Search (Local - 457 nodes)
    ↓
3. Workflow Generation (LLM - TEXT_LARGE)
    ↓
4. Validation + Auto-fix
    ↓
5. Node Positioning (Breadth-first layout)
    ↓
6. Credential Resolution (3 modes)
    ↓
7. Deploy to n8n Cloud (REST API)
```

### Dual Mode Operation

**Local Mode:**
- Works standalone
- User manually configures credentials OR pre-configures credential IDs
- Workflow deployed with placeholders or pre-configured IDs

**Cloud Mode:**
- Integrates with `@eliza-cloud/plugin-oauth` (duck typing)
- Automatic OAuth flow for app connections
- Seamless credential injection via n8n API

## Sources

This plugin combines patterns from:
- **n8n-intelligence**: RAG pipeline, keyword extraction, node catalog, workflow generation
- **n8n-workflow-builder**: n8n API client, validation, positioning, credential management
- **ElizaOS v2.0.0**: Plugin architecture, ModelType API, services pattern

## Development

```bash
# Install dependencies
bun install

# Build
bun run build

# Watch mode
bun run dev

# Run tests
bun test

# Lint
bun run lint

# Format
bun run format
```

## License

MIT
