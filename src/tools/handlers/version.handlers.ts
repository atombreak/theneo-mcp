import { TheneoService } from "../../services/theneo.service.js";
import { logger } from "../../utils/logger.js";
import {
  CreateProjectVersionInput,
  CreateProjectVersionSchema,
  AddSubscriberToProjectVersionInput,
  AddSubscriberToProjectVersionSchema,
} from "../../schemas/index.js";

/**
 * Handler for listing project versions
 */
export async function handleListProjectVersions(
  theneoService: TheneoService,
  args: {
    projectId?: string;
    projectName?: string;
    workspaceId?: string;
    workspaceKey?: string;
    workspaceName?: string;
  }
) {
  const { projectId: inputProjectId, projectName, workspaceId: inputWorkspaceId, workspaceKey, workspaceName } = args;

  // Resolve workspace ID if name or key provided
  const workspaceId = await theneoService.resolveWorkspaceId(
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
  const projectId = await theneoService.resolveProjectId(inputProjectId, projectName, workspaceId);

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

  logger.info("Listing project versions", {
    projectId,
    projectName,
    workspace: workspaceName || workspaceKey,
  });

  const theneo = theneoService.getClient();
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

/**
 * Handler for creating a project version
 */
export async function handleCreateProjectVersion(theneoService: TheneoService, args: any) {
  const input = CreateProjectVersionSchema.parse(args) as CreateProjectVersionInput;

  // Resolve workspace ID if name or key provided
  const workspaceId = await theneoService.resolveWorkspaceId(
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
  const projectId = await theneoService.resolveProjectId(input.projectId, input.projectName, workspaceId);

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

  logger.info("Creating project version", {
    projectId,
    projectName: input.projectName,
    versionName: input.name,
  });

  const theneo = theneoService.getClient();
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

/**
 * Handler for deleting a project version
 */
export async function handleDeleteProjectVersion(
  theneoService: TheneoService,
  args: { versionId: string }
) {
  const { versionId } = args;

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

  const theneo = theneoService.getClient();
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

/**
 * Handler for adding subscriber to project version
 */
export async function handleAddSubscriberToVersion(theneoService: TheneoService, args: any) {
  const input = AddSubscriberToProjectVersionSchema.parse(args) as AddSubscriberToProjectVersionInput;

  logger.info("Adding subscriber to project version", {
    email: input.email,
    versionId: input.projectVersionId,
  });

  const theneo = theneoService.getClient();
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

