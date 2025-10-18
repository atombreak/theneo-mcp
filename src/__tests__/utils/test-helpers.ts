/**
 * Test helper utilities
 */

import { vi } from 'vitest';
import { TheneoService } from '../../services/theneo.service.js';

/**
 * Creates a mock Theneo SDK Result object
 */
export function createMockResult<T>(value: T, ok: boolean = true) {
  if (ok) {
    return {
      ok: true as const,
      value,
      unwrap: () => value,
      map: (fn: any) => createMockResult(fn(value)),
      chain: (fn: any) => fn(value),
    };
  } else {
    const error = value as any;
    return {
      ok: false as const,
      err: true as const,
      error,
      unwrap: () => {
        throw error;
      },
      map: (_ok: any, err?: any) => (err ? createMockResult(err(error), false) : createMockResult(error, false)),
      chain: (_ok: any, err: any) => err(error),
    };
  }
}

/**
 * Creates a mock TheneoService with stub methods
 */
export function mockTheneoService() {
  const mockClient = {
    listWorkspaces: vi.fn(),
    listProjects: vi.fn(),
    listProjectVersions: vi.fn(),
    createProject: vi.fn(),
    importProjectDocument: vi.fn(),
    publishProject: vi.fn(),
    getPreviewProjectLink: vi.fn(),
    waitForDescriptionGeneration: vi.fn(),
    getDescriptionGenerationStatus: vi.fn(),
    deleteProjectById: vi.fn(),
    createProjectVersion: vi.fn(),
    deleteProjectVersion: vi.fn(),
    addSubscriberToProjectVersion: vi.fn(),
    exportProject: vi.fn(),
  };

  const service = {
    getClient: vi.fn(() => mockClient),
    resolveWorkspaceId: vi.fn(),
    resolveProjectId: vi.fn(),
  } as unknown as TheneoService;

  return { service, mockClient };
}

/**
 * Creates a silent logger for tests
 */
export function mockLogger() {
  return {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  };
}

/**
 * Creates a mock MCP response
 */
export function createMCPResponse(text: string) {
  return {
    content: [
      {
        type: "text" as const,
        text,
      },
    ],
  };
}

/**
 * Creates a mock MCP error response
 */
export function createMCPErrorResponse(text: string) {
  return {
    content: [
      {
        type: "text" as const,
        text,
      },
    ],
    isError: true,
  };
}

