import type { IAgentRuntime } from "@elizaos/core";
import {
  N8nWorkflow,
  OAuthService,
  isOAuthService,
  CredentialResolutionResult,
  MissingConnection,
  N8nPluginConfig,
  N8nCredentialSchema,
  UserTokens,
} from "../types/index.js";
import { N8nApiClient } from "../api/index.js";

/**
 * Resolve and inject credentials into workflow
 * Supports three modes:
 * 1. Cloud mode (with OAuth service): Auto-create credentials via OAuth
 * 2. Local pre-configured mode: Use credential IDs from config
 * 3. Local placeholder mode: Leave placeholders for manual configuration
 *
 * @param workflow - Generated workflow (may have {{CREDENTIAL_ID}} placeholders)
 * @param userId - User ID (for cloud mode)
 * @param runtime - ElizaOS runtime (to access OAuth service)
 * @param apiClient - n8n API client
 * @param config - Plugin configuration
 * @returns Workflow with injected credentials + list of missing connections
 */
export async function resolveCredentials(
  workflow: N8nWorkflow,
  userId: string,
  runtime: IAgentRuntime,
  apiClient: N8nApiClient,
  config: N8nPluginConfig,
): Promise<CredentialResolutionResult> {
  // Scan workflow for required credential types
  const requiredCredTypes = extractRequiredCredentialTypes(workflow);

  if (requiredCredTypes.size === 0) {
    // No credentials needed
    return {
      workflow,
      missingConnections: [],
      injectedCredentials: new Map(),
    };
  }

  // Try to get OAuth service (cloud mode)
  const oauthService = runtime.getService("oauth");
  const hasOAuthService = oauthService && isOAuthService(oauthService);

  const injectedCredentials = new Map<string, string>();
  const missingConnections: MissingConnection[] = [];

  for (const credType of requiredCredTypes) {
    let credId: string | null = null;

    // Mode 1: Cloud mode with OAuth service
    if (hasOAuthService) {
      credId = await resolveWithOAuth(
        credType,
        userId,
        oauthService as OAuthService,
        apiClient,
        missingConnections,
      );
    }
    // Mode 2: Local pre-configured mode
    else if (config.credentials?.[credType]) {
      credId = config.credentials[credType];
    }
    // Mode 3: Local placeholder mode (leave as-is)
    else {
      missingConnections.push({
        credType,
        displayName: getCredentialDisplayName(credType),
        provider: getProviderName(credType),
      });
    }

    if (credId) {
      injectedCredentials.set(credType, credId);
    }
  }

  // Inject resolved credential IDs into workflow
  const resolvedWorkflow = injectCredentialIds(workflow, injectedCredentials);

  return {
    workflow: resolvedWorkflow,
    missingConnections,
    injectedCredentials,
  };
}

/**
 * Extract all unique credential types required by workflow
 */
function extractRequiredCredentialTypes(workflow: N8nWorkflow): Set<string> {
  const credTypes = new Set<string>();

  for (const node of workflow.nodes) {
    if (node.credentials) {
      for (const credType of Object.keys(node.credentials)) {
        credTypes.add(credType);
      }
    }
  }

  return credTypes;
}

/**
 * Resolve credential using OAuth service (cloud mode)
 */
async function resolveWithOAuth(
  credType: string,
  userId: string,
  oauthService: OAuthService,
  apiClient: N8nApiClient,
  missingConnections: MissingConnection[],
): Promise<string | null> {
  // Check if user already has an n8n credential for this type
  const existingCredId = await oauthService.getN8nCredId(userId, credType);
  if (existingCredId) {
    return existingCredId;
  }

  // Check if user has connected the OAuth app
  const hasConnection = await oauthService.hasConnection(userId, credType);
  if (!hasConnection) {
    // User needs to connect this app first
    const oauthUrl = await oauthService.getAuthUrl(
      userId,
      getProviderName(credType),
      [],
    );

    missingConnections.push({
      credType,
      displayName: getCredentialDisplayName(credType),
      provider: getProviderName(credType),
      oauthUrl,
    });

    return null;
  }

  // User has OAuth tokens - create n8n credential
  try {
    const tokens = await oauthService.getTokens(userId, credType);
    if (!tokens) {
      throw new Error(`Failed to get tokens for ${credType}`);
    }

    // Get credential schema from n8n
    const schema = await apiClient.getCredentialSchema(credType);

    // Get platform OAuth app config
    const appConfig = await oauthService.getOAuthAppConfig?.(
      getProviderName(credType),
    );

    // Build credential data
    const credData = buildCredentialData(schema, tokens, appConfig);

    // Create credential in n8n
    const credential = await apiClient.createCredential({
      name: `${getCredentialDisplayName(credType)} - ${userId}`,
      type: credType,
      data: credData,
    });

    // Store mapping for future use
    await oauthService.setN8nCredId(userId, credType, credential.id);

    return credential.id;
  } catch (error) {
    console.error(
      `[credential-resolver] Failed to create credential for ${credType}:`,
      error,
    );
    missingConnections.push({
      credType,
      displayName: getCredentialDisplayName(credType),
      provider: getProviderName(credType),
    });
    return null;
  }
}

