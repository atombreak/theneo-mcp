import { Tool } from "@modelcontextprotocol/sdk/types.js";

/**
 * Tool for creating a project
 */
export const CreateProjectTool: Tool = {
  name: "theneo_create_project",
  description:
    "Create a new Theneo project with optional API documentation import. You can specify the workspace by ID, key (slug), or name. Supports file, URL, raw text, or Postman collections. Can enable AI-powered description generation.",
  inputSchema: {
    type: "object",
    properties: {
      name: { type: "string", description: "Project name" },
      workspaceKey: { type: "string", description: "Workspace key (slug)" },
      workspaceId: { type: "string", description: "Workspace ID" },
      workspaceName: { type: "string", description: "Workspace name (alternative to workspaceId/workspaceKey)" },
      publish: { type: "boolean", description: "Publish immediately", default: false },
      isPublic: { type: "boolean", description: "Make project public", default: false },
      descriptionGeneration: {
        type: "string",
        enum: ["FILL", "OVERWRITE", "NO_GENERATION"],
        description: "AI description generation mode",
      },
      file: { type: "string", description: "Path to API spec file" },
      link: { type: "string", description: "URL to API spec" },
      text: { type: "string", description: "Raw API spec content" },
      postmanApiKey: { type: "string", description: "Postman API key" },
      postmanCollectionIds: {
        type: "array",
        items: { type: "string" },
        description: "Postman collection IDs",
      },
    },
    required: ["name"],
  },
};

/**
 * Tool for importing project documents
 */
export const ImportProjectDocumentTool: Tool = {
  name: "theneo_import_project_document",
  description:
    "Import or update API documentation in an existing project. You can specify the project by ID or by name, and workspace by ID, key, or name. Supports merge, overwrite, or endpoints-only modes.",
  inputSchema: {
    type: "object",
    properties: {
      projectId: { type: "string", description: "Project ID (provide either projectId or projectName)" },
      projectName: { type: "string", description: "Project name (provide either projectId or projectName)" },
      workspaceId: { type: "string", description: "Workspace ID (optional, helps when using projectName)" },
      workspaceKey: { type: "string", description: "Workspace key/slug (optional, helps when using projectName)" },
      workspaceName: { type: "string", description: "Workspace name (optional, helps when using projectName)" },
      publish: { type: "boolean", description: "Publish after import", default: true },
      importOption: {
        type: "string",
        enum: ["ENDPOINTS_ONLY", "OVERWRITE", "MERGE"],
        description: "Import strategy",
      },
      file: { type: "string", description: "Path to API spec file" },
      link: { type: "string", description: "URL to API spec" },
      text: { type: "string", description: "Raw API spec content" },
      postmanApiKey: { type: "string", description: "Postman API key" },
      postmanCollectionIds: {
        type: "array",
        items: { type: "string" },
        description: "Postman collection IDs",
      },
    },
  },
};

/**
 * Tool for publishing a project
 */
export const PublishProjectTool: Tool = {
  name: "theneo_publish_project",
  description: "Publish a project to make it available at its public URL. You can specify the project by ID or name, and workspace by ID, key, or name. Optionally specify a version to publish.",
  inputSchema: {
    type: "object",
    properties: {
      projectId: { type: "string", description: "Project ID (provide either projectId or projectName)" },
      projectName: { type: "string", description: "Project name (provide either projectId or projectName)" },
      workspaceId: { type: "string", description: "Workspace ID (optional, helps when using projectName)" },
      workspaceKey: { type: "string", description: "Workspace key/slug (optional, helps when using projectName)" },
      workspaceName: { type: "string", description: "Workspace name (optional, helps when using projectName)" },
      versionId: { type: "string", description: "Version ID to publish (optional, publishes default version if not specified)" },
    },
  },
};

/**
 * Tool for getting preview link
 */
