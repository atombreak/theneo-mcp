# Demo Prompts for Theneo MCP

These prompts demonstrate the capabilities of the Theneo MCP server. You can copy and paste these into any MCP-enabled AI assistant (Claude Desktop, VS Code Copilot, Cursor, etc.).

## Prerequisites

Before running these prompts, make sure you have:
1. Configured your Theneo API key (see README for configuration options)
2. Started the MCP server or connected it to your AI assistant

---

## 1. List Available Workspaces

**Prompt:**
```
Use the theneo_list_workspaces tool to show me all my Theneo workspaces.
```

**What it does:** 
- Lists all workspaces accessible to your API key
- Shows workspace IDs, keys (slugs), and names
- Useful for finding the workspace to create projects in

---

## 2. Create a New Project from URL

**Prompt:**
```
Use the theneo_create_project tool to create a new project called "USPTO API Documentation" in my workspace. Use this OpenAPI spec URL: https://raw.githubusercontent.com/OAI/OpenAPI-Specification/main/examples/v3.0/uspto.json

Set publish to true, isPublic to true, and enable AI description generation with descriptionGeneration set to "FILL".
```

**What it does:**
- Creates a new project with the given name
- Imports the API spec from the URL
- Publishes the project immediately
- Makes it publicly accessible
- Uses AI to fill in missing descriptions

**Response includes:**
- Project ID (save this for later steps)
- Project name and status
- Workspace information

---

## 3. Wait for AI Generation to Complete

**Prompt:**
```
Use the theneo_wait_for_generation tool to wait for AI description generation to complete for project ID <PROJECT_ID_FROM_STEP_2>.
```

**What it does:**
- Polls the project status until AI generation completes
- Shows progress updates
- Waits up to 2 minutes by default

---

## 4. Get Preview Link

**Prompt:**
```
Use the theneo_preview_link tool to get the editor preview URL for project <PROJECT_ID>.
```

**What it does:**
- Returns the direct link to view/edit the project in Theneo
- You can open this link in your browser

---

## 5. Import an Updated Spec

**Prompt:**
```
Use the theneo_import_project_document tool to import an updated API spec into project <PROJECT_ID>. Use the local file at ./examples/sample-openapi.json, set publish to true, and use importOption "MERGE" to combine with existing content.
```

**What it does:**
- Imports a new or updated API specification
- Merges changes with existing documentation
- Publishes the updated version
- Preserves manual edits when possible

---

## 6. Publish a Project

**Prompt:**
```
Use the theneo_publish_project tool to publish project <PROJECT_ID>.
```

**What it does:**
- Explicitly publishes the project
- Returns the published page URL
- Makes the documentation live

---

## Full Workflow Example

**Prompt:**
```
Let's create a complete API documentation workflow:

1. First, use theneo_list_workspaces to show my available workspaces
2. Then create a new project called "Demo API" using theneo_create_project with:
   - Use my first workspace
   - Import from URL: https://raw.githubusercontent.com/OAI/OpenAPI-Specification/main/examples/v3.0/petstore.json
   - Enable publish and isPublic
   - Set descriptionGeneration to "FILL"
3. Use theneo_wait_for_generation to wait for AI descriptions
4. Use theneo_preview_link to show me where I can view it
5. Finally, confirm publication with theneo_publish_project

Show me the results at each step.
```

**What it does:**
- Demonstrates the complete end-to-end workflow
- Creates, enriches, and publishes documentation
- Shows how tools can be chained together

---

## Advanced: Create Project from Local File

**Prompt:**
```
Use theneo_create_project to create a project called "Local API Docs" with:
- file: "./examples/sample-openapi.json"
- workspaceKey: "my-workspace-slug"
- publish: false (we'll publish separately)
- descriptionGeneration: "OVERWRITE" (to replace all descriptions with AI-generated ones)
```

**What it does:**
- Creates a project from a local file
- Uses "OVERWRITE" mode to completely regenerate descriptions
- Doesn't publish immediately (draft mode)

---

## Postman Collection Import

**Prompt:**
```
Use theneo_create_project to create a project from Postman:
- name: "My Postman API"
- postmanApiKey: "PMAK-xxxxx"
- postmanCollectionIds: ["collection-id-1", "collection-id-2"]
- workspaceKey: "my-workspace"
- publish: true
```

**What it does:**
- Imports API documentation directly from Postman collections
- Supports multiple collections
- Automatically generates documentation from Postman format

---

## Tips

- **Project IDs**: Always save the project ID returned from create operations for subsequent steps
- **Workspace Keys**: Use either `workspaceKey` (slug) or `workspaceId` - key is usually easier to remember
- **AI Generation**: "FILL" adds descriptions where missing, "OVERWRITE" replaces all, "NO_GENERATION" skips AI
- **Import Options**: "MERGE" combines changes, "OVERWRITE" replaces everything, "ENDPOINTS_ONLY" updates only endpoints
- **Publishing**: You can create in draft mode (publish: false) and publish later with theneo_publish_project

---

## Troubleshooting Prompts

**Check server status:**
```
List all available tools that start with "theneo_"
```

**Verify configuration:**
```
Try to list workspaces - if this fails, my API key might not be configured correctly
```

**Get project information:**
```
After creating a project, save the returned project ID and use it for all subsequent operations
```

