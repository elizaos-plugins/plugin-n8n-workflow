import { type IAgentRuntime, logger } from "@elizaos/core";
import {
  N8nWorkflow,
  OAuthService,
  isOAuthService,
  CredentialResolutionResult,
  MissingConnection,
  N8nPluginConfig,
  N8nCredentialSchema,
  UserTokens,
} from "../types/index";
import { N8nApiClient } from "./api";

/**
 * Resolve and inject credentials into workflow
 * Supports three modes:
 * 1. Cloud mode (with OAuth service): Auto-create credentials via OAuth
 * 2. Local pre-configured mode: Use credential IDs from config
 * 3. Local placeholder mode: Leave placeholders for manual configuration
 */
export async function resolveCredentials(
  workflow: N8nWorkflow,
  userId: string,
  runtime: IAgentRuntime,
  apiClient: N8nApiClient,
  config: N8nPluginConfig,
): Promise<CredentialResolutionResult> {
  const requiredCredTypes = extractRequiredCredentialTypes(workflow);

  if (requiredCredTypes.size === 0) {
    return {
      workflow,
      missingConnections: [],
      injectedCredentials: new Map(),
    };
  }

  const oauthService = runtime.getService("oauth");
  const hasOAuthService = oauthService && isOAuthService(oauthService);

  const injectedCredentials = new Map<string, string>();
  const missingConnections: MissingConnection[] = [];

  for (const credType of requiredCredTypes) {
    let credId: string | null = null;

    if (hasOAuthService) {
      credId = await resolveWithOAuth(
        credType,
        userId,
        oauthService as OAuthService,
        apiClient,
        missingConnections,
      );
    } else if (config.credentials?.[credType]) {
      credId = config.credentials[credType];
    } else {
      missingConnections.push({ credType });
    }

    if (credId) {
      injectedCredentials.set(credType, credId);
    }
  }

  const resolvedWorkflow = injectCredentialIds(workflow, injectedCredentials);

  return {
    workflow: resolvedWorkflow,
    missingConnections,
    injectedCredentials,
  };
}

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

function getProviderName(credType: string): string {
  return credType
    .replace(/OAuth2Api$/, "")
    .replace(/Api$/, "")
    .replace(/TokenApi$/, "")
    .toLowerCase();
}

async function resolveWithOAuth(
  credType: string,
  userId: string,
  oauthService: OAuthService,
  apiClient: N8nApiClient,
  missingConnections: MissingConnection[],
): Promise<string | null> {
  const existingCredId = await oauthService.getN8nCredId(userId, credType);
  if (existingCredId) {
    return existingCredId;
  }

  const hasConnection = await oauthService.hasConnection(userId, credType);
  if (!hasConnection) {
    const oauthUrl = await oauthService.getAuthUrl(
      userId,
      getProviderName(credType),
      [],
    );

    missingConnections.push({
      credType,
      oauthUrl,
    });

    return null;
  }

  try {
    const tokens = await oauthService.getTokens(userId, credType);
    if (!tokens) {
      throw new Error(`Failed to get tokens for ${credType}`);
    }

    const schema = await apiClient.getCredentialSchema(credType);
    const appConfig = await oauthService.getOAuthAppConfig?.(
      getProviderName(credType),
    );
    const credData = buildCredentialData(schema, tokens, appConfig);

    const credential = await apiClient.createCredential({
      name: `${credType} - ${userId}`,
      type: credType,
      data: credData,
    });

    await oauthService.setN8nCredId(userId, credType, credential.id);

    return credential.id;
  } catch (error) {
    logger.error(
      { src: "plugin:n8n-workflow:utils:credentials" },
      `Failed to create credential for ${credType}: ${error instanceof Error ? error.message : String(error)}`,
    );
    missingConnections.push({ credType });
    return null;
  }
}

function buildCredentialData(
  schema: N8nCredentialSchema,
  tokens: UserTokens,
  appConfig?: { clientId: string; clientSecret: string; scope?: string },
): Record<string, unknown> {
  const data: Record<string, unknown> = {};

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

  if (schema.properties.apiKey) {
    data.apiKey = tokens.apiKey || tokens.accessToken;
  }

  if (schema.properties.token) {
    data.token = tokens.accessToken;
  }

  if (schema.properties.domain && tokens.domain) {
    data.domain = tokens.domain;
  }

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

function injectCredentialIds(
  workflow: N8nWorkflow,
  credentialMap: Map<string, string>,
): N8nWorkflow {
  const injected = { ...workflow };
  injected.nodes = workflow.nodes.map((node) => {
    if (!node.credentials) {
      return node;
    }

    const updatedCredentials: typeof node.credentials = {};

    for (const [credType, credRef] of Object.entries(node.credentials)) {
      const credId = credentialMap.get(credType);

      if (credId) {
        updatedCredentials[credType] = {
          id: credId,
          name: credRef.name,
        };
      } else {
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

export function getMissingCredentials(workflow: N8nWorkflow): string[] {
  const missing: Set<string> = new Set();

  for (const node of workflow.nodes || []) {
    if (node.credentials) {
      for (const [credType, credRef] of Object.entries(node.credentials)) {
        if (
          typeof credRef === "object" &&
          "id" in credRef &&
          credRef.id === "PLACEHOLDER"
        ) {
          missing.add(credType);
        }
      }
    }
  }

  return Array.from(missing);
}
