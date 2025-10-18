import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  handleListProjectVersions,
  handleCreateProjectVersion,
  handleDeleteProjectVersion,
} from '../../../tools/handlers/version.handlers.js';
import { TheneoService } from '../../../services/theneo.service.js';
import { mockProjectVersions } from '../../fixtures/mock-responses.js';
import { createMockResult } from '../../utils/test-helpers.js';

vi.mock('../../../utils/logger.js', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe('Version Handlers', () => {
  let mockService: TheneoService;
  let mockTheneo: any;

  beforeEach(() => {
    mockService = new TheneoService('test-api-key');
    mockTheneo = mockService.getClient();
    vi.clearAllMocks();
  });

  describe('handleListProjectVersions', () => {
    it('should list versions by project ID', async () => {
      mockTheneo.listProjectVersions = vi.fn().mockResolvedValue(
        createMockResult(mockProjectVersions)
      );

      const result = await handleListProjectVersions(mockService, {
        projectId: 'proj_abc123',
      });

      const text = result.content[0].text;
      expect(text).toContain('v1.0');
      expect(text).toContain('v2.0');
    });
  });

  describe('handleCreateProjectVersion', () => {
    it('should create version with project ID', async () => {
      const mockCreatedVersion = {
        id: 'ver_new',
        name: 'v3.0',
        slug: 'v3-0',
        isDefaultVersion: false,
      };

      mockTheneo.createProjectVersion = vi.fn().mockResolvedValue(
        createMockResult(mockCreatedVersion)
      );

      const result = await handleCreateProjectVersion(mockService, {
        name: 'v3.0',
        projectId: 'proj_abc123',
      });

      const text = result.content[0].text;
      expect(text).toContain('ver_new');
      expect(text).toContain('v3.0');
    });
  });

  describe('handleDeleteProjectVersion', () => {
    it('should delete version by ID', async () => {
      mockTheneo.deleteProjectVersion = vi.fn().mockResolvedValue(
        createMockResult({ success: true })
      );

      const result = await handleDeleteProjectVersion(mockService, {
        versionId: 'ver_v2',
      });

      expect(result.content[0].text).toContain('successfully deleted');
    });
  });
});
