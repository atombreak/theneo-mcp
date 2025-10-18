import { Tool } from "@modelcontextprotocol/sdk/types.js";

/**
 * Tool for listing workspaces
 */
export const ListWorkspacesTool: Tool = {
  name: "theneo_list_workspaces",
  description: "List all workspaces available to the authenticated user",
  inputSchema: {
    type: "object",
    properties: {},
  },
};

/**
 * Tool for listing projects
 */
export const ListProjectsTool: Tool = {
  name: "theneo_list_projects",
  description: "List all projects in a workspace or across all workspaces. You can specify the workspace by ID, key (slug), or name. Returns project names, IDs, and details.",
  inputSchema: {
    type: "object",
    properties: {
      workspaceId: {
        type: "string",
        description: "Optional workspace ID to filter projects",
      },
      workspaceKey: {
        type: "string",
        description: "Optional workspace key (slug) to filter projects",
      },
      workspaceName: {
        type: "string",
        description: "Optional workspace name to filter projects",
      },
    },
  },
};

