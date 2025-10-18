import { z } from "zod";

/**
 * Schema for creating a project
 */
export const CreateProjectSchema = z.object({
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

export type CreateProjectInput = z.infer<typeof CreateProjectSchema>;

/**
 * Schema for importing project documents
 */
export const ImportProjectDocumentSchema = z.object({
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

export type ImportProjectDocumentInput = z.infer<typeof ImportProjectDocumentSchema>;

/**
 * Schema for exporting a project
 */
export const ExportProjectSchema = z.object({
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

export type ExportProjectInput = z.infer<typeof ExportProjectSchema>;

