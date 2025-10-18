#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";
import { Theneo, TheneoOptions, DescriptionGenerationType } from "@theneo/sdk";
import { z } from "zod";
import { loadConfig, getMissingApiKeyHelp } from "./loadConfig.js";
import { logger } from "./utils/logger.js";

/**
 * Create a new Theneo client with loaded configuration
 */
function createTheneoClient(apiKey?: string, baseApiUrl?: string, baseAppUrl?: string): Theneo {
  const opts: TheneoOptions = {
    apiKey,
    baseApiUrl,
    baseAppUrl,
  };
  return new Theneo(opts);
}

/**
 * Helper function to resolve workspace name to workspace ID
 */
async function resolveWorkspaceId(
  theneo: Theneo,
  workspaceId?: string,
  workspaceKey?: string,
  workspaceName?: string
): Promise<string | undefined> {
  // If workspaceId is provided, use it directly
  if (workspaceId) {
    return workspaceId;
  }

  // If workspaceKey is provided, use it (it's already a valid identifier)
  if (workspaceKey) {
    // workspaceKey is a slug that can be used directly in most cases
    // but we need to resolve it to an ID
    try {
      const result = await theneo.listWorkspaces();
      if (!result.ok) {
        logger.error("Failed to list workspaces for key resolution", { error: result.error });
        return undefined;
      }

      const workspaces = result.value;
      const matchingWorkspace = workspaces.find(
        (w: any) => w.key?.toLowerCase() === workspaceKey.toLowerCase()
      );

      if (matchingWorkspace) {
        logger.debug("Resolved workspace key to ID", {
          workspaceKey,
          workspaceId: (matchingWorkspace as any).id,
        });
        return (matchingWorkspace as any).id;
      }

      logger.warn("No workspace found with key", { workspaceKey });
      return undefined;
    } catch (error) {
      logger.error("Error resolving workspace key", { error, workspaceKey });
      return undefined;
    }
  }

  // If workspaceName is provided, look it up
  if (workspaceName) {
    try {
      const result = await theneo.listWorkspaces();
      if (!result.ok) {
        logger.error("Failed to list workspaces for name resolution", { error: result.error });
        return undefined;
      }

      const workspaces = result.value;
      const matchingWorkspace = workspaces.find(
        (w: any) => w.name?.toLowerCase() === workspaceName.toLowerCase()
      );

      if (matchingWorkspace) {
        logger.debug("Resolved workspace name to ID", {
          workspaceName,
          workspaceId: (matchingWorkspace as any).id,
        });
        return (matchingWorkspace as any).id;
      }

      logger.warn("No workspace found with name", { workspaceName });
      return undefined;
    } catch (error) {
      logger.error("Error resolving workspace name", { error, workspaceName });
      return undefined;
    }
  }

  return undefined;
}

/**
 * Helper function to resolve project name to project ID
 */
async function resolveProjectId(
  theneo: Theneo,
  projectId?: string,
  projectName?: string,
  workspaceId?: string
): Promise<string | null> {
  // If projectId is provided, use it directly
  if (projectId) {
    return projectId;
  }

  // If projectName is provided, look it up
  if (projectName) {
    try {
      const result = await theneo.listProjects();
      if (!result.ok) {
        logger.error("Failed to list projects for name resolution", { error: result.error });
        return null;
      }

      const projects = result.value;
      // Filter by workspace if provided
      const filteredProjects = workspaceId
        ? projects.filter((p: any) => p.workspaceId === workspaceId)
        : projects;

      const matchingProject = filteredProjects.find(
        (p: any) => p.name.toLowerCase() === projectName.toLowerCase()
      );

      if (matchingProject) {
        logger.debug("Resolved project name to ID", {
          projectName,
          projectId: matchingProject.id,
        });
        return matchingProject.id;
      }

      logger.warn("No project found with name", { projectName, workspaceId });
      return null;
    } catch (error) {
      logger.error("Error resolving project name", { error, projectName });
      return null;
    }
  }

  return null;
}

/**
 * Tool schemas and handlers
 */

// List Workspaces Tool
const ListWorkspacesTool: Tool = {
  name: "theneo_list_workspaces",
  description: "List all workspaces available to the authenticated user",
  inputSchema: {
    type: "object",
    properties: {},
  },
};

