import { mock } from 'bun:test';
import type { N8nWorkflowService } from '../../src/services/n8n-workflow-service';
import { createWorkflowResponse, createExecution, createCredential } from '../fixtures/workflows';

export function createMockService(
  overrides?: Partial<Record<keyof N8nWorkflowService, unknown>>
): N8nWorkflowService {
  return {
    serviceType: 'n8n_workflow',
    createWorkflowFromPrompt: mock(() =>
      Promise.resolve({
        id: 'wf-001',
        name: 'Generated Workflow',
        active: false,
        nodeCount: 3,
        missingCredentials: [],
      })
    ),
    listWorkflows: mock(() =>
      Promise.resolve([
        createWorkflowResponse({
          id: 'wf-001',
          name: 'Workflow A',
          active: true,
        }),
        createWorkflowResponse({
          id: 'wf-002',
          name: 'Workflow B',
          active: false,
        }),
      ])
    ),
    activateWorkflow: mock(() => Promise.resolve()),
    deactivateWorkflow: mock(() => Promise.resolve()),
    deleteWorkflow: mock(() => Promise.resolve()),
    executeWorkflow: mock(() => Promise.resolve(createExecution())),
    getWorkflowExecutions: mock(() =>
      Promise.resolve([
        createExecution({ id: 'exec-001', status: 'success' }),
        createExecution({ id: 'exec-002', status: 'error' }),
      ])
    ),
    getExecutionDetail: mock(() => Promise.resolve(createExecution())),
    ...overrides,
  } as unknown as N8nWorkflowService;
}
