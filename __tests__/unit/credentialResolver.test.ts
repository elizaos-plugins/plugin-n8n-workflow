import { describe, test, expect, mock } from 'bun:test';
import { resolveCredentials, getMissingCredentials } from '../../src/utils/credentialResolver';
import {
  createValidWorkflow,
  createGmailNode,
  createSlackNode,
  createTriggerNode,
  createWorkflowWithPlaceholderCreds,
} from '../fixtures/workflows';
import type {
  N8nPluginConfig,
  CredentialProvider,
  N8nCredentialStoreApi,
  CredentialProviderResult,
} from '../../src/types/index';

function createMockCredStore(overrides?: Partial<N8nCredentialStoreApi>): N8nCredentialStoreApi {
  return {
    get: mock(() => Promise.resolve(null)),
    set: mock(() => Promise.resolve()),
    ...overrides,
  };
}

function createMockCredProvider(
  resolveFn?: (userId: string, credType: string) => Promise<CredentialProviderResult>
): CredentialProvider {
  return {
    resolve: mock(resolveFn ?? (() => Promise.resolve(null))),
  };
}

const baseConfig: N8nPluginConfig = { apiKey: 'key', host: 'http://localhost' };

// ============================================================================
// resolveCredentials
// ============================================================================

describe('resolveCredentials', () => {
  test('returns unchanged workflow when no credentials needed', async () => {
    const workflow = createValidWorkflow({
      nodes: [createTriggerNode(), { ...createGmailNode(), credentials: undefined }],
    });

    const res = await resolveCredentials(workflow, 'user-001', baseConfig, null, null);
    expect(res.missingConnections).toHaveLength(0);
    expect(res.injectedCredentials.size).toBe(0);
  });

  test('reports missing when no config, no store, no provider', async () => {
    const res = await resolveCredentials(createValidWorkflow(), 'user-001', baseConfig, null, null);
    expect(res.missingConnections.length).toBeGreaterThan(0);
    expect(res.missingConnections[0].credType).toBe('gmailOAuth2Api');
  });

  // --------------------------------------------------------------------------
  // Static config mode
  // --------------------------------------------------------------------------

  test('config mode: injects credential IDs from config', async () => {
    const config: N8nPluginConfig = {
      ...baseConfig,
      credentials: { gmailOAuth2Api: 'preconfigured-cred-id' },
    };

    const res = await resolveCredentials(createValidWorkflow(), 'user-001', config, null, null);
    expect(res.injectedCredentials.get('gmailOAuth2Api')).toBe('preconfigured-cred-id');
    const gmailNode = res.workflow.nodes.find((n) => n.name === 'Gmail');
    expect(gmailNode?.credentials?.gmailOAuth2Api.id).toBe('preconfigured-cred-id');
  });

  test('config mode: fuzzy match without Api suffix', async () => {
    const config: N8nPluginConfig = {
      ...baseConfig,
      credentials: { gmailOAuth2: 'gmail-cred-from-config' },
    };

    const res = await resolveCredentials(createValidWorkflow(), 'user-001', config, null, null);
    expect(res.injectedCredentials.get('gmailOAuth2Api')).toBe('gmail-cred-from-config');
    expect(res.missingConnections).toHaveLength(0);
  });

  test('config mode: fuzzy match with Api suffix', async () => {
    const workflow = createValidWorkflow({
      nodes: [
        createTriggerNode(),
        {
          ...createGmailNode(),
          credentials: { gmailOAuth2: { id: 'PLACEHOLDER', name: 'Gmail' } },
        },
      ],
    });
    const config: N8nPluginConfig = {
      ...baseConfig,
      credentials: { gmailOAuth2Api: 'gmail-cred-with-api' },
    };

    const res = await resolveCredentials(workflow, 'user-001', config, null, null);
    expect(res.injectedCredentials.get('gmailOAuth2')).toBe('gmail-cred-with-api');
    expect(res.missingConnections).toHaveLength(0);
  });

  test('config mode: handles multiple credential types', async () => {
    const workflow = createValidWorkflow({
      nodes: [createTriggerNode(), createGmailNode(), createSlackNode()],
    });
    const config: N8nPluginConfig = {
      ...baseConfig,
      credentials: { gmailOAuth2Api: 'gmail-cred', slackApi: 'slack-cred' },
    };

    const res = await resolveCredentials(workflow, 'user-001', config, null, null);
    expect(res.injectedCredentials.get('gmailOAuth2Api')).toBe('gmail-cred');
    expect(res.injectedCredentials.get('slackApi')).toBe('slack-cred');
  });

  // --------------------------------------------------------------------------
  // Credential store DB mode
  // --------------------------------------------------------------------------

  test('db mode: resolves from credential store', async () => {
    const credStore = createMockCredStore({
      get: mock(() => Promise.resolve('cached-cred-id')),
    });

    const res = await resolveCredentials(
      createValidWorkflow(),
      'user-001',
      baseConfig,
      credStore,
      null
    );
    expect(res.injectedCredentials.get('gmailOAuth2Api')).toBe('cached-cred-id');
    expect(res.missingConnections).toHaveLength(0);
  });

  test('db mode: takes priority over config', async () => {
    const credStore = createMockCredStore({
      get: mock(() => Promise.resolve('db-cred-id')),
    });
    const config: N8nPluginConfig = {
      ...baseConfig,
      credentials: { gmailOAuth2Api: 'config-cred-id' },
    };

    const res = await resolveCredentials(
      createValidWorkflow(),
      'user-001',
      config,
      credStore,
      null
    );
    expect(res.injectedCredentials.get('gmailOAuth2Api')).toBe('db-cred-id');
  });

  // --------------------------------------------------------------------------
  // External provider mode
  // --------------------------------------------------------------------------

  test('provider mode: resolves via external provider', async () => {
    const provider = createMockCredProvider(async () => ({
      status: 'resolved' as const,
      credentialId: 'provider-cred-id',
    }));

    const res = await resolveCredentials(
      createValidWorkflow(),
      'user-001',
      baseConfig,
      null,
      provider
    );
    expect(res.injectedCredentials.get('gmailOAuth2Api')).toBe('provider-cred-id');
  });

  test('provider mode: caches resolved credential in store', async () => {
    const credStore = createMockCredStore();
    const provider = createMockCredProvider(async () => ({
      status: 'resolved' as const,
      credentialId: 'provider-cred-id',
    }));

    await resolveCredentials(createValidWorkflow(), 'user-001', baseConfig, credStore, provider);
    expect(credStore.set).toHaveBeenCalledWith('user-001', 'gmailOAuth2Api', 'provider-cred-id');
  });

  test('provider mode: returns authUrl when needs_auth', async () => {
    const provider = createMockCredProvider(async () => ({
      status: 'needs_auth' as const,
      authUrl: 'https://auth.example.com/connect',
    }));

    const res = await resolveCredentials(
      createValidWorkflow(),
      'user-001',
      baseConfig,
      null,
      provider
    );
    expect(res.missingConnections.length).toBeGreaterThan(0);
    expect(res.missingConnections[0].authUrl).toBe('https://auth.example.com/connect');
  });

  test('provider mode: falls back to missing on null result', async () => {
    const provider = createMockCredProvider(async () => null);

    const res = await resolveCredentials(
      createValidWorkflow(),
      'user-001',
      baseConfig,
      null,
      provider
    );
    expect(res.missingConnections.length).toBeGreaterThan(0);
    expect(res.missingConnections[0].authUrl).toBeUndefined();
  });

  test('provider mode: falls back to missing on provider error', async () => {
    const provider = createMockCredProvider(async () => {
      throw new Error('Provider exploded');
    });

    const res = await resolveCredentials(
      createValidWorkflow(),
      'user-001',
      baseConfig,
      null,
      provider
    );
    expect(res.missingConnections.length).toBeGreaterThan(0);
  });

  // --------------------------------------------------------------------------
  // Resolution priority
  // --------------------------------------------------------------------------

  test('priority: db > config > provider', async () => {
    const credStore = createMockCredStore({
      get: mock(() => Promise.resolve('db-wins')),
    });
    const config: N8nPluginConfig = {
      ...baseConfig,
      credentials: { gmailOAuth2Api: 'config-loses' },
    };
    const provider = createMockCredProvider(async () => ({
      status: 'resolved' as const,
      credentialId: 'provider-loses',
    }));

    const res = await resolveCredentials(
      createValidWorkflow(),
      'user-001',
      config,
      credStore,
      provider
    );
    expect(res.injectedCredentials.get('gmailOAuth2Api')).toBe('db-wins');
    expect(provider.resolve).not.toHaveBeenCalled();
  });

  test('priority: config > provider when db returns null', async () => {
    const credStore = createMockCredStore();
    const config: N8nPluginConfig = {
      ...baseConfig,
      credentials: { gmailOAuth2Api: 'config-wins' },
    };
    const provider = createMockCredProvider(async () => ({
      status: 'resolved' as const,
      credentialId: 'provider-loses',
    }));

    const res = await resolveCredentials(
      createValidWorkflow(),
      'user-001',
      config,
      credStore,
      provider
    );
    expect(res.injectedCredentials.get('gmailOAuth2Api')).toBe('config-wins');
    expect(provider.resolve).not.toHaveBeenCalled();
  });
});

// ============================================================================
// getMissingCredentials
// ============================================================================

describe('getMissingCredentials', () => {
  test('returns empty array for workflow without credentials', () => {
    const workflow = createValidWorkflow({ nodes: [createTriggerNode()] });
    expect(getMissingCredentials(workflow)).toHaveLength(0);
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
    expect(getMissingCredentials(workflow)).toContain('gmailOAuth2Api');
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
    expect(getMissingCredentials(workflow)).toContain('gmailOAuth2Api');
  });

  test('does not flag non-placeholder credentials', () => {
    expect(getMissingCredentials(createValidWorkflow())).toHaveLength(0);
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
