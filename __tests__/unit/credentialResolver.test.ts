import { describe, test, expect, mock } from 'bun:test';
import { resolveCredentials, getMissingCredentials } from '../../src/utils/credentialResolver';
import { createMockRuntime } from '../helpers/mockRuntime';
import {
  createValidWorkflow,
  createGmailNode,
  createSlackNode,
  createTriggerNode,
  createWorkflowWithPlaceholderCreds,
  createCredentialSchema,
} from '../fixtures/workflows';
import type { N8nApiClient } from '../../src/utils/api';
import type { N8nPluginConfig, OAuthService } from '../../src/types/index';

function createMockApiClient(overrides?: Partial<N8nApiClient>): N8nApiClient {
  return {
    getCredentialSchema: mock(() => Promise.resolve(createCredentialSchema())),
    createCredential: mock(() =>
      Promise.resolve({
        id: 'new-cred-001',
        name: 'Created',
        type: 'gmailOAuth2Api',
        createdAt: '',
        updatedAt: '',
      })
    ),
    ...overrides,
  } as unknown as N8nApiClient;
}

function createMockOAuthService(overrides?: Partial<OAuthService>): OAuthService {
  return {
    getAuthUrl: mock(() => Promise.resolve('https://auth.example.com/connect')),
    hasConnection: mock(() => Promise.resolve(true)),
    getTokens: mock(() =>
      Promise.resolve({
        accessToken: 'token-123',
        refreshToken: 'refresh-456',
        tokenType: 'Bearer',
        expiresIn: 3600,
      })
    ),
    getOAuthAppConfig: mock(() =>
      Promise.resolve({
        clientId: 'client-id',
        clientSecret: 'client-secret',
        scope: 'https://www.googleapis.com/auth/gmail.send',
      })
    ),
    ...overrides,
  };
}

// ============================================================================
// resolveCredentials
// ============================================================================

