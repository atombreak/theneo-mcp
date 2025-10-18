/**
 * Mock responses for Theneo SDK
 */

export const mockWorkspaces = [
  {
    workspaceId: "ws_test123",
    name: "Test Workspace",
    slug: "test-workspace",
    role: "admin" as const,
    isDefault: true,
    isCorporate: false,
    isSubscribed: true,
  },
  {
    workspaceId: "ws_prod456",
    name: "Production",
    slug: "production",
    role: "editor" as const,
    isDefault: false,
    isCorporate: false,
    isSubscribed: true,
  },
];

export const mockProjects = [
  {
    id: "proj_abc123",
    name: "Payment API",
    key: "payment-api",
    isPublic: false,
    companyId: "ws_test123",
    createdAt: new Date("2024-01-01"),
    company: {
      id: "ws_test123",
      name: "Test Workspace",
      slug: "test-workspace",
      corporateId: "corp_123",
      createdAt: new Date("2024-01-01"),
      updatedAt: new Date("2024-01-01"),
      createdBy: "user_123",
    },
  },
  {
    id: "proj_def456",
    name: "User API",
    key: "user-api",
    isPublic: true,
    companyId: "ws_test123",
    createdAt: new Date("2024-01-02"),
    company: {
      id: "ws_test123",
      name: "Test Workspace",
      slug: "test-workspace",
      corporateId: "corp_123",
      createdAt: new Date("2024-01-01"),
      updatedAt: new Date("2024-01-01"),
      createdBy: "user_123",
    },
  },
];

export const mockProjectVersions = [
  {
    id: "ver_v1",
    name: "v1.0",
    slug: "v1-0",
    isDefaultVersion: true,
    versionTag: "v1.0",
    createdAt: "2024-01-01T00:00:00Z",
    createdBy: "user_123",
    publishedAt: "2024-01-01T00:00:00Z",
    isPublished: true,
  },
  {
    id: "ver_v2",
    name: "v2.0",
    slug: "v2-0",
    isDefaultVersion: false,
    versionTag: "v2.0",
    createdAt: "2024-01-02T00:00:00Z",
    createdBy: "user_123",
  },
];

export const mockCreateProjectResponse = {
  projectId: "proj_new123",
  publishData: {
    projectKey: "new-api",
    baseUrlRequired: false,
    companySlug: "test-workspace",
    publishedPageUrl: "https://app.theneo.io/test-workspace/new-api",
  },
};

export const mockPublishResponse = {
  projectKey: "payment-api",
  baseUrlRequired: false,
  companySlug: "test-workspace",
  publishedPageUrl: "https://app.theneo.io/test-workspace/payment-api",
};

export const mockGenerationStatus = {
  name: "Payment API",
  key: "payment-api",
  creationStatus: "FINISHED" as const,
  descriptionGenerationProgress: 100,
  updatedAt: "2024-01-01T00:00:00Z",
};

export const mockExportData = {
  sectionContents: [
    {
      fileName: "introduction.md",
      content: "# Introduction\n\nWelcome to the API",
    },
  ],
  config: {
    title: "Payment API",
    version: "v1.0",
  },
};

export const mockPostmanCollections = [
  {
    id: "col_123",
    name: "Test Collection",
    owner: "user_123",
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
    uid: "123456-abc-def",
    isPublic: false,
  },
];

