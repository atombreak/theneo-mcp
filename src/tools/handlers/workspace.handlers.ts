import { TheneoService } from "../../services/theneo.service.js";
import { logger } from "../../utils/logger.js";

/**
 * Handler for listing workspaces
 */
export async function handleListWorkspaces(theneoService: TheneoService) {
  logger.info("Listing workspaces");
  const theneo = theneoService.getClient();
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

/**
 * Handler for listing projects
 */
export async function handleListProjects(
  theneoService: TheneoService,
  args: {
    workspaceId?: string;
    workspaceKey?: string;
    workspaceName?: string;
  }
) {
  const { workspaceId: inputWorkspaceId, workspaceKey, workspaceName } = args;

  // Resolve workspace ID if name or key provided
  const workspaceId = await theneoService.resolveWorkspaceId(
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

  const theneo = theneoService.getClient();
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
    projects = projects.filter((p: any) => p.companyId === workspaceId);
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