// List Projects Tool
const ListProjectsTool: Tool = {
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

// Create Project Tool
const CreateProjectSchema = z.object({
  name: z.string().describe("Project name"),
  workspaceKey: z.string().optional().describe("Workspace key (slug)"),
  workspaceId: z.string().optional().describe("Workspace ID"),
  workspaceName: z.string().optional().describe("Workspace name (alternative to workspaceId/workspaceKey)"),
  publish: z.boolean().optional().default(false).describe("Publish immediately after creation"),
  isPublic: z.boolean().optional().default(false).describe("Make the project public"),
  descriptionGeneration: z
    .enum(["FILL", "OVERWRITE", "NO_GENERATION"])
    .optional()
    .describe("AI description generation mode"),
  file: z.string().optional().describe("Path to OpenAPI/Swagger file"),
  link: z.string().url().optional().describe("URL to OpenAPI/Swagger spec"),
  text: z.string().optional().describe("Raw OpenAPI/Swagger spec as text"),
  postmanApiKey: z.string().optional().describe("Postman API key"),
  postmanCollectionIds: z.array(z.string()).optional().describe("Postman collection IDs"),
});

const CreateProjectTool: Tool = {
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

// Import Project Document Tool
const ImportProjectDocumentSchema = z.object({
  projectId: z.string().optional().describe("Project ID (provide either projectId or projectName)"),
  projectName: z.string().optional().describe("Project name (provide either projectId or projectName)"),
  workspaceId: z.string().optional().describe("Workspace ID (optional, helps when using projectName)"),
  workspaceKey: z.string().optional().describe("Workspace key (optional, helps when using projectName)"),
  workspaceName: z.string().optional().describe("Workspace name (optional, helps when using projectName)"),
  publish: z.boolean().default(true).describe("Publish after import"),
  importOption: z
    .enum(["ENDPOINTS_ONLY", "OVERWRITE", "MERGE"])
    .optional()
    .describe("How to handle conflicts"),
  file: z.string().optional().describe("Path to OpenAPI/Swagger file"),
  link: z.string().url().optional().describe("URL to OpenAPI/Swagger spec"),
  text: z.string().optional().describe("Raw OpenAPI/Swagger spec as text"),
  postmanApiKey: z.string().optional().describe("Postman API key"),
  postmanCollectionIds: z.array(z.string()).optional().describe("Postman collection IDs"),
}).refine((data) => data.projectId || data.projectName, {
  message: "Either projectId or projectName must be provided",
});

const ImportProjectDocumentTool: Tool = {
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

// Publish Project Tool
const PublishProjectTool: Tool = {
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

// Preview Link Tool
const PreviewLinkTool: Tool = {
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

// Wait for Generation Tool
const WaitForGenerationTool: Tool = {
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

// Get Description Generation Status Tool
const GetDescriptionGenerationStatusTool: Tool = {
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

// Delete Project Tool
const DeleteProjectTool: Tool = {
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

// List Project Versions Tool
const ListProjectVersionsTool: Tool = {
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

// Create Project Version Tool
const CreateProjectVersionSchema = z.object({
  name: z.string().describe("Version name"),
  projectId: z.string().optional().describe("Project ID (provide either projectId or projectName)"),
  projectName: z.string().optional().describe("Project name (provide either projectId or projectName)"),
  workspaceId: z.string().optional().describe("Workspace ID (optional, helps when using projectName)"),
  workspaceKey: z.string().optional().describe("Workspace key/slug (optional, helps when using projectName)"),
  workspaceName: z.string().optional().describe("Workspace name (optional, helps when using projectName)"),
  previousVersionId: z.string().optional().describe("Previous version ID to copy from"),
  isNewVersion: z.boolean().optional().describe("Whether this is a new version"),
  isEmpty: z.boolean().optional().describe("Whether the version should be empty"),
  isDefault: z.boolean().optional().describe("Whether this should be the default version"),
});

const CreateProjectVersionTool: Tool = {
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

// Delete Project Version Tool
const DeleteProjectVersionTool: Tool = {
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

// Add Subscriber to Project Version Tool
const AddSubscriberToProjectVersionSchema = z.object({
  email: z.string().email().describe("Email address to subscribe"),
  projectVersionId: z.string().describe("Project version ID"),
});

const AddSubscriberToProjectVersionTool: Tool = {
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

// Export Project Tool
const ExportProjectSchema = z.object({
  projectId: z.string().optional().describe("Project ID (provide either projectId or projectName)"),
  projectName: z.string().optional().describe("Project name (provide either projectId or projectName)"),
  workspaceId: z.string().optional().describe("Workspace ID (optional, helps when using projectName)"),
  workspaceKey: z.string().optional().describe("Workspace key/slug (optional, helps when using projectName)"),
  workspaceName: z.string().optional().describe("Workspace name (optional, helps when using projectName)"),
  versionId: z.string().optional().describe("Version ID to export"),
  dir: z.string().optional().describe("Directory to save export"),
  noGeneration: z.boolean().optional().describe("Skip AI generation"),
  shouldGetPublicViewData: z.boolean().optional().describe("Get public view data"),
  openapi: z.boolean().optional().describe("Export as OpenAPI format"),
});

const ExportProjectTool: Tool = {
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

// List Postman Collections Tool
const ListPostmanCollectionsTool: Tool = {
  name: "theneo_list_postman_collections",
  description: "List all Postman collections accessible with the provided Postman API key.",
  inputSchema: {
    type: "object",
    properties: {
      postmanApiKey: { type: "string", description: "Postman API key" },
    },
    required: ["postmanApiKey"],
  },
};

/**
 * Main server implementation
 */
async function main() {
  logger.info("Starting Theneo MCP server...");

  // Load configuration
  let config: Awaited<ReturnType<typeof loadConfig>>;
  try {
    config = await loadConfig();
  } catch (error) {
    logger.error("Failed to load configuration", { error });
    process.exit(1);
  }

  // Check if API key is available
  if (!config.apiKey) {
    logger.error("API key not configured");
    console.error(getMissingApiKeyHelp());
    process.exit(1);
  }

  // Create MCP server
  const server = new Server(
    {
      name: "theneo-mcp",
      version: "0.1.0",
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  // Register tool list handler
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: [
        ListWorkspacesTool,
        ListProjectsTool,
        CreateProjectTool,
        ImportProjectDocumentTool,
        PublishProjectTool,
        PreviewLinkTool,
        WaitForGenerationTool,
        GetDescriptionGenerationStatusTool,
        DeleteProjectTool,
        ListProjectVersionsTool,
        CreateProjectVersionTool,
        DeleteProjectVersionTool,
        AddSubscriberToProjectVersionTool,
        ExportProjectTool,
        ListPostmanCollectionsTool,
      ],
    };
  });

  // Register tool call handler
  server.setRequestHandler(CallToolRequestSchema, async (request: any) => {
    const { name, arguments: args } = request.params;

    try {
      const theneo = createTheneoClient(config.apiKey, config.baseApiUrl, config.baseAppUrl);

      switch (name) {
        case "theneo_list_workspaces": {
          logger.info("Listing workspaces");
          const result = await theneo.listWorkspaces();

          if (!result.ok) {
            const error = result.error;
            logger.error("Failed to list workspaces", { error });
            return {
              content: [
                {
                  type: "text",
                  text: `Error: ${error?.message || "Failed to list workspaces"}`,
                },
              ],
            };
          }

          const workspaces = result.value;
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(workspaces, null, 2),
              },
            ],
          };
        }

        case "theneo_list_projects": {
          const { workspaceId: inputWorkspaceId, workspaceKey, workspaceName } = args as {
            workspaceId?: string;
            workspaceKey?: string;
            workspaceName?: string;
          };

          // Resolve workspace ID if name or key provided
          const workspaceId = await resolveWorkspaceId(
            theneo,
            inputWorkspaceId,
            workspaceKey,
            workspaceName
          );

          if ((workspaceKey || workspaceName) && !workspaceId) {
            return {
              content: [
                {
                  type: "text",
                  text: workspaceName
                    ? `Error: Workspace '${workspaceName}' not found`
                    : `Error: Workspace '${workspaceKey}' not found`,
                },
              ],
            };
          }

          logger.info("Listing projects", { workspaceId, workspaceKey, workspaceName });
          
          const result = await theneo.listProjects();

          if (!result.ok) {
            const error = result.error;
            logger.error("Failed to list projects", { error });
            return {
              content: [
                {
                  type: "text",
                  text: `Error: ${error?.message || "Failed to list projects"}`,
                },
              ],
            };
          }

          let projects = result.value;
          
          // Filter by workspace if requested
          if (workspaceId) {
            projects = projects.filter((p: any) => p.workspaceId === workspaceId);
          }

          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(projects, null, 2),
              },
            ],
          };
        }

        case "theneo_create_project": {
          const input = CreateProjectSchema.parse(args);
          
          // Resolve workspace ID if name is provided
          const resolvedWorkspaceId = await resolveWorkspaceId(
            theneo,
            input.workspaceId,
            input.workspaceKey,
            input.workspaceName
          );

          if (input.workspaceName && !resolvedWorkspaceId) {
            return {
              content: [
                {
                  type: "text",
                  text: `Error: Workspace '${input.workspaceName}' not found`,
                },
              ],
            };
          }

          logger.info("Creating project", { name: input.name, workspace: input.workspaceName || input.workspaceKey || input.workspaceId });

          // Validate that at most one data source is provided
          const sources = [
            input.file,
            input.link,
            input.text,
            input.postmanApiKey && input.postmanCollectionIds?.length,
          ].filter(Boolean);

          if (sources.length > 1) {
            return {
              content: [
                {
                  type: "text",
                  text: "Error: Specify at most one data source (file, link, text, or postman)",
                },
              ],
            };
          }

          // Build data object
          const data: any = {};
          if (input.file) data.file = input.file;
          if (input.link) data.link = input.link;
          if (input.text) data.text = input.text;
          if (input.postmanApiKey && input.postmanCollectionIds?.length) {
            data.postman = {
              apiKey: input.postmanApiKey,
              collectionId: input.postmanCollectionIds,
            };
          }

          const result = await theneo.createProject({
            name: input.name,
            workspace: resolvedWorkspaceId
              ? { id: resolvedWorkspaceId }
              : input.workspaceKey
                ? { key: input.workspaceKey }
                : undefined,
            publish: input.publish ?? false,
            isPublic: input.isPublic ?? false,
            data: Object.keys(data).length > 0 ? data : undefined,
            descriptionGenerationType: input.descriptionGeneration as
              | DescriptionGenerationType
              | undefined,
            progressUpdateHandler: (progress: number) => {
              logger.info(`AI generation progress: ${progress}%`);
            },
          });

          if (!result.ok) {
            const error = result.error;
            logger.error("Failed to create project", { error });
            return {
              content: [
                {
                  type: "text",
                  text: `Error: ${error?.message || "Failed to create project"}`,
                },
              ],
            };
          }

          const project = result.value;
          logger.info("Project created successfully", { project });
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(project, null, 2),
              },
            ],
          };
        }

        case "theneo_import_project_document": {
          const input = ImportProjectDocumentSchema.parse(args);
          
          // Resolve workspace ID if name or key provided
          const workspaceId = await resolveWorkspaceId(
            theneo,
            input.workspaceId,
            input.workspaceKey,
            input.workspaceName
          );

          if (input.workspaceName && !workspaceId) {
            return {
              content: [
                {
                  type: "text",
                  text: `Error: Workspace '${input.workspaceName}' not found`,
                },
              ],
            };
          }
          
          // Resolve project ID from name if needed
          const projectId = await resolveProjectId(
            theneo,
            input.projectId,
            input.projectName,
            workspaceId
          );

          if (!projectId) {
            return {
              content: [
                {
                  type: "text",
                  text: input.projectName
                    ? `Error: Project '${input.projectName}' not found`
                    : "Error: projectId or projectName is required",
                },
              ],
            };
          }

          logger.info("Importing document", { projectId, projectName: input.projectName, workspace: input.workspaceName || input.workspaceKey });

          // Validate exactly one data source
          const sources = [
            input.file,
            input.link,
            input.text,
            input.postmanApiKey && input.postmanCollectionIds?.length,
          ].filter(Boolean);

          if (sources.length === 0) {
            return {
              content: [
                {
                  type: "text",
                  text: "Error: Specify exactly one data source (file, link, text, or postman)",
                },
              ],
            };
          }

          if (sources.length > 1) {
            return {
              content: [
                {
                  type: "text",
                  text: "Error: Specify exactly one data source (file, link, text, or postman)",
                },
              ],
            };
          }

          // Build data object
          const data: any = {};
          if (input.file) data.file = input.file;
          if (input.link) data.link = input.link;
          if (input.text) data.text = input.text;
          if (input.postmanApiKey && input.postmanCollectionIds?.length) {
            data.postman = {
              apiKey: input.postmanApiKey,
              collectionId: input.postmanCollectionIds,
            };
          }

          const result = await theneo.importProjectDocument({
            projectId,
            publish: input.publish,
            data,
            importOption: input.importOption as any,
          });

          if (!result.ok) {
            const error = result.error;
            logger.error("Failed to import document", { error });
            return {
              content: [
                {
                  type: "text",
                  text: `Error: ${error?.message || "Failed to import document"}`,
                },
              ],
            };
          }

          const response = result.value;
          logger.info("Document imported successfully");
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(response, null, 2),
              },
            ],
          };
        }

        case "theneo_publish_project": {
          const { projectId: inputProjectId, projectName, workspaceId: inputWorkspaceId, workspaceKey, workspaceName, versionId } = args as {
            projectId?: string;
            projectName?: string;
            workspaceId?: string;
            workspaceKey?: string;
            workspaceName?: string;
            versionId?: string;
          };

          // Resolve workspace ID if name or key provided
          const workspaceId = await resolveWorkspaceId(
            theneo,
            inputWorkspaceId,
            workspaceKey,
            workspaceName
          );

          if (workspaceName && !workspaceId) {
            return {
              content: [
                {
                  type: "text",
                  text: `Error: Workspace '${workspaceName}' not found`,
                },
              ],
            };
          }

          // Resolve project ID from name if needed
          const projectId = await resolveProjectId(theneo, inputProjectId, projectName, workspaceId);

          if (!projectId) {
            return {
              content: [
                {
                  type: "text",
                  text: projectName
                    ? `Error: Project '${projectName}' not found`
                    : "Error: projectId or projectName is required",
                },
              ],
            };
          }

          logger.info("Publishing project", { projectId, projectName, versionId, workspace: workspaceName || workspaceKey });

          const result = await theneo.publishProject(projectId, versionId);

          if (!result.ok) {
            const error = result.error;
            logger.error("Failed to publish project", { error });
            return {
              content: [
                {
                  type: "text",
                  text: `Error: ${error?.message || "Failed to publish project"}`,
                },
              ],
            };
          }

          const response = result.value;
          logger.info("Project published successfully");
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(response, null, 2),
              },
            ],
          };
        }

        case "theneo_preview_link": {
          const { projectId: inputProjectId, projectName, workspaceId: inputWorkspaceId, workspaceKey, workspaceName } = args as {
            projectId?: string;
            projectName?: string;
            workspaceId?: string;
            workspaceKey?: string;
            workspaceName?: string;
          };

          // Resolve workspace ID if name or key provided
          const workspaceId = await resolveWorkspaceId(
            theneo,
            inputWorkspaceId,
            workspaceKey,
            workspaceName
          );

          if (workspaceName && !workspaceId) {
            return {
              content: [
                {
                  type: "text",
                  text: `Error: Workspace '${workspaceName}' not found`,
                },
              ],
            };
          }

          // Resolve project ID from name if needed
          const projectId = await resolveProjectId(theneo, inputProjectId, projectName, workspaceId);

          if (!projectId) {
            return {
              content: [
                {
                  type: "text",
                  text: projectName
                    ? `Error: Project '${projectName}' not found`
                    : "Error: projectId or projectName is required",
                },
              ],
            };
          }

          logger.info("Getting preview link", { projectId, projectName, workspace: workspaceName || workspaceKey });

          const link = theneo.getPreviewProjectLink(projectId);
          return {
            content: [
              {
                type: "text",
                text: link,
              },
            ],
          };
        }

        case "theneo_wait_for_generation": {
          const {
            projectId: inputProjectId,
            projectName,
            workspaceId: inputWorkspaceId,
            workspaceKey,
            workspaceName,
            retryTimeMs = 2500,
            maxWaitTimeMs = 120000,
          } = args as {
            projectId?: string;
            projectName?: string;
            workspaceId?: string;
            workspaceKey?: string;
            workspaceName?: string;
            retryTimeMs?: number;
            maxWaitTimeMs?: number;
          };

          // Resolve workspace ID if name or key provided
          const workspaceId = await resolveWorkspaceId(
            theneo,
            inputWorkspaceId,
            workspaceKey,
            workspaceName
          );

          if (workspaceName && !workspaceId) {
            return {
              content: [
                {
                  type: "text",
                  text: `Error: Workspace '${workspaceName}' not found`,
                },
              ],
            };
          }

          // Resolve project ID from name if needed
          const projectId = await resolveProjectId(theneo, inputProjectId, projectName, workspaceId);

          if (!projectId) {
            return {
              content: [
                {
                  type: "text",
                  text: projectName
                    ? `Error: Project '${projectName}' not found`
                    : "Error: projectId or projectName is required",
                },
              ],
            };
          }

          logger.info("Waiting for generation", { projectId, projectName, workspace: workspaceName || workspaceKey });

          const result = await theneo.waitForDescriptionGeneration(
            projectId,
            (progress: number) => {
              logger.info(`Generation progress: ${progress}%`);
            },
            retryTimeMs,
            maxWaitTimeMs
          );

          if (!result.ok) {
            const error = result.error;
            logger.error("Generation failed or timed out", { error });
            return {
              content: [
                {
                  type: "text",
                  text: `Error: ${error?.message || "Generation failed or timed out"}`,
                },
              ],
            };
          }

          logger.info("Generation completed successfully");
          return {
            content: [
              {
                type: "text",
                text: "AI description generation completed successfully",
              },
            ],
          };
        }

        case "theneo_get_generation_status": {
          const { projectId: inputProjectId, projectName, workspaceId: inputWorkspaceId, workspaceKey, workspaceName } = args as {
            projectId?: string;
            projectName?: string;
            workspaceId?: string;
            workspaceKey?: string;
            workspaceName?: string;
          };

          // Resolve workspace ID if name or key provided
          const workspaceId = await resolveWorkspaceId(
            theneo,
            inputWorkspaceId,
            workspaceKey,
            workspaceName
          );

          if (workspaceName && !workspaceId) {
            return {
              content: [
                {
                  type: "text",
                  text: `Error: Workspace '${workspaceName}' not found`,
                },
              ],
            };
          }

          // Resolve project ID from name if needed
          const projectId = await resolveProjectId(theneo, inputProjectId, projectName, workspaceId);

          if (!projectId) {
            return {
              content: [
                {
                  type: "text",
                  text: projectName
                    ? `Error: Project '${projectName}' not found`
                    : "Error: projectId or projectName is required",
                },
              ],
            };
          }

          logger.info("Getting generation status", { projectId, projectName, workspace: workspaceName || workspaceKey });

          const result = await theneo.getDescriptionGenerationStatus(projectId);

          if (!result.ok) {
            const error = result.error;
            logger.error("Failed to get generation status", { error });
            return {
              content: [
                {
                  type: "text",
                  text: `Error: ${error?.message || "Failed to get generation status"}`,
                },
              ],
            };
          }

          const status = result.value;
          logger.info("Generation status retrieved successfully");
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(status, null, 2),
              },
            ],
          };
        }

        case "theneo_delete_project": {
          const { projectId: inputProjectId, projectName, workspaceId: inputWorkspaceId, workspaceKey, workspaceName } = args as {
            projectId?: string;
            projectName?: string;
            workspaceId?: string;
            workspaceKey?: string;
            workspaceName?: string;
          };

          // Resolve workspace ID if name or key provided
          const workspaceId = await resolveWorkspaceId(
            theneo,
            inputWorkspaceId,
            workspaceKey,
            workspaceName
          );

          if (workspaceName && !workspaceId) {
            return {
              content: [
                {
                  type: "text",
                  text: `Error: Workspace '${workspaceName}' not found`,
                },
              ],
            };
          }

          // Resolve project ID from name if needed
          const projectId = await resolveProjectId(theneo, inputProjectId, projectName, workspaceId);

          if (!projectId) {
            return {
              content: [
                {
                  type: "text",
                  text: projectName
                    ? `Error: Project '${projectName}' not found`
                    : "Error: projectId or projectName is required",
                },
              ],
            };
          }

          logger.info("Deleting project", { projectId, projectName, workspace: workspaceName || workspaceKey });

          const result = await theneo.deleteProjectById(projectId);

          if (!result.ok) {
            const error = result.error;
            logger.error("Failed to delete project", { error });
            return {
              content: [
                {
                  type: "text",
                  text: `Error: ${error?.message || "Failed to delete project"}`,
                },
              ],
            };
          }

          logger.info("Project deleted successfully");
          return {
            content: [
              {
                type: "text",
                text: `Project '${projectName || projectId}' deleted successfully`,
              },
            ],
          };
        }

        case "theneo_list_project_versions": {
          const { projectId: inputProjectId, projectName, workspaceId: inputWorkspaceId, workspaceKey, workspaceName } = args as {
            projectId?: string;
            projectName?: string;
            workspaceId?: string;
            workspaceKey?: string;
            workspaceName?: string;
          };

          // Resolve workspace ID if name or key provided
          const workspaceId = await resolveWorkspaceId(
            theneo,
            inputWorkspaceId,
            workspaceKey,
            workspaceName
          );

          if (workspaceName && !workspaceId) {
            return {
              content: [
                {
                  type: "text",
                  text: `Error: Workspace '${workspaceName}' not found`,
                },
              ],
            };
          }

          // Resolve project ID from name if needed
          const projectId = await resolveProjectId(theneo, inputProjectId, projectName, workspaceId);

          if (!projectId) {
            return {
              content: [
                {
                  type: "text",
                  text: projectName
                    ? `Error: Project '${projectName}' not found`
                    : "Error: projectId or projectName is required",
                },
              ],
            };
          }

          logger.info("Listing project versions", { projectId, projectName, workspace: workspaceName || workspaceKey });

          const result = await theneo.listProjectVersions(projectId);

          if (!result.ok) {
            const error = result.error;
            logger.error("Failed to list project versions", { error });
            return {
              content: [
                {
                  type: "text",
                  text: `Error: ${error?.message || "Failed to list project versions"}`,
                },
              ],
            };
          }

          const versions = result.value;
          logger.info("Project versions listed successfully");
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(versions, null, 2),
              },
            ],
          };
        }

        case "theneo_create_project_version": {
          const input = CreateProjectVersionSchema.parse(args);

          // Resolve workspace ID if name or key provided
          const workspaceId = await resolveWorkspaceId(
            theneo,
            input.workspaceId,
            input.workspaceKey,
            input.workspaceName
          );

          if (input.workspaceName && !workspaceId) {
            return {
              content: [
                {
                  type: "text",
                  text: `Error: Workspace '${input.workspaceName}' not found`,
                },
              ],
            };
          }

          // Resolve project ID from name if needed
          const projectId = await resolveProjectId(theneo, input.projectId, input.projectName, workspaceId);

          if (!projectId) {
            return {
              content: [
                {
                  type: "text",
                  text: input.projectName
                    ? `Error: Project '${input.projectName}' not found`
                    : "Error: projectId or projectName is required",
                },
              ],
            };
          }

          logger.info("Creating project version", { projectId, projectName: input.projectName, versionName: input.name });

          const result = await theneo.createProjectVersion({
            name: input.name,
            projectId,
            previousVersionId: input.previousVersionId,
            isNewVersion: input.isNewVersion,
            isEmpty: input.isEmpty,
            isDefault: input.isDefault,
          });

          if (!result.ok) {
            const error = result.error;
            logger.error("Failed to create project version", { error });
            return {
              content: [
                {
                  type: "text",
                  text: `Error: ${error?.message || "Failed to create project version"}`,
                },
              ],
            };
          }

          const version = result.value;
          logger.info("Project version created successfully");
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(version, null, 2),
              },
            ],
          };
        }

        case "theneo_delete_project_version": {
          const { versionId } = args as { versionId: string };

          if (!versionId) {
            return {
              content: [
                {
                  type: "text",
                  text: "Error: versionId is required",
                },
              ],
            };
          }

          logger.info("Deleting project version", { versionId });

          const result = await theneo.deleteProjectVersion(versionId);

          if (!result.ok) {
            const error = result.error;
            logger.error("Failed to delete project version", { error });
            return {
              content: [
                {
                  type: "text",
                  text: `Error: ${error?.message || "Failed to delete project version"}`,
                },
              ],
            };
          }

          logger.info("Project version deleted successfully");
          return {
            content: [
              {
                type: "text",
                text: `Project version '${versionId}' deleted successfully`,
              },
            ],
          };
        }

        case "theneo_add_subscriber_to_version": {
          const input = AddSubscriberToProjectVersionSchema.parse(args);

          logger.info("Adding subscriber to project version", { email: input.email, versionId: input.projectVersionId });

          const result = await theneo.addSubscriberToProjectVersion({
            email: input.email,
            projectVersionId: input.projectVersionId,
          });

          if (!result.ok) {
            const error = result.error;
            logger.error("Failed to add subscriber", { error });
            return {
              content: [
                {
                  type: "text",
                  text: `Error: ${error?.message || "Failed to add subscriber"}`,
                },
              ],
            };
          }

          logger.info("Subscriber added successfully");
          return {
            content: [
              {
                type: "text",
                text: `Subscriber '${input.email}' added successfully to version '${input.projectVersionId}'`,
              },
            ],
          };
        }

        case "theneo_export_project": {
          const input = ExportProjectSchema.parse(args);

          // Resolve workspace ID if name or key provided
          const workspaceId = await resolveWorkspaceId(
            theneo,
            input.workspaceId,
            input.workspaceKey,
            input.workspaceName
          );

          if (input.workspaceName && !workspaceId) {
            return {
              content: [
                {
                  type: "text",
                  text: `Error: Workspace '${input.workspaceName}' not found`,
                },
              ],
            };
          }

          // Resolve project ID from name if needed
          const projectId = await resolveProjectId(theneo, input.projectId, input.projectName, workspaceId);

          if (!projectId) {
            return {
              content: [
                {
                  type: "text",
                  text: input.projectName
                    ? `Error: Project '${input.projectName}' not found`
                    : "Error: projectId or projectName is required",
                },
              ],
            };
          }

          logger.info("Exporting project", { projectId, projectName: input.projectName, workspace: input.workspaceName || input.workspaceKey });

          const result = await theneo.exportProject({
            projectId,
            versionId: input.versionId,
            dir: input.dir,
            noGeneration: input.noGeneration,
            shouldGetPublicViewData: input.shouldGetPublicViewData,
            openapi: input.openapi,
          });

          if (!result.ok) {
            const error = result.error;
            logger.error("Failed to export project", { error });
            return {
              content: [
                {
                  type: "text",
                  text: `Error: ${error?.message || "Failed to export project"}`,
                },
              ],
            };
          }

          const exportData = result.value;
          logger.info("Project exported successfully");
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(exportData, null, 2),
              },
            ],
          };
        }

        case "theneo_list_postman_collections": {
          const { postmanApiKey } = args as { postmanApiKey: string };

          if (!postmanApiKey) {
            return {
              content: [
                {
                  type: "text",
                  text: "Error: postmanApiKey is required",
                },
              ],
            };
          }

          logger.info("Listing Postman collections");

          const result = await Theneo.listPostmanCollections(postmanApiKey);

          if (!result.ok) {
            const error = result.error;
            logger.error("Failed to list Postman collections", { error });
            return {
              content: [
                {
                  type: "text",
                  text: `Error: ${error?.message || "Failed to list Postman collections"}`,
                },
              ],
            };
          }

          const collections = result.value;
          logger.info("Postman collections listed successfully");
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(collections, null, 2),
              },
            ],
          };
        }

        default:
          return {
            content: [
              {
                type: "text",
                text: `Unknown tool: ${name}`,
              },
            ],
            isError: true,
          };
      }
    } catch (error) {
      logger.error("Tool execution error", { tool: name, error });
      return {
        content: [
          {
            type: "text",
            text: `Error: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  });

  // Connect to transport
  const transport = new StdioServerTransport();
  await server.connect(transport);

  logger.info("Theneo MCP server started successfully");
}

// Run server
main().catch((error) => {
  logger.error("Fatal error", { error });
  process.exit(1);
});

