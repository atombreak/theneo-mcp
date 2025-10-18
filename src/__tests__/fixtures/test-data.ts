/**
 * Test data for validation tests
 */

export const validCreateProjectInput = {
  name: "Test API",
  workspaceId: "ws_test123",
  publish: false,
  isPublic: false,
  descriptionGeneration: "FILL" as const,
};

export const validImportProjectInput = {
  projectId: "proj_abc123",
  publish: true,
  importOption: "MERGE" as const,
  file: "./test.json",
};

export const validCreateVersionInput = {
  name: "v2.0",
  projectId: "proj_abc123",
  isDefault: false,
};

export const invalidCreateProjectInput = {
  // Missing required 'name' field
  workspaceId: "ws_test123",
};

export const invalidImportProjectInput = {
  // Missing both projectId and projectName
  publish: true,
};