export const PreviewLinkTool: Tool = {
  name: "theneo_preview_link",
  description: "Get the editor preview URL for a project. You can specify the project by ID or name, and workspace by ID, key, or name.",
  inputSchema: {
    type: "object",
    properties: {
      projectId: { type: "string", description: "Project ID (provide either projectId or projectName)" },
      projectName: { type: "string", description: "Project name (provide either projectId or projectName)" },
      workspaceId: { type: "string", description: "Workspace ID (optional, helps when using projectName)" },
      workspaceKey: { type: "string", description: "Workspace key/slug (optional, helps when using projectName)" },
      workspaceName: { type: "string", description: "Workspace name (optional, helps when using projectName)" },
    },
  },
};

/**
 * Tool for waiting for AI generation
 */
export const WaitForGenerationTool: Tool = {
  name: "theneo_wait_for_generation",
  description:
    "Wait for AI description generation to complete. Useful after creating a project with AI generation enabled. You can specify the project by ID or name, and workspace by ID, key, or name.",
  inputSchema: {
    type: "object",
    properties: {
      projectId: { type: "string", description: "Project ID (provide either projectId or projectName)" },
      projectName: { type: "string", description: "Project name (provide either projectId or projectName)" },
      workspaceId: { type: "string", description: "Workspace ID (optional, helps when using projectName)" },
      workspaceKey: { type: "string", description: "Workspace key/slug (optional, helps when using projectName)" },
      workspaceName: { type: "string", description: "Workspace name (optional, helps when using projectName)" },
      retryTimeMs: { type: "number", description: "Polling interval in ms", default: 2500 },
      maxWaitTimeMs: { type: "number", description: "Maximum wait time in ms", default: 120000 },
    },
  },
};

/**
 * Tool for getting generation status
 */
export const GetDescriptionGenerationStatusTool: Tool = {
  name: "theneo_get_generation_status",
  description:
    "Get the current status of AI description generation for a project. Returns the generation progress percentage and status. You can specify the project by ID or name, and workspace by ID, key, or name.",
  inputSchema: {
    type: "object",
    properties: {
      projectId: { type: "string", description: "Project ID (provide either projectId or projectName)" },
      projectName: { type: "string", description: "Project name (provide either projectId or projectName)" },
      workspaceId: { type: "string", description: "Workspace ID (optional, helps when using projectName)" },
      workspaceKey: { type: "string", description: "Workspace key/slug (optional, helps when using projectName)" },
      workspaceName: { type: "string", description: "Workspace name (optional, helps when using projectName)" },
    },
  },
};

/**
 * Tool for deleting a project
 */
export const DeleteProjectTool: Tool = {
  name: "theneo_delete_project",
  description:
    "Delete a project permanently. You can specify the project by ID or name, and workspace by ID, key, or name. This action cannot be undone.",
  inputSchema: {
    type: "object",
    properties: {
      projectId: { type: "string", description: "Project ID (provide either projectId or projectName)" },
      projectName: { type: "string", description: "Project name (provide either projectId or projectName)" },
      workspaceId: { type: "string", description: "Workspace ID (optional, helps when using projectName)" },
      workspaceKey: { type: "string", description: "Workspace key/slug (optional, helps when using projectName)" },
      workspaceName: { type: "string", description: "Workspace name (optional, helps when using projectName)" },
    },
  },
};

/**
 * Tool for exporting a project
 */
export const ExportProjectTool: Tool = {
  name: "theneo_export_project",
  description:
    "Export a project's documentation. You can specify the project by ID or name, and workspace by ID, key, or name. Returns the exported content.",
  inputSchema: {
    type: "object",
    properties: {
      projectId: { type: "string", description: "Project ID (provide either projectId or projectName)" },
      projectName: { type: "string", description: "Project name (provide either projectId or projectName)" },
      workspaceId: { type: "string", description: "Workspace ID (optional, helps when using projectName)" },
      workspaceKey: { type: "string", description: "Workspace key/slug (optional, helps when using projectName)" },
      workspaceName: { type: "string", description: "Workspace name (optional, helps when using projectName)" },
      versionId: { type: "string", description: "Version ID to export" },
      dir: { type: "string", description: "Directory to save export" },
      noGeneration: { type: "boolean", description: "Skip AI generation" },
      shouldGetPublicViewData: { type: "boolean", description: "Get public view data" },
      openapi: { type: "boolean", description: "Export as OpenAPI format" },
    },
  },
};

