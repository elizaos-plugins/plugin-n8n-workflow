/**
 * E2E Lifecycle Tests
 *
 * Tests the full chain: action.handler() → matchWorkflow() (LLM) → service → apiClient → fetch
 *
 * Only fetch and LLM are mocked. Everything else is real code:
 * - Real activateWorkflowAction.handler()
 * - Real buildConversationContext()
 * - Real matchWorkflow() (with mock LLM response)
 * - Real N8nWorkflowService methods
 * - Real N8nApiClient (with mock fetch)
 */

import { describe, test, expect, afterEach, mock } from 'bun:test';
import type { State } from '@elizaos/core';
import { activateWorkflowAction } from '../../src/actions/activateWorkflow';
import { deactivateWorkflowAction } from '../../src/actions/deactivateWorkflow';
import { deleteWorkflowAction } from '../../src/actions/deleteWorkflow';
import { listWorkflowsAction } from '../../src/actions/listWorkflows';
import { getExecutionsAction } from '../../src/actions/getExecutions';
import { activeWorkflowsProvider } from '../../src/providers/activeWorkflows';
import { createE2ERuntime, jsonResponse } from '../helpers/testRuntime';
import {
  createWorkflowResponse,
  createExecution,
  createTag,
  createMatchResult,
  createNoMatchResult,
} from '../fixtures/workflows';

const USER_TAG = createTag({ id: 'tag-user', name: 'user:user-e2e' });

// ============================================================================
// ACTIVATE — Full chain
// ============================================================================

describe('E2E: ACTIVATE workflow', () => {
  let cleanup: () => void;

  afterEach(() => cleanup?.());

  test('full chain: handler → matchWorkflow → service → API → fetch', async () => {
    const activatedWf = createWorkflowResponse({
      id: 'wf-001',
      name: 'Stripe Payments',
      active: true,
    });

    const ctx = createE2ERuntime({
      fetchResponses: new Map([
        ['/workflows/wf-001/activate', () => jsonResponse(200, activatedWf)],
      ]),
      useModelResponse: mock(() =>
        Promise.resolve(
          createMatchResult({
            matchedWorkflowId: 'wf-001',
            confidence: 'high',
          })
        )
      ),
      workflows: [
        { id: 'wf-001', name: 'Stripe Payments', active: false },
        { id: 'wf-002', name: 'Gmail Notifications', active: true },
      ],
    });
    cleanup = ctx.cleanup;

    const callback = ctx.createCallback();
    const result = await activateWorkflowAction.handler(
      ctx.runtime,
      ctx.createMessage('Activate the Stripe workflow'),
      ctx.state,
      {},
      callback
    );

    // Verify result
    expect(result?.success).toBe(true);

    // Verify fetch was called with correct URL
    const fetchCalls = ctx.fetchMock.mock.calls as [string, RequestInit][];
    const activateCall = fetchCalls.find(([url]) => url.includes('/workflows/wf-001/activate'));
    expect(activateCall).toBeDefined();
    expect(activateCall![1].method).toBe('POST');

    // Verify LLM was called for matching
    expect(ctx.runtime.useModel).toHaveBeenCalled();

    // Verify callback was called with success message
    expect(callback).toHaveBeenCalled();
  });

  test('full chain: no match returns failure without calling API', async () => {
    const ctx = createE2ERuntime({
      useModelResponse: mock(() => Promise.resolve(createNoMatchResult())),
      workflows: [{ id: 'wf-001', name: 'Stripe Payments', active: false }],
    });
    cleanup = ctx.cleanup;

    const callback = ctx.createCallback();
    const result = await activateWorkflowAction.handler(
      ctx.runtime,
      ctx.createMessage('Activate the nonexistent workflow'),
      ctx.state,
      {},
      callback
    );

    expect(result?.success).toBe(false);

    // Verify fetch was NOT called (no API hit)
    expect(ctx.fetchMock).not.toHaveBeenCalled();
  });

  test('full chain: API error propagates through entire chain', async () => {
    const ctx = createE2ERuntime({
      fetchResponses: new Map([
        [
          '/workflows/wf-001/activate',
          () => jsonResponse(403, { message: 'Insufficient permissions' }),
        ],
      ]),
      useModelResponse: mock(() => Promise.resolve(createMatchResult())),
      workflows: [{ id: 'wf-001', name: 'Stripe Payments', active: false }],
    });
    cleanup = ctx.cleanup;

    const callback = ctx.createCallback();
    const result = await activateWorkflowAction.handler(
      ctx.runtime,
      ctx.createMessage('Activate Stripe'),
      ctx.state,
      {},
      callback
    );

    expect(result?.success).toBe(false);
    const errorText = (callback as any).mock.calls.at(-1)[0].text;
    expect(errorText).toContain('Insufficient permissions');
  });
});

