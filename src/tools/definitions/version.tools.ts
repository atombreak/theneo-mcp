import { Tool } from "@modelcontextprotocol/sdk/types.js";

/**
 * Tool for listing project versions
 */
export const ListProjectVersionsTool: Tool = {
  name: "theneo_list_project_versions",
  description:
    "List all versions of a project. You can specify the project by ID or name, and workspace by ID, key, or name.",
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
 * Tool for creating a project version
 */
export const CreateProjectVersionTool: Tool = {
  name: "theneo_create_project_version",
  description:
    "Create a new version of a project. You can specify the project by ID or name, and workspace by ID, key, or name.",
  inputSchema: {
    type: "object",
    properties: {
      name: { type: "string", description: "Version name" },
      projectId: { type: "string", description: "Project ID (provide either projectId or projectName)" },
      projectName: { type: "string", description: "Project name (provide either projectId or projectName)" },
      workspaceId: { type: "string", description: "Workspace ID (optional, helps when using projectName)" },
      workspaceKey: { type: "string", description: "Workspace key/slug (optional, helps when using projectName)" },
      workspaceName: { type: "string", description: "Workspace name (optional, helps when using projectName)" },
      previousVersionId: { type: "string", description: "Previous version ID to copy from" },
      isNewVersion: { type: "boolean", description: "Whether this is a new version" },
      isEmpty: { type: "boolean", description: "Whether the version should be empty" },
      isDefault: { type: "boolean", description: "Whether this should be the default version" },
    },
    required: ["name"],
  },
};

/**
 * Tool for deleting a project version
 */
export const DeleteProjectVersionTool: Tool = {
  name: "theneo_delete_project_version",
  description: "Delete a specific version of a project. This action cannot be undone.",
  inputSchema: {
    type: "object",
    properties: {
      versionId: { type: "string", description: "Version ID to delete" },
    },
    required: ["versionId"],
  },
};

/**
 * Tool for adding subscriber to version
 */
export const AddSubscriberToProjectVersionTool: Tool = {
  name: "theneo_add_subscriber_to_version",
  description: "Add an email subscriber to receive updates for a specific project version.",
  inputSchema: {
    type: "object",
    properties: {
      email: { type: "string", description: "Email address to subscribe" },
      projectVersionId: { type: "string", description: "Project version ID" },
    },
    required: ["email", "projectVersionId"],
  },
};