/**
 * Build credential data from schema + user tokens
 * Maps our token structure to n8n's credential schema
 */
function buildCredentialData(
  schema: N8nCredentialSchema,
  tokens: UserTokens,
  appConfig?: { clientId: string; clientSecret: string; scope?: string },
): Record<string, unknown> {
  const data: Record<string, unknown> = {};

  // Handle OAuth2 credentials with oauthTokenData field
  if (schema.properties.oauthTokenData) {
    data.oauthTokenData = {
      access_token: tokens.accessToken,
      refresh_token: tokens.refreshToken,
      token_type: tokens.tokenType || "Bearer",
      expires_in: tokens.expiresIn || 3600,
      scope: appConfig?.scope || tokens.scope,
    };

    if (appConfig) {
      data.clientId = appConfig.clientId;
      data.clientSecret = appConfig.clientSecret;
      if (appConfig.scope) {
        data.scope = appConfig.scope;
      }
    }

    return data;
  }

  // Handle simple API key credentials
  if (schema.properties.apiKey) {
    data.apiKey = tokens.apiKey || tokens.accessToken;
  }

  // Handle token-based auth
  if (schema.properties.token) {
    data.token = tokens.accessToken;
  }

  // Handle domain-based credentials (e.g., Freshdesk)
  if (schema.properties.domain && tokens.domain) {
    data.domain = tokens.domain;
  }

  // Add any other fields with defaults from schema
  for (const [field, fieldSchema] of Object.entries(schema.properties)) {
    if (
      data[field] === undefined &&
      typeof fieldSchema === "object" &&
      fieldSchema !== null &&
      "default" in fieldSchema &&
      fieldSchema.default !== undefined
    ) {
      data[field] = fieldSchema.default;
    }
  }

  return data;
}

/**
 * Inject resolved credential IDs into workflow nodes
 */
function injectCredentialIds(
  workflow: N8nWorkflow,
  credentialMap: Map<string, string>,
): N8nWorkflow {
  const injected = { ...workflow };
  injected.nodes = workflow.nodes.map((node) => {
    if (!node.credentials) return node;

    const updatedCredentials: typeof node.credentials = {};

    for (const [credType, credRef] of Object.entries(node.credentials)) {
      const credId = credentialMap.get(credType);

      if (credId) {
        // Inject resolved credential ID
        updatedCredentials[credType] = {
          id: credId,
          name: credRef.name,
        };
      } else {
        // Keep placeholder or existing value
        updatedCredentials[credType] = credRef;
      }
    }

    return {
      ...node,
      credentials: updatedCredentials,
    };
  });

  return injected;
}

/**
 * Get human-readable display name for credential type
 */
function getCredentialDisplayName(credType: string): string {
  const mapping: Record<string, string> = {
    gmailOAuth2Api: "Gmail",
    googleSheetsOAuth2Api: "Google Sheets",
    googleCalendarOAuth2Api: "Google Calendar",
    googleDriveOAuth2Api: "Google Drive",
    slackOAuth2Api: "Slack",
    notionOAuth2Api: "Notion",
    githubOAuth2Api: "GitHub",
    stripeApi: "Stripe",
    airtableTokenApi: "Airtable",
    telegramApi: "Telegram",
    discordBotApi: "Discord",
  };

  return mapping[credType] || credType;
}

/**
 * Get provider name from credential type
 */
function getProviderName(credType: string): string {
  // Extract provider name from credential type
  // e.g., "gmailOAuth2Api" → "gmail", "stripeApi" → "stripe"
  return credType
    .replace(/OAuth2Api$/, "")
    .replace(/Api$/, "")
    .replace(/TokenApi$/, "")
    .toLowerCase();
}
