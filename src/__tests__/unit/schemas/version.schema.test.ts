import { describe, it, expect } from 'vitest';
import {
  CreateProjectVersionSchema,
  AddSubscriberToProjectVersionSchema,
} from '../../../schemas/version.schema.js';

describe('CreateProjectVersionSchema', () => {
  it('should validate with name and projectId', () => {
    const input = {
      name: 'v2.0',
      projectId: 'proj_123',
    };

    const result = CreateProjectVersionSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it('should validate with name and projectName', () => {
    const input = {
      name: 'v2.0',
      projectName: 'Test API',
    };

    const result = CreateProjectVersionSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it('should validate with workspace context', () => {
    const input = {
      name: 'v2.0',
      projectName: 'Test API',
      workspaceName: 'My Workspace',
    };

    const result = CreateProjectVersionSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it('should fail without name', () => {
    const input = {
      projectId: 'proj_123',
    };

    const result = CreateProjectVersionSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it('should validate with optional version properties', () => {
    const input = {
      name: 'v2.0',
      projectId: 'proj_123',
      previousVersionId: 'ver_1',
      isNewVersion: true,
      isEmpty: false,
      isDefault: true,
    };

    const result = CreateProjectVersionSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.isDefault).toBe(true);
      expect(result.data.isEmpty).toBe(false);
    }
  });

  it('should validate with all workspace identifier types', () => {
    const inputWithId = {
      name: 'v2.0',
      projectName: 'Test API',
      workspaceId: 'ws_123',
    };

    const inputWithKey = {
      name: 'v2.0',
      projectName: 'Test API',
      workspaceKey: 'my-workspace',
    };

    const inputWithName = {
      name: 'v2.0',
      projectName: 'Test API',
      workspaceName: 'My Workspace',
    };

    expect(CreateProjectVersionSchema.safeParse(inputWithId).success).toBe(true);
    expect(CreateProjectVersionSchema.safeParse(inputWithKey).success).toBe(true);
    expect(CreateProjectVersionSchema.safeParse(inputWithName).success).toBe(true);
  });
});

describe('AddSubscriberToProjectVersionSchema', () => {
  it('should validate with valid email and versionId', () => {
    const input = {
      email: 'user@example.com',
      projectVersionId: 'ver_123',
    };

    const result = AddSubscriberToProjectVersionSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it('should fail with invalid email', () => {
    const input = {
      email: 'not-an-email',
      projectVersionId: 'ver_123',
    };

    const result = AddSubscriberToProjectVersionSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it('should fail without email', () => {
    const input = {
      projectVersionId: 'ver_123',
    };

    const result = AddSubscriberToProjectVersionSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it('should fail without projectVersionId', () => {
    const input = {
      email: 'user@example.com',
    };

    const result = AddSubscriberToProjectVersionSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it('should validate various email formats', () => {
    const emails = [
      'user@example.com',
      'first.last@example.co.uk',
      'user+tag@example.com',
      'user_name@example-domain.com',
    ];

    emails.forEach((email) => {
      const input = {
        email,
        projectVersionId: 'ver_123',
      };
      const result = AddSubscriberToProjectVersionSchema.safeParse(input);
      expect(result.success).toBe(true);
    });
  });
});

