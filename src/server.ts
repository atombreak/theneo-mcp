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

// Create Project Tool
const CreateProjectSchema = z.object({
  name: z.string().describe("Project name"),
  workspaceKey: z.string().optional().describe("Workspace key (slug)"),
  workspaceId: z.string().optional().describe("Workspace ID"),
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
    "Create a new Theneo project with optional API documentation import. Supports file, URL, raw text, or Postman collections. Can enable AI-powered description generation.",
  inputSchema: {
    type: "object",
    properties: {
      name: { type: "string", description: "Project name" },
      workspaceKey: { type: "string", description: "Workspace key (slug)" },
      workspaceId: { type: "string", description: "Workspace ID" },
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
  projectId: z.string().describe("Project ID"),
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
});

const ImportProjectDocumentTool: Tool = {
  name: "theneo_import_project_document",
  description:
    "Import or update API documentation in an existing project. Supports merge, overwrite, or endpoints-only modes.",
  inputSchema: {
    type: "object",
    properties: {
      projectId: { type: "string", description: "Project ID" },
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
    required: ["projectId"],
  },
};

// Publish Project Tool
const PublishProjectTool: Tool = {
  name: "theneo_publish_project",
  description: "Publish a project to make it available at its public URL",
  inputSchema: {
    type: "object",
    properties: {
      projectId: { type: "string", description: "Project ID" },
    },
    required: ["projectId"],
  },
};

// Preview Link Tool
const PreviewLinkTool: Tool = {
  name: "theneo_preview_link",
  description: "Get the editor preview URL for a project",
  inputSchema: {
    type: "object",
    properties: {
      projectId: { type: "string", description: "Project ID" },
    },
    required: ["projectId"],
  },
};

// Wait for Generation Tool
const WaitForGenerationTool: Tool = {
  name: "theneo_wait_for_generation",
  description:
    "Wait for AI description generation to complete. Useful after creating a project with AI generation enabled.",
  inputSchema: {
    type: "object",
    properties: {
      projectId: { type: "string", description: "Project ID" },
      retryTimeMs: { type: "number", description: "Polling interval in ms", default: 2500 },
      maxWaitTimeMs: { type: "number", description: "Maximum wait time in ms", default: 120000 },
    },
    required: ["projectId"],
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
        CreateProjectTool,
        ImportProjectDocumentTool,
        PublishProjectTool,
        PreviewLinkTool,
        WaitForGenerationTool,
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

        case "theneo_create_project": {
          const input = CreateProjectSchema.parse(args);
          logger.info("Creating project", { name: input.name });

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
            workspace: input.workspaceId
              ? { id: input.workspaceId }
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
          logger.info("Importing document", { projectId: input.projectId });

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
            projectId: input.projectId,
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
          const { projectId } = args as { projectId: string };
          logger.info("Publishing project", { projectId });

          const result = await theneo.publishProject(projectId);

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
          const { projectId } = args as { projectId: string };
          logger.info("Getting preview link", { projectId });

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
            projectId,
            retryTimeMs = 2500,
            maxWaitTimeMs = 120000,
          } = args as {
            projectId: string;
            retryTimeMs?: number;
            maxWaitTimeMs?: number;
          };

          logger.info("Waiting for generation", { projectId });

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

