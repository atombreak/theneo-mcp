#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { loadConfig, getMissingApiKeyHelp } from "./loadConfig.js";
import { logger } from "./utils/logger.js";
import { TheneoService } from "./services/theneo.service.js";
import { ALL_TOOLS } from "./tools/definitions/index.js";
import {
  // Workspace handlers
  handleListWorkspaces,
  handleListProjects,
  // Project handlers
  handleCreateProject,
  handleImportProjectDocument,
  handlePublishProject,
  handlePreviewLink,
  handleWaitForGeneration,
  handleGetGenerationStatus,
  handleDeleteProject,
  handleExportProject,
  // Version handlers
  handleListProjectVersions,
  handleCreateProjectVersion,
  handleDeleteProjectVersion,
  handleAddSubscriberToVersion,
  // Integration handlers
  handleListPostmanCollections,
} from "./tools/handlers/index.js";

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

  // Create Theneo service instance
  const theneoService = new TheneoService(config.apiKey, config.baseApiUrl, config.baseAppUrl);

  // Register tool list handler
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: ALL_TOOLS,
    };
  });

  // Register tool call handler
  server.setRequestHandler(CallToolRequestSchema, async (request: any) => {
    const { name, arguments: args } = request.params;

    try {
      switch (name) {
        // Workspace tools
        case "theneo_list_workspaces":
          return await handleListWorkspaces(theneoService);

        case "theneo_list_projects":
          return await handleListProjects(theneoService, args);

        // Project tools
        case "theneo_create_project":
          return await handleCreateProject(theneoService, args);

        case "theneo_import_project_document":
          return await handleImportProjectDocument(theneoService, args);

        case "theneo_publish_project":
          return await handlePublishProject(theneoService, args);

        case "theneo_preview_link":
          return await handlePreviewLink(theneoService, args);

        case "theneo_wait_for_generation":
          return await handleWaitForGeneration(theneoService, args);

        case "theneo_get_generation_status":
          return await handleGetGenerationStatus(theneoService, args);

        case "theneo_delete_project":
          return await handleDeleteProject(theneoService, args);

        case "theneo_export_project":
          return await handleExportProject(theneoService, args);

        // Version tools
        case "theneo_list_project_versions":
          return await handleListProjectVersions(theneoService, args);

        case "theneo_create_project_version":
          return await handleCreateProjectVersion(theneoService, args);

        case "theneo_delete_project_version":
          return await handleDeleteProjectVersion(theneoService, args);

        case "theneo_add_subscriber_to_version":
          return await handleAddSubscriberToVersion(theneoService, args);

        // Integration tools
        case "theneo_list_postman_collections":
          return await handleListPostmanCollections(args);

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
