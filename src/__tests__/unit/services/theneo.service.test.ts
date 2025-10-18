import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TheneoService } from '../../../services/theneo.service.js';
import { mockWorkspaces, mockProjects } from '../../fixtures/mock-responses.js';
import { createMockResult } from '../../utils/test-helpers.js';

// Mock the logger
vi.mock('../../../utils/logger.js', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe('TheneoService', () => {
  let service: TheneoService;
  let mockTheneo: any;

  beforeEach(() => {
    service = new TheneoService('test-api-key');
    mockTheneo = service.getClient();
    vi.clearAllMocks();
  });

  describe('resolveWorkspaceId', () => {
    it('should return workspaceId if provided directly', async () => {
      const result = await service.resolveWorkspaceId('ws_direct');
      expect(result).toBe('ws_direct');
    });

    it('should resolve workspace key to ID', async () => {
      mockTheneo.listWorkspaces = vi.fn().mockResolvedValue(
        createMockResult(mockWorkspaces)
      );

      const result = await service.resolveWorkspaceId(
        undefined,
        'test-workspace'
      );
      expect(result).toBe('ws_test123');
    });

    it('should resolve workspace name to ID (case-insensitive)', async () => {
      mockTheneo.listWorkspaces = vi.fn().mockResolvedValue(
        createMockResult(mockWorkspaces)
      );

      const result = await service.resolveWorkspaceId(
        undefined,
        undefined,
        'test workspace'
      );
      expect(result).toBe('ws_test123');
    });

    it('should return undefined if workspace key not found', async () => {
      mockTheneo.listWorkspaces = vi.fn().mockResolvedValue(
        createMockResult(mockWorkspaces)
      );

      const result = await service.resolveWorkspaceId(
        undefined,
        'nonexistent'
      );
      expect(result).toBeUndefined();
    });

    it('should return undefined if workspace name not found', async () => {
      mockTheneo.listWorkspaces = vi.fn().mockResolvedValue(
        createMockResult(mockWorkspaces)
      );

      const result = await service.resolveWorkspaceId(
        undefined,
        undefined,
        'Nonexistent Workspace'
      );
      expect(result).toBeUndefined();
    });

    it('should handle SDK errors gracefully', async () => {
      const error = new Error('SDK Error');
      mockTheneo.listWorkspaces = vi.fn().mockResolvedValue(
        createMockResult(error, false)
      );

      const result = await service.resolveWorkspaceId(
        undefined,
        'test-workspace'
      );
      expect(result).toBeUndefined();
    });

    it('should return undefined if no parameters provided', async () => {
      const result = await service.resolveWorkspaceId();
      expect(result).toBeUndefined();
    });

    it('should prioritize workspaceId over key and name', async () => {
      const result = await service.resolveWorkspaceId(
        'ws_priority',
        'key',
        'name'
      );
      expect(result).toBe('ws_priority');
      // Should not call listWorkspaces
      expect(mockTheneo.listWorkspaces).not.toHaveBeenCalled();
    });
  });

  describe('resolveProjectId', () => {
    it('should return projectId if provided directly', async () => {
      const result = await service.resolveProjectId('proj_direct');
      expect(result).toBe('proj_direct');
    });

    it('should resolve project name to ID', async () => {
      mockTheneo.listProjects = vi.fn().mockResolvedValue(
        createMockResult(mockProjects)
      );

      const result = await service.resolveProjectId(
        undefined,
        'Payment API'
      );
      expect(result).toBe('proj_abc123');
    });

    it('should resolve project name case-insensitively', async () => {
      mockTheneo.listProjects = vi.fn().mockResolvedValue(
        createMockResult(mockProjects)
      );

      const result = await service.resolveProjectId(
        undefined,
        'payment api'
      );
      expect(result).toBe('proj_abc123');
    });

    it('should filter by workspaceId when provided', async () => {
      mockTheneo.listProjects = vi.fn().mockResolvedValue(
        createMockResult(mockProjects)
      );

      const result = await service.resolveProjectId(
        undefined,
        'Payment API',
        'ws_test123'
      );
      expect(result).toBe('proj_abc123');
    });

    it('should return null if project not found', async () => {
      mockTheneo.listProjects = vi.fn().mockResolvedValue(
        createMockResult(mockProjects)
      );

      const result = await service.resolveProjectId(
        undefined,
        'Nonexistent Project'
      );
      expect(result).toBeNull();
    });

    it('should return null if project not in specified workspace', async () => {
      mockTheneo.listProjects = vi.fn().mockResolvedValue(
        createMockResult(mockProjects)
      );

      const result = await service.resolveProjectId(
        undefined,
        'Payment API',
        'ws_different'
      );
      expect(result).toBeNull();
    });

    it('should handle SDK errors gracefully', async () => {
      const error = new Error('SDK Error');
      mockTheneo.listProjects = vi.fn().mockResolvedValue(
        createMockResult(error, false)
      );

      const result = await service.resolveProjectId(
        undefined,
        'Payment API'
      );
      expect(result).toBeNull();
    });

    it('should return null if no parameters provided', async () => {
      const result = await service.resolveProjectId();
      expect(result).toBeNull();
    });
  });

  describe('getClient', () => {
    it('should return the Theneo client instance', () => {
      const client = service.getClient();
      expect(client).toBeDefined();
      expect(client.listWorkspaces).toBeDefined();
      expect(client.listProjects).toBeDefined();
    });
  });
});