// ============================================================================
// DEACTIVATE — Full chain
// ============================================================================

describe('E2E: DEACTIVATE workflow', () => {
  let cleanup: () => void;

  afterEach(() => cleanup?.());

  test('full chain: deactivates workflow via real service and API', async () => {
    const deactivatedWf = createWorkflowResponse({
      id: 'wf-001',
      active: false,
    });

    const ctx = createE2ERuntime({
      fetchResponses: new Map([
        ['/workflows/wf-001/deactivate', () => jsonResponse(200, deactivatedWf)],
      ]),
      useModelResponse: mock(() => Promise.resolve(createMatchResult())),
      workflows: [{ id: 'wf-001', name: 'Stripe Payments', active: true }],
    });
    cleanup = ctx.cleanup;

    const callback = ctx.createCallback();
    const result = await deactivateWorkflowAction.handler(
      ctx.runtime,
      ctx.createMessage('Pause the Stripe workflow'),
      ctx.state,
      {},
      callback
    );

    expect(result?.success).toBe(true);

    const fetchCalls = ctx.fetchMock.mock.calls as [string, RequestInit][];
    const deactivateCall = fetchCalls.find(([url]) => url.includes('/workflows/wf-001/deactivate'));
    expect(deactivateCall).toBeDefined();
    expect(deactivateCall![1].method).toBe('POST');
  });
});

// ============================================================================
// DELETE — Full chain
// ============================================================================

describe('E2E: DELETE workflow', () => {
  let cleanup: () => void;

  afterEach(() => cleanup?.());

  test('full chain: deletes workflow via real service and API', async () => {
    const ctx = createE2ERuntime({
      fetchResponses: new Map([['/workflows/wf-001', () => jsonResponse(204)]]),
      useModelResponse: mock(() => Promise.resolve(createMatchResult())),
      workflows: [{ id: 'wf-001', name: 'Stripe Payments', active: false }],
    });
    cleanup = ctx.cleanup;

    const callback = ctx.createCallback();
    const result = await deleteWorkflowAction.handler(
      ctx.runtime,
      ctx.createMessage('Delete the Stripe workflow'),
      ctx.state,
      {},
      callback
    );

    expect(result?.success).toBe(true);

    const fetchCalls = ctx.fetchMock.mock.calls as [string, RequestInit][];
    const deleteCall = fetchCalls.find(
      ([url, opts]) => url.includes('/workflows/wf-001') && opts.method === 'DELETE'
    );
    expect(deleteCall).toBeDefined();
  });
});

// ============================================================================
// LIST WORKFLOWS — Full chain (service → API → fetch)
// ============================================================================

describe('E2E: LIST workflows', () => {
  let cleanup: () => void;

  afterEach(() => cleanup?.());

  test('full chain: lists workflows from real API client', async () => {
    const workflows = [
      createWorkflowResponse({
        id: 'wf-001',
        name: 'Stripe',
        active: true,
        tags: [USER_TAG],
      }),
      createWorkflowResponse({
        id: 'wf-002',
        name: 'Gmail',
        active: false,
        tags: [USER_TAG],
      }),
    ];

    const ctx = createE2ERuntime({
      fetchResponses: new Map([
        ['/tags', () => jsonResponse(200, { data: [USER_TAG] })],
        ['/workflows', () => jsonResponse(200, { data: workflows })],
      ]),
    });
    cleanup = ctx.cleanup;

    const callback = ctx.createCallback();
    const result = await listWorkflowsAction.handler(
      ctx.runtime,
      ctx.createMessage('Show my workflows'),
      ctx.state,
      {},
      callback
    );

    expect(result?.success).toBe(true);
    const callbackText = (callback as any).mock.calls[0][0].text;
    expect(callbackText).toContain('Stripe');
    expect(callbackText).toContain('Gmail');
  });
});

