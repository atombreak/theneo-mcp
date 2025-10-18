import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  handleCreateProject,
  handlePublishProject,
  handleDeleteProject,
} from '../../../tools/handlers/project.handlers.js';
import { TheneoService } from '../../../services/theneo.service.js';
import {
  mockCreateProjectResponse,
  mockPublishResponse,
} from '../../fixtures/mock-responses.js';
import { createMockResult } from '../../utils/test-helpers.js';

vi.mock('../../../utils/logger.js', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe('Project Handlers', () => {
  let mockService: TheneoService;
  let mockTheneo: any;

  beforeEach(() => {
    mockService = new TheneoService('test-api-key');
    mockTheneo = mockService.getClient();
    vi.clearAllMocks();
  });

  describe('handleCreateProject', () => {
    it('should create project with workspace ID', async () => {
      mockTheneo.createProject = vi.fn().mockResolvedValue(
        createMockResult(mockCreateProjectResponse)
      );

      const result = await handleCreateProject(mockService, {
        name: 'New API',
        workspaceId: 'ws_test123',
      });

      expect(result.content[0].text).toContain('proj_new123');
    });
  });

  describe('handlePublishProject', () => {
    it('should publish project by ID', async () => {
      mockTheneo.publishProject = vi.fn().mockResolvedValue(
        createMockResult(mockPublishResponse)
      );

      const result = await handlePublishProject(mockService, {
        projectId: 'proj_abc123',
      });

      expect(result.content[0].text).toContain('payment-api');
    });
  });

  describe('handleDeleteProject', () => {
    it('should delete project by ID', async () => {
      mockTheneo.deleteProjectById = vi.fn().mockResolvedValue(
        createMockResult({ success: true })
      );

      const result = await handleDeleteProject(mockService, {
        projectId: 'proj_abc123',
      });

      expect(result.content[0].text).toContain('successfully deleted');
    });
  });
});
