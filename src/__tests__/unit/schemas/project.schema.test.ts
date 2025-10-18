import { describe, it, expect } from 'vitest';
import {
  CreateProjectSchema,
  ImportProjectDocumentSchema,
  ExportProjectSchema,
} from '../../../schemas/project.schema.js';

describe('CreateProjectSchema', () => {
  it('should validate a valid project creation input', () => {
    const validInput = {
      name: 'Test API',
      workspaceId: 'ws_123',
      publish: false,
      isPublic: false,
    };

    const result = CreateProjectSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it('should validate with workspace name instead of ID', () => {
    const input = {
      name: 'Test API',
      workspaceName: 'My Workspace',
    };

    const result = CreateProjectSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it('should validate with description generation options', () => {
    const input = {
      name: 'Test API',
      descriptionGeneration: 'FILL',
    };

    const result = CreateProjectSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.descriptionGeneration).toBe('FILL');
    }
  });

  it('should reject invalid description generation option', () => {
    const input = {
      name: 'Test API',
      descriptionGeneration: 'INVALID',
    };

    const result = CreateProjectSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it('should fail without name', () => {
    const invalidInput = {
      workspaceId: 'ws_123',
    };

    const result = CreateProjectSchema.safeParse(invalidInput);
    expect(result.success).toBe(false);
  });

  it('should validate with file path', () => {
    const input = {
      name: 'Test API',
      file: './openapi.json',
    };

    const result = CreateProjectSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it('should validate with URL', () => {
    const input = {
      name: 'Test API',
      link: 'https://example.com/openapi.json',
    };

    const result = CreateProjectSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it('should reject invalid URL', () => {
    const input = {
      name: 'Test API',
      link: 'not-a-url',
    };

    const result = CreateProjectSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it('should validate with Postman data', () => {
    const input = {
      name: 'Test API',
      postmanApiKey: 'pmak_123',
      postmanCollectionIds: ['col_1', 'col_2'],
    };

    const result = CreateProjectSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it('should apply default values', () => {
    const input = {
      name: 'Test API',
    };

    const result = CreateProjectSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.publish).toBe(false);
      expect(result.data.isPublic).toBe(false);
    }
  });
});

describe('ImportProjectDocumentSchema', () => {
  it('should validate with projectId', () => {
    const input = {
      projectId: 'proj_123',
      file: './openapi.json',
    };

    const result = ImportProjectDocumentSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it('should validate with projectName', () => {
    const input = {
      projectName: 'Test API',
      file: './openapi.json',
    };

    const result = ImportProjectDocumentSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it('should validate with workspace name for project resolution', () => {
    const input = {
      projectName: 'Test API',
      workspaceName: 'My Workspace',
      file: './openapi.json',
    };

    const result = ImportProjectDocumentSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it('should fail without projectId or projectName', () => {
    const input = {
      file: './openapi.json',
    };

    const result = ImportProjectDocumentSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it('should validate import options', () => {
    const input = {
      projectId: 'proj_123',
      file: './openapi.json',
      importOption: 'MERGE',
    };

    const result = ImportProjectDocumentSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it('should reject invalid import option', () => {
    const input = {
      projectId: 'proj_123',
      file: './openapi.json',
      importOption: 'INVALID',
    };

    const result = ImportProjectDocumentSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it('should have publish default to true', () => {
    const input = {
      projectId: 'proj_123',
      file: './openapi.json',
    };

    const result = ImportProjectDocumentSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.publish).toBe(true);
    }
  });
});

describe('ExportProjectSchema', () => {
  it('should validate with projectId', () => {
    const input = {
      projectId: 'proj_123',
    };

    const result = ExportProjectSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it('should validate with projectName and workspaceName', () => {
    const input = {
      projectName: 'Test API',
      workspaceName: 'My Workspace',
    };

    const result = ExportProjectSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it('should validate with all optional parameters', () => {
    const input = {
      projectId: 'proj_123',
      versionId: 'ver_123',
      dir: './exports',
      noGeneration: true,
      shouldGetPublicViewData: false,
      openapi: true,
    };

    const result = ExportProjectSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it('should allow empty object (all fields optional)', () => {
    const input = {};

    const result = ExportProjectSchema.safeParse(input);
    expect(result.success).toBe(true);
  });
});