// ============================================================================
// GET EXECUTIONS — Full chain
// ============================================================================

describe('E2E: GET EXECUTIONS', () => {
  let cleanup: () => void;

  afterEach(() => cleanup?.());

  test('full chain: fetches execution history from real API', async () => {
    const executions = [
      createExecution({ id: 'exec-001', status: 'success' }),
      createExecution({ id: 'exec-002', status: 'error' }),
    ];

    const ctx = createE2ERuntime({
      fetchResponses: new Map([['/executions', () => jsonResponse(200, { data: executions })]]),
    });
    cleanup = ctx.cleanup;

    // getExecutionsAction reads state?.workflowId (top-level, not state.data)
    const state: State = { ...ctx.state, workflowId: 'wf-001' };

    const callback = ctx.createCallback();
    const result = await getExecutionsAction.handler(
      ctx.runtime,
      ctx.createMessage('Show executions for workflow wf-001'),
      state,
      {},
      callback
    );

    expect(result?.success).toBe(true);
    const callbackText = (callback as any).mock.calls.at(-1)[0].text;
    expect(callbackText).toContain('SUCCESS');
    expect(callbackText).toContain('ERROR');

    // Verify correct API call with workflowId filter
    const fetchCalls = ctx.fetchMock.mock.calls as [string, RequestInit][];
    const execCall = fetchCalls.find(([url]) => url.includes('/executions'));
    expect(execCall![0]).toContain('workflowId=wf-001');
  });
});

// ============================================================================
// PROVIDER → ACTION data flow (E2E)
// ============================================================================

describe('E2E: Provider → Action data flow', () => {
  let cleanup: () => void;

  afterEach(() => cleanup?.());

  test('activeWorkflowsProvider populates state consumed by activate action', async () => {
    const workflows = [
      createWorkflowResponse({
        id: 'wf-001',
        name: 'Stripe',
        active: false,
        tags: [USER_TAG],
      }),
    ];

    const ctx = createE2ERuntime({
      fetchResponses: new Map([
        ['/tags', () => jsonResponse(200, { data: [USER_TAG] })],
        ['/workflows', () => jsonResponse(200, { data: workflows })],
        [
          '/workflows/wf-001/activate',
          () => jsonResponse(200, createWorkflowResponse({ id: 'wf-001', active: true })),
        ],
      ]),
      useModelResponse: mock(() =>
        Promise.resolve(createMatchResult({ matchedWorkflowId: 'wf-001' }))
      ),
    });
    cleanup = ctx.cleanup;

    // Step 1: Provider fetches workflows from API
    const providerResult = await activeWorkflowsProvider.get(
      ctx.runtime,
      ctx.createMessage(''),
      ctx.state
    );

    expect(providerResult.data).toBeDefined();
    expect((providerResult.data as Record<string, unknown>).workflows).toHaveLength(1);

    // Step 2: Action uses provider data in state
    const stateWithWorkflows: State = {
      ...ctx.state,
      data: { ...ctx.state.data, ...providerResult.data },
    };

    const callback = ctx.createCallback();
    const result = await activateWorkflowAction.handler(
      ctx.runtime,
      ctx.createMessage('Activate Stripe'),
      stateWithWorkflows,
      {},
      callback
    );

    expect(result?.success).toBe(true);

    // Verify the full chain happened: tags API → workflows API → activate API
    const fetchCalls = ctx.fetchMock.mock.calls as [string, RequestInit][];
    expect(fetchCalls.length).toBeGreaterThanOrEqual(3);
  });
});
