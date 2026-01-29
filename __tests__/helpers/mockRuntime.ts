import { mock } from "bun:test";
import type { IAgentRuntime, Memory, State } from "@elizaos/core";

type MockFn = ReturnType<typeof mock>;

export interface MockRuntimeOptions {
  agentId?: string;
  services?: Record<string, unknown>;
  settings?: Record<string, unknown>;
  useModel?: MockFn;
}

export function createMockRuntime(
  options: MockRuntimeOptions = {},
): IAgentRuntime {
  const services = options.services || {};
  const settings = options.settings || {};

  return {
    agentId: options.agentId || "agent-001",
    getService: mock((type: string) => services[type] || null),
    getSetting: mock((key: string) => settings[key] ?? null),
    useModel: options.useModel || mock(() => Promise.resolve({})),
  } as unknown as IAgentRuntime;
}

export function createMockMessage(overrides?: Partial<Memory>): Memory {
  return {
    id: "msg-001",
    entityId: "user-001",
    agentId: "agent-001",
    roomId: "room-001",
    content: { text: "Test message" },
    createdAt: Date.now(),
    ...overrides,
  } as Memory;
}

export function createMockState(overrides?: Partial<State>): State {
  return {
    data: {},
    values: {},
    text: "",
    ...overrides,
  } as State;
}

export function createMockCallback() {
  return mock((_response: { text: string }) => Promise.resolve([]));
}