describe('resolveCredentials', () => {
  test('returns unchanged workflow when no credentials needed', () => {
    const workflow = createValidWorkflow({
      nodes: [createTriggerNode(), { ...createGmailNode(), credentials: undefined }],
    });
    const runtime = createMockRuntime();
    const apiClient = createMockApiClient();
    const config: N8nPluginConfig = { apiKey: 'key', host: 'http://localhost' };

    const result = resolveCredentials(workflow, 'user-001', runtime, apiClient, config);
    return result.then((res) => {
      expect(res.missingConnections).toHaveLength(0);
      expect(res.injectedCredentials.size).toBe(0);
    });
  });

  test('local placeholder mode: adds missing connections when no config', () => {
    const workflow = createValidWorkflow();
    const runtime = createMockRuntime(); // no oauth service
    const apiClient = createMockApiClient();
    const config: N8nPluginConfig = { apiKey: 'key', host: 'http://localhost' };

    return resolveCredentials(workflow, 'user-001', runtime, apiClient, config).then((res) => {
      expect(res.missingConnections.length).toBeGreaterThan(0);
      expect(res.missingConnections[0].credType).toBe('gmailOAuth2Api');
    });
  });

  test('local pre-configured mode: injects credential IDs from config', () => {
    const workflow = createValidWorkflow();
    const runtime = createMockRuntime(); // no oauth service
    const apiClient = createMockApiClient();
    const config: N8nPluginConfig = {
      apiKey: 'key',
      host: 'http://localhost',
      credentials: { gmailOAuth2Api: 'preconfigured-cred-id' },
    };

    return resolveCredentials(workflow, 'user-001', runtime, apiClient, config).then((res) => {
      expect(res.injectedCredentials.get('gmailOAuth2Api')).toBe('preconfigured-cred-id');
      // Verify credential was injected into node
      const gmailNode = res.workflow.nodes.find((n) => n.name === 'Gmail');
      expect(gmailNode?.credentials?.gmailOAuth2Api.id).toBe('preconfigured-cred-id');
    });
  });

  test('cloud mode: creates credentials via OAuth', () => {
    const oauthService = createMockOAuthService();
    const runtime = createMockRuntime({
      services: { oauth: oauthService },
    });
    const apiClient = createMockApiClient();
    const config: N8nPluginConfig = { apiKey: 'key', host: 'http://localhost' };

    return resolveCredentials(createValidWorkflow(), 'user-001', runtime, apiClient, config).then(
      (res) => {
        expect(res.injectedCredentials.get('gmailOAuth2Api')).toBe('new-cred-001');
        expect(oauthService.getTokens).toHaveBeenCalled();
      }
    );
  });

  test('cloud mode: returns existing credential ID from credential store', () => {
    const oauthService = createMockOAuthService();
    const mockCredStore = {
      get: mock(() => Promise.resolve('cached-cred-id')),
      set: mock(() => Promise.resolve()),
    };
    const runtime = createMockRuntime({
      services: {
        oauth: oauthService,
        n8n_credential_store: mockCredStore,
      },
    });
    const apiClient = createMockApiClient();
    const config: N8nPluginConfig = { apiKey: 'key', host: 'http://localhost' };

    return resolveCredentials(createValidWorkflow(), 'user-001', runtime, apiClient, config).then(
      (res) => {
        expect(res.injectedCredentials.get('gmailOAuth2Api')).toBe('cached-cred-id');
        // Should not create a new credential
        expect(apiClient.createCredential).not.toHaveBeenCalled();
      }
    );
  });

  test('cloud mode: persists credential ID to store after creation', () => {
    const oauthService = createMockOAuthService();
    const mockCredStore = {
      get: mock(() => Promise.resolve(null)),
      set: mock(() => Promise.resolve()),
    };
    const runtime = createMockRuntime({
      services: {
        oauth: oauthService,
        n8n_credential_store: mockCredStore,
      },
    });
    const apiClient = createMockApiClient();
    const config: N8nPluginConfig = { apiKey: 'key', host: 'http://localhost' };

    return resolveCredentials(createValidWorkflow(), 'user-001', runtime, apiClient, config).then(
      () => {
        expect(mockCredStore.set).toHaveBeenCalledWith(
          'user-001',
          'gmailOAuth2Api',
          'new-cred-001'
        );
      }
    );
  });

  test('cloud mode: reports missing connections when user has no OAuth connection', () => {
    const oauthService = createMockOAuthService({
      hasConnection: mock(() => Promise.resolve(false)),
    });
    const runtime = createMockRuntime({
      services: { oauth: oauthService },
    });
    const apiClient = createMockApiClient();
    const config: N8nPluginConfig = { apiKey: 'key', host: 'http://localhost' };

    return resolveCredentials(createValidWorkflow(), 'user-001', runtime, apiClient, config).then(
      (res) => {
        expect(res.missingConnections.length).toBeGreaterThan(0);
        expect(res.missingConnections[0].oauthUrl).toBeDefined();
      }
    );
  });

  test('cloud mode: builds OAuth credential data with tokens and app config', () => {
    const oauthService = createMockOAuthService();
    const createCredential = mock(() =>
      Promise.resolve({
        id: 'new-cred-001',
        name: 'Created',
        type: 'gmailOAuth2Api',
        createdAt: '',
        updatedAt: '',
      })
    );
    const apiClient = createMockApiClient({ createCredential });
    const runtime = createMockRuntime({
      services: { oauth: oauthService },
    });
    const config: N8nPluginConfig = { apiKey: 'key', host: 'http://localhost' };

    return resolveCredentials(createValidWorkflow(), 'user-001', runtime, apiClient, config).then(
      () => {
        // Verify createCredential was called with OAuth token data
        const callArgs = (createCredential as any).mock.calls[0][0];
        expect(callArgs.type).toBe('gmailOAuth2Api');
        expect(callArgs.data.oauthTokenData).toBeDefined();
        expect(callArgs.data.oauthTokenData.access_token).toBe('token-123');
        expect(callArgs.data.oauthTokenData.refresh_token).toBe('refresh-456');
        expect(callArgs.data.oauthTokenData.token_type).toBe('Bearer');
        expect(callArgs.data.clientId).toBe('client-id');
        expect(callArgs.data.clientSecret).toBe('client-secret');
      }
    );
  });

  test('cloud mode: builds API key credential data for non-OAuth schemas', () => {
    const oauthService = createMockOAuthService({
      getTokens: mock(() =>
        Promise.resolve({
          accessToken: 'api-key-value',
          refreshToken: '',
          tokenType: 'Bearer',
          expiresIn: 0,
        })
      ),
      getOAuthAppConfig: mock(() => Promise.resolve(undefined)),
    });
    const createCredential = mock(() =>
      Promise.resolve({
        id: 'new-cred-002',
        name: 'Created',
        type: 'slackApi',
        createdAt: '',
        updatedAt: '',
      })
    );
    // Schema with apiKey field instead of oauthTokenData
    const apiKeySchema = {
      type: 'object' as const,
      additionalProperties: false,
      properties: {
        apiKey: {
          type: 'string',
          displayName: 'API Key',
        },
      },
    };
    const apiClient = createMockApiClient({
      createCredential,
      getCredentialSchema: mock(() => Promise.resolve(apiKeySchema)),
    });
    const runtime = createMockRuntime({
      services: { oauth: oauthService },
    });

    const workflow = createValidWorkflow({
      nodes: [
        createTriggerNode(),
        {
          ...createSlackNode(),
          credentials: { slackApi: { id: 'PLACEHOLDER', name: 'Slack' } },
        },
      ],
    });
    const config: N8nPluginConfig = { apiKey: 'key', host: 'http://localhost' };

    return resolveCredentials(workflow, 'user-001', runtime, apiClient, config).then(() => {
      const callArgs = (createCredential as any).mock.calls[0][0];
      expect(callArgs.data.apiKey).toBe('api-key-value');
      expect(callArgs.data.oauthTokenData).toBeUndefined();
    });
  });

  test('cloud mode: falls back to missing connection on token retrieval failure', () => {
    const oauthService = createMockOAuthService({
      getTokens: mock(() => Promise.resolve(null)),
    });
    const runtime = createMockRuntime({
      services: { oauth: oauthService },
    });
    const apiClient = createMockApiClient();
    const config: N8nPluginConfig = { apiKey: 'key', host: 'http://localhost' };

    return resolveCredentials(createValidWorkflow(), 'user-001', runtime, apiClient, config).then(
      (res) => {
        expect(res.missingConnections.length).toBeGreaterThan(0);
        expect(res.injectedCredentials.size).toBe(0);
      }
    );
  });

  test('handles multiple credential types', () => {
    const workflow = createValidWorkflow({
      nodes: [createTriggerNode(), createGmailNode(), createSlackNode()],
    });
    const runtime = createMockRuntime();
    const apiClient = createMockApiClient();
    const config: N8nPluginConfig = {
      apiKey: 'key',
      host: 'http://localhost',
      credentials: {
        gmailOAuth2Api: 'gmail-cred',
        slackApi: 'slack-cred',
      },
    };

    return resolveCredentials(workflow, 'user-001', runtime, apiClient, config).then((res) => {
      expect(res.injectedCredentials.get('gmailOAuth2Api')).toBe('gmail-cred');
      expect(res.injectedCredentials.get('slackApi')).toBe('slack-cred');
    });
  });

  test('fuzzy match: resolves config key without Api suffix when workflow uses Api suffix', () => {
    // Workflow node uses "gmailOAuth2Api" but config has "gmailOAuth2"
    const workflow = createValidWorkflow();
    const runtime = createMockRuntime();
    const apiClient = createMockApiClient();
    const config: N8nPluginConfig = {
      apiKey: 'key',
      host: 'http://localhost',
      credentials: { gmailOAuth2: 'gmail-cred-from-config' },
    };

    return resolveCredentials(workflow, 'user-001', runtime, apiClient, config).then((res) => {
      expect(res.injectedCredentials.get('gmailOAuth2Api')).toBe('gmail-cred-from-config');
      expect(res.missingConnections).toHaveLength(0);
    });
  });

  test('fuzzy match: resolves config key with Api suffix when workflow omits it', () => {
    // Workflow node uses "gmailOAuth2" but config has "gmailOAuth2Api"
    const workflow = createValidWorkflow({
      nodes: [
        createTriggerNode(),
        {
          ...createGmailNode(),
          credentials: { gmailOAuth2: { id: 'PLACEHOLDER', name: 'Gmail' } },
        },
      ],
    });
    const runtime = createMockRuntime();
    const apiClient = createMockApiClient();
    const config: N8nPluginConfig = {
      apiKey: 'key',
      host: 'http://localhost',
      credentials: { gmailOAuth2Api: 'gmail-cred-with-api' },
    };

    return resolveCredentials(workflow, 'user-001', runtime, apiClient, config).then((res) => {
      expect(res.injectedCredentials.get('gmailOAuth2')).toBe('gmail-cred-with-api');
      expect(res.missingConnections).toHaveLength(0);
    });
  });
});

