/**
 * Central export for all tool definitions
 */

export * from "./workspace.tools.js";
export * from "./project.tools.js";
export * from "./version.tools.js";
export * from "./integration.tools.js";

import { Tool } from "@modelcontextprotocol/sdk/types.js";
import * as workspace from "./workspace.tools.js";
import * as project from "./project.tools.js";
import * as version from "./version.tools.js";
import * as integration from "./integration.tools.js";

/**
 * Array of all available tools
 */
export const ALL_TOOLS: Tool[] = [
  // Workspace tools
  workspace.ListWorkspacesTool,
  workspace.ListProjectsTool,
  
  // Project tools
  project.CreateProjectTool,
  project.ImportProjectDocumentTool,
  project.PublishProjectTool,
  project.PreviewLinkTool,
  project.WaitForGenerationTool,
  project.GetDescriptionGenerationStatusTool,
  project.DeleteProjectTool,
  project.ExportProjectTool,
  
  // Version tools
  version.ListProjectVersionsTool,
  version.CreateProjectVersionTool,
  version.DeleteProjectVersionTool,
  version.AddSubscriberToProjectVersionTool,
  
  // Integration tools
  integration.ListPostmanCollectionsTool,
];

