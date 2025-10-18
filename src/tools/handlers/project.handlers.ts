import { DescriptionGenerationType } from "@theneo/sdk";
import { TheneoService } from "../../services/theneo.service.js";
import { logger } from "../../utils/logger.js";
import {
  CreateProjectInput,
  CreateProjectSchema,
  ImportProjectDocumentInput,
  ImportProjectDocumentSchema,
  ExportProjectInput,
  ExportProjectSchema,
} from "../../schemas/index.js";

/**
 * Handler for creating a project
 */
export async function handleCreateProject(theneoService: TheneoService, args: any) {
  const input = CreateProjectSchema.parse(args) as CreateProjectInput;

  // Resolve workspace ID if name is provided
  const resolvedWorkspaceId = await theneoService.resolveWorkspaceId(
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

  logger.info("Creating project", {
    name: input.name,
    workspace: input.workspaceName || input.workspaceKey || input.workspaceId,
  });

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

  const theneo = theneoService.getClient();
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
    descriptionGenerationType: input.descriptionGeneration as DescriptionGenerationType | undefined,
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

/**
 * Handler for importing project document
 */
export async function handleImportProjectDocument(theneoService: TheneoService, args: any) {
  const input = ImportProjectDocumentSchema.parse(args) as ImportProjectDocumentInput;

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
  const projectId = await theneoService.resolveProjectId(
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

  logger.info("Importing document", {
    projectId,
    projectName: input.projectName,
    workspace: input.workspaceName || input.workspaceKey,
  });

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

  const theneo = theneoService.getClient();
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

/**
 * Handler for publishing a project
 */
export async function handlePublishProject(
  theneoService: TheneoService,
  args: {
    projectId?: string;
    projectName?: string;
    workspaceId?: string;
    workspaceKey?: string;
    workspaceName?: string;
    versionId?: string;
  }
) {
  const { projectId: inputProjectId, projectName, workspaceId: inputWorkspaceId, workspaceKey, workspaceName, versionId } = args;

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

  logger.info("Publishing project", {
    projectId,
    projectName,
    versionId,
    workspace: workspaceName || workspaceKey,
  });

  const theneo = theneoService.getClient();
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

/**
 * Handler for getting preview link
 */
export async function handlePreviewLink(
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

  logger.info("Getting preview link", {
    projectId,
    projectName,
    workspace: workspaceName || workspaceKey,
  });

  const theneo = theneoService.getClient();
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

/**
 * Handler for waiting for generation
 */
export async function handleWaitForGeneration(
  theneoService: TheneoService,
  args: {
    projectId?: string;
    projectName?: string;
    workspaceId?: string;
    workspaceKey?: string;
    workspaceName?: string;
    retryTimeMs?: number;
    maxWaitTimeMs?: number;
  }
) {
  const {
    projectId: inputProjectId,
    projectName,
    workspaceId: inputWorkspaceId,
    workspaceKey,
    workspaceName,
    retryTimeMs = 2500,
    maxWaitTimeMs = 120000,
  } = args;

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

  logger.info("Waiting for generation", {
    projectId,
    projectName,
    workspace: workspaceName || workspaceKey,
  });

  const theneo = theneoService.getClient();
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

/**
 * Handler for getting generation status
 */
export async function handleGetGenerationStatus(
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

  logger.info("Getting generation status", {
    projectId,
    projectName,
    workspace: workspaceName || workspaceKey,
  });

  const theneo = theneoService.getClient();
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

/**
 * Handler for deleting a project
 */
export async function handleDeleteProject(
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

  logger.info("Deleting project", {
    projectId,
    projectName,
    workspace: workspaceName || workspaceKey,
  });

  const theneo = theneoService.getClient();
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

/**
 * Handler for exporting a project
 */
export async function handleExportProject(theneoService: TheneoService, args: any) {
  const input = ExportProjectSchema.parse(args) as ExportProjectInput;

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

  logger.info("Exporting project", {
    projectId,
    projectName: input.projectName,
    workspace: input.workspaceName || input.workspaceKey,
  });

  const theneo = theneoService.getClient();
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

