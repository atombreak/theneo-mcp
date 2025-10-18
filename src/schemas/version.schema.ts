import { z } from "zod";

/**
 * Schema for creating a project version
 */
export const CreateProjectVersionSchema = z.object({
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

export type CreateProjectVersionInput = z.infer<typeof CreateProjectVersionSchema>;

/**
 * Schema for adding a subscriber to a project version
 */
export const AddSubscriberToProjectVersionSchema = z.object({
  email: z.string().email().describe("Email address to subscribe"),
  projectVersionId: z.string().describe("Project version ID"),
});

export type AddSubscriberToProjectVersionInput = z.infer<typeof AddSubscriberToProjectVersionSchema>;

