import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handleListWorkspaces, handleListProjects } from '../../../tools/handlers/workspace.handlers.js';
import { TheneoService } from '../../../services/theneo.service.js';
import { mockWorkspaces, mockProjects } from '../../fixtures/mock-responses.js';
import { createMockResult } from '../../utils/test-helpers.js';

vi.mock('../../../utils/logger.js', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe('Workspace Handlers', () => {
  let mockService: TheneoService;
  let mockTheneo: any;

  beforeEach(() => {
    mockService = new TheneoService('test-api-key');
    mockTheneo = mockService.getClient();
    vi.clearAllMocks();
  });

  describe('handleListWorkspaces', () => {
    it('should list workspaces successfully', async () => {
      mockTheneo.listWorkspaces = vi.fn().mockResolvedValue(
        createMockResult(mockWorkspaces)
      );

      const result = await handleListWorkspaces(mockService);

      expect(result.content[0].type).toBe('text');
      const text = result.content[0].text;
      expect(text).toContain('Test Workspace');
      expect(text).toContain('Production');
      expect(text).toContain('ws_test123');
      expect(text).toContain('ws_prod456');
    });

    it('should handle SDK errors', async () => {
      const error = new Error('Failed to fetch workspaces');
      mockTheneo.listWorkspaces = vi.fn().mockResolvedValue(
        createMockResult(error, false)
      );

      const result = await handleListWorkspaces(mockService);

      expect(result.content[0].text).toContain('Error');
    });

    it('should return formatted JSON response', async () => {
      mockTheneo.listWorkspaces = vi.fn().mockResolvedValue(
        createMockResult(mockWorkspaces)
      );

      const result = await handleListWorkspaces(mockService);
      const text = result.content[0].text;

      // Should be valid JSON
      expect(() => JSON.parse(text)).not.toThrow();
    });
  });

  describe('handleListProjects', () => {
    it('should list all projects when no workspace specified', async () => {
      mockTheneo.listProjects = vi.fn().mockResolvedValue(
        createMockResult(mockProjects)
      );

      const result = await handleListProjects(mockService, {});

      expect(result.content[0].type).toBe('text');
      const text = result.content[0].text;
      expect(text).toContain('Payment API');
      expect(text).toContain('User API');
    });

    it('should filter by workspaceId', async () => {
      mockTheneo.listProjects = vi.fn().mockResolvedValue(
        createMockResult(mockProjects)
      );

      const result = await handleListProjects(mockService, {
        workspaceId: 'ws_test123',
      });

      expect(result.content[0].text).toContain('Payment API');
    });

    it('should resolve workspace key to ID', async () => {
      mockTheneo.listWorkspaces = vi.fn().mockResolvedValue(
        createMockResult(mockWorkspaces)
      );
      mockTheneo.listProjects = vi.fn().mockResolvedValue(
        createMockResult(mockProjects)
      );

      vi.spyOn(mockService, 'resolveWorkspaceId').mockResolvedValue('ws_test123');

      await handleListProjects(mockService, {
        workspaceKey: 'test-workspace',
      });

      expect(mockService.resolveWorkspaceId).toHaveBeenCalledWith(
        undefined,
        'test-workspace',
        undefined
      );
    });

    it('should resolve workspace name to ID', async () => {
      mockTheneo.listWorkspaces = vi.fn().mockResolvedValue(
        createMockResult(mockWorkspaces)
      );
      mockTheneo.listProjects = vi.fn().mockResolvedValue(
        createMockResult(mockProjects)
      );

      vi.spyOn(mockService, 'resolveWorkspaceId').mockResolvedValue('ws_test123');

      await handleListProjects(mockService, {
        workspaceName: 'Test Workspace',
      });

      expect(mockService.resolveWorkspaceId).toHaveBeenCalledWith(
        undefined,
        undefined,
        'Test Workspace'
      );
    });

    it('should return error if workspace not found', async () => {
      mockTheneo.listWorkspaces = vi.fn().mockResolvedValue(
        createMockResult(mockWorkspaces)
      );

      vi.spyOn(mockService, 'resolveWorkspaceId').mockResolvedValue(undefined);

      const result = await handleListProjects(mockService, {
        workspaceName: 'Nonexistent',
      });

      expect(result.content[0].text).toContain('not found');
    });

    it('should handle SDK errors', async () => {
      const error = new Error('Failed to fetch projects');
      mockTheneo.listProjects = vi.fn().mockResolvedValue(
        createMockResult(error, false)
      );

      const result = await handleListProjects(mockService, {});

      expect(result.content[0].text).toContain('Error');
    });

    it('should return formatted JSON response', async () => {
      mockTheneo.listProjects = vi.fn().mockResolvedValue(
        createMockResult(mockProjects)
      );

      const result = await handleListProjects(mockService, {});
      const text = result.content[0].text;

      expect(() => JSON.parse(text)).not.toThrow();
    });
  });
});