// ============================================================================
// getMissingCredentials
// ============================================================================

describe('getMissingCredentials', () => {
  test('returns empty array for workflow without credentials', () => {
    const workflow = createValidWorkflow({
      nodes: [createTriggerNode()],
    });
    const result = getMissingCredentials(workflow);
    expect(result).toHaveLength(0);
  });

  test('detects PLACEHOLDER credentials', () => {
    const result = getMissingCredentials(createWorkflowWithPlaceholderCreds());
    expect(result).toContain('gmailOAuth2Api');
  });

  test('detects {{CREDENTIAL_ID}} template placeholders', () => {
    const workflow = createValidWorkflow({
      nodes: [
        createTriggerNode(),
        {
          ...createGmailNode(),
          credentials: { gmailOAuth2Api: { id: '{{CREDENTIAL_ID}}', name: 'Gmail' } },
        },
      ],
    });
    const result = getMissingCredentials(workflow);
    expect(result).toContain('gmailOAuth2Api');
  });

  test('detects empty string credential IDs', () => {
    const workflow = createValidWorkflow({
      nodes: [
        createTriggerNode(),
        {
          ...createGmailNode(),
          credentials: { gmailOAuth2Api: { id: '', name: 'Gmail' } },
        },
      ],
    });
    const result = getMissingCredentials(workflow);
    expect(result).toContain('gmailOAuth2Api');
  });

  test('does not flag non-placeholder credentials', () => {
    const result = getMissingCredentials(createValidWorkflow());
    expect(result).toHaveLength(0);
  });

  test('deduplicates credential types', () => {
    const workflow = createValidWorkflow({
      nodes: [
        createTriggerNode(),
        {
          ...createGmailNode({ name: 'Gmail 1' }),
          credentials: { gmailOAuth2Api: { id: 'PLACEHOLDER', name: 'Gmail' } },
        },
        {
          ...createGmailNode({ name: 'Gmail 2' }),
          credentials: { gmailOAuth2Api: { id: 'PLACEHOLDER', name: 'Gmail' } },
        },
      ],
    });
    const result = getMissingCredentials(workflow);
    expect(result).toHaveLength(1);
    expect(result[0]).toBe('gmailOAuth2Api');
  });
});
