import { Theneo, TheneoOptions } from "@theneo/sdk";
import { logger } from "../utils/logger.js";

/**
 * Service class for interacting with Theneo SDK
 * Provides helper methods and wraps SDK functionality
 */
export class TheneoService {
  private client: Theneo;

  constructor(apiKey?: string, baseApiUrl?: string, baseAppUrl?: string) {
    const opts: TheneoOptions = {
      apiKey,
      baseApiUrl,
      baseAppUrl,
    };
    this.client = new Theneo(opts);
  }

  /**
   * Get the underlying Theneo client
   */
  getClient(): Theneo {
    return this.client;
  }

  /**
   * Resolve workspace name or key to workspace ID
   */
  async resolveWorkspaceId(
    workspaceId?: string,
    workspaceKey?: string,
    workspaceName?: string
  ): Promise<string | undefined> {
    // If workspaceId is provided, use it directly
    if (workspaceId) {
      return workspaceId;
    }

    // If workspaceKey is provided, resolve it to an ID
    if (workspaceKey) {
      try {
        const result = await this.client.listWorkspaces();
        if (!result.ok) {
          logger.error("Failed to list workspaces for key resolution", { error: result.error });
          return undefined;
        }

        const workspaces = result.value;
        const matchingWorkspace = workspaces.find(
          (w: any) => w.slug?.toLowerCase() === workspaceKey.toLowerCase()
        );

        if (matchingWorkspace) {
          logger.debug("Resolved workspace key to ID", {
            workspaceKey,
            workspaceId: (matchingWorkspace as any).workspaceId,
          });
          return (matchingWorkspace as any).workspaceId;
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
        const result = await this.client.listWorkspaces();
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
            workspaceId: (matchingWorkspace as any).workspaceId,
          });
          return (matchingWorkspace as any).workspaceId;
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
   * Resolve project name to project ID
   */
  async resolveProjectId(
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
        const result = await this.client.listProjects();
        if (!result.ok) {
          logger.error("Failed to list projects for name resolution", { error: result.error });
          return null;
        }

        const projects = result.value;
        // Filter by workspace if provided
        const filteredProjects = workspaceId
          ? projects.filter((p: any) => p.companyId === workspaceId)
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
}

