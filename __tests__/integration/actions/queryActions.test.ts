import { describe, test, expect, mock } from 'bun:test';
import { listWorkflowsAction } from '../../../src/actions/listWorkflows';
import { getExecutionsAction } from '../../../src/actions/getExecutions';
import { executeWorkflowAction } from '../../../src/actions/executeWorkflow';
import { N8N_WORKFLOW_SERVICE_TYPE } from '../../../src/services/n8n-workflow-service';
import {
  createMockRuntime,
  createMockMessage,
  createMockState,
  createMockCallback,
} from '../../helpers/mockRuntime';
import { createMockService } from '../../helpers/mockService';
import { createWorkflowResponse, createExecution } from '../../fixtures/workflows';

// ============================================================================
// LIST_N8N_WORKFLOWS
// ============================================================================

describe('LIST_N8N_WORKFLOWS action', () => {
  test('lists workflows successfully', async () => {
    const mockService = createMockService();
    const runtime = createMockRuntime({
      services: { [N8N_WORKFLOW_SERVICE_TYPE]: mockService },
    });
    const callback = createMockCallback();

    const result = await listWorkflowsAction.handler(
      runtime,
      createMockMessage(),
      createMockState(),
      {},
      callback
    );

    expect(result!.success).toBe(true);
    const workflows = result!.data?.workflows as unknown[];
    expect(workflows).toHaveLength(2);
    expect(mockService.listWorkflows).toHaveBeenCalledWith('user-001');
  });

  test('handles empty workflow list', async () => {
    const mockService = createMockService({
      listWorkflows: mock(() => Promise.resolve([])),
    });
    const runtime = createMockRuntime({
      services: { [N8N_WORKFLOW_SERVICE_TYPE]: mockService },
    });
    const callback = createMockCallback();

    const result = await listWorkflowsAction.handler(
      runtime,
      createMockMessage(),
      createMockState(),
      {},
      callback
    );

    expect(result.success).toBe(true);
    const callText = (callback as any).mock.calls[0][0].text;
    expect(callText).toContain("don't have any");
  });

  test('formats workflow list with status', async () => {
    const mockService = createMockService({
      listWorkflows: mock(() =>
        Promise.resolve([
          createWorkflowResponse({
            id: 'wf-1',
            name: 'Active WF',
            active: true,
          }),
          createWorkflowResponse({
            id: 'wf-2',
            name: 'Inactive WF',
            active: false,
          }),
        ])
      ),
    });
    const runtime = createMockRuntime({
      services: { [N8N_WORKFLOW_SERVICE_TYPE]: mockService },
    });
    const callback = createMockCallback();

    await listWorkflowsAction.handler(
      runtime,
      createMockMessage(),
      createMockState(),
      {},
      callback
    );

    const callText = (callback as any).mock.calls[0][0].text;
    expect(callText).toContain('Active WF');
    expect(callText).toContain('Inactive WF');
    expect(callText).toContain('2 total');
  });
});

// ============================================================================
// GET_N8N_EXECUTIONS
// ============================================================================

describe('GET_N8N_EXECUTIONS action', () => {
  test('gets executions for workflow', async () => {
    const mockService = createMockService();
    const runtime = createMockRuntime({
      services: { [N8N_WORKFLOW_SERVICE_TYPE]: mockService },
    });
    const state = createMockState({ workflowId: 'wf-001' } as any);
    const callback = createMockCallback();

    const result = await getExecutionsAction.handler(
      runtime,
      createMockMessage(),
      state,
      {},
      callback
    );

    expect(result.success).toBe(true);
    expect(mockService.getWorkflowExecutions).toHaveBeenCalledWith('wf-001', 10);
  });

  test('fails when no workflow ID', async () => {
    const runtime = createMockRuntime({
      services: { [N8N_WORKFLOW_SERVICE_TYPE]: createMockService() },
    });
    const callback = createMockCallback();

    const result = await getExecutionsAction.handler(
      runtime,
      createMockMessage(),
      createMockState(),
      {},
      callback
    );

    expect(result.success).toBe(false);
    const callText = (callback as any).mock.calls[0][0].text;
    expect(callText).toContain('workflow ID');
  });

  test('handles empty execution list', async () => {
    const mockService = createMockService({
      getWorkflowExecutions: mock(() => Promise.resolve([])),
    });
    const runtime = createMockRuntime({
      services: { [N8N_WORKFLOW_SERVICE_TYPE]: mockService },
    });
    const state = createMockState({ workflowId: 'wf-001' } as any);
    const callback = createMockCallback();

    await getExecutionsAction.handler(runtime, createMockMessage(), state, {}, callback);

    const callText = (callback as any).mock.calls[0][0].text;
    expect(callText).toContain('No executions found');
  });

  test('formats execution status correctly', async () => {
    const mockService = createMockService({
      getWorkflowExecutions: mock(() =>
        Promise.resolve([
          createExecution({ status: 'success' }),
          createExecution({
            id: 'exec-002',
            status: 'error',
            data: { resultData: { error: { message: 'timeout' } } },
          }),
        ])
      ),
    });
    const runtime = createMockRuntime({
      services: { [N8N_WORKFLOW_SERVICE_TYPE]: mockService },
    });
    const state = createMockState({ workflowId: 'wf-001' } as any);
    const callback = createMockCallback();

    await getExecutionsAction.handler(runtime, createMockMessage(), state, {}, callback);

    const callText = (callback as any).mock.calls[0][0].text;
    expect(callText).toContain('SUCCESS');
    expect(callText).toContain('ERROR');
    expect(callText).toContain('timeout');
  });
});

// ============================================================================
// EXECUTE_N8N_WORKFLOW
// ============================================================================

describe('EXECUTE_N8N_WORKFLOW action', () => {
  test('executes workflow successfully', async () => {
    const mockService = createMockService();
    const runtime = createMockRuntime({
      services: { [N8N_WORKFLOW_SERVICE_TYPE]: mockService },
    });
    const state = createMockState({ workflowId: 'wf-001' } as any);
    const callback = createMockCallback();

    const result = await executeWorkflowAction.handler(
      runtime,
      createMockMessage(),
      state,
      {},
      callback
    );

    expect(result.success).toBe(true);
    expect(mockService.executeWorkflow).toHaveBeenCalledWith('wf-001');
  });

  test('fails when no workflow ID', async () => {
    const runtime = createMockRuntime({
      services: { [N8N_WORKFLOW_SERVICE_TYPE]: createMockService() },
    });
    const callback = createMockCallback();

    const result = await executeWorkflowAction.handler(
      runtime,
      createMockMessage(),
      createMockState(),
      {},
      callback
    );

    expect(result.success).toBe(false);
  });

  test('includes execution ID in response', async () => {
    const mockService = createMockService({
      executeWorkflow: mock(() =>
        Promise.resolve(createExecution({ id: 'exec-999', status: 'running' }))
      ),
    });
    const runtime = createMockRuntime({
      services: { [N8N_WORKFLOW_SERVICE_TYPE]: mockService },
    });
    const state = createMockState({ workflowId: 'wf-001' } as any);
    const callback = createMockCallback();

    await executeWorkflowAction.handler(runtime, createMockMessage(), state, {}, callback);

    const callText = (callback as any).mock.calls[0][0].text;
    expect(callText).toContain('exec-999');
  });
});
