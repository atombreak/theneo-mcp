# Theneo MCP Server

**Model Context Protocol server for Theneo SDK** - The automation backbone for API documentation in the AI era.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)

This MCP server exposes [Theneo's](https://theneo.io) API documentation platform through the [Model Context Protocol](https://modelcontextprotocol.io/), allowing AI assistants to create, update, and publish API documentation automatically.

## Overview

Theneo MCP enables any AI assistant (Claude Desktop, VS Code Copilot, Cursor, etc.) to interact with Theneo's SDK, making API documentation creation and maintenance fully automatable. Perfect for CI/CD pipelines, AI-driven workflows, and developer productivity tools.

### Key Features

- 🤖 **AI-First**: Works with any MCP-compatible AI assistant
- 🔐 **Enterprise Security**: Multi-source config, OS keychain support, secret masking
- 🎯 **6 Core Tools**: List workspaces, create projects, import specs, publish, preview, and wait for AI generation
- 📦 **Flexible Input**: Supports OpenAPI/Swagger files, URLs, raw text, and Postman collections
- 🚀 **AI-Powered**: Built-in AI description generation (fill, overwrite, or skip)
- 🔄 **Smart Imports**: Merge, overwrite, or endpoints-only update strategies
- 🌍 **Profile Support**: Manage multiple environments (dev, staging, prod)

## Installation

### Global Installation (Recommended)

```bash
npm install -g theneo-mcp
```

### Local Development

```bash
git clone https://github.com/theneo/mcp-server
cd theneo-mcp
npm install
npm run build
```

## Quick Start (5 Minutes)

### 1. Get Your API Key

Visit [https://app.theneo.io/](https://app.theneo.io/) to get your Theneo API key.

### 2. Configure Authentication

**Option A: OS Keychain (Recommended for local dev)**
```bash
theneo-mcp creds save --profile default --apiKey YOUR_API_KEY
```

**Option B: Environment Variable**
```bash
export THENEO_API_KEY=YOUR_API_KEY
```

### 3. Connect to Your AI Assistant

#### Claude Desktop

Add to `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "theneo": {
      "command": "theneo-mcp",
      "args": ["server"]
    }
  }
}
```

#### VS Code Copilot

Add to your VS Code `settings.json`:

```json
{
  "chat.mcp.access": "all",
  "chat.mcp.servers": {
    "theneo": {
      "command": "theneo-mcp",
      "args": ["server"],
      "env": {
        "THENEO_API_KEY": "your_api_key_here"
      }
    }
  }
}
```

#### Cursor

Add to Cursor settings (Settings → MCP):

```json
{
  "mcpServers": {
    "theneo": {
      "command": "theneo-mcp",
      "args": ["server", "--profile", "default"]
    }
  }
}
```

### 4. Test It Out

In your AI assistant, try:
```
Use theneo_list_workspaces to show me my Theneo workspaces
```

Then create a project:
```
Use theneo_create_project to create a project called "Demo API" with:
- name: "Demo API"
- link: "https://raw.githubusercontent.com/OAI/OpenAPI-Specification/main/examples/v3.0/petstore.json"
- publish: true
- isPublic: true
- descriptionGeneration: "FILL"
```

## Configuration

### Configuration Sources & Precedence

Configuration is loaded from multiple sources with clear precedence (highest first):

| Priority | Source | Use Case | Example |
|----------|--------|----------|---------|
| 1 | CLI flags | Override everything | `--apiKey sk_xxx` |
| 2 | Environment variables | CI/CD, containers | `THENEO_API_KEY=xxx` |
| 3 | Project RC file | Project-specific settings | `.theneo-mcp.yaml` |
| 4 | User config | Personal defaults | `~/.config/theneo-mcp/config.json` |
| 5 | OS keychain | Secure local storage | `theneo-mcp creds save` |
| 6 | .env file | Development only | `.env` |

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `THENEO_API_KEY` | Your Theneo API key | *Required* |
| `THENEO_BASE_API_URL` | Theneo API endpoint | `https://api.theneo.io` |
| `THENEO_BASE_APP_URL` | Theneo web app URL | `https://app.theneo.io` |
| `THENEO_PROFILE` | Configuration profile | `default` |

### Project Configuration File

Create `.theneo-mcp.yaml` or `.theneo-mcp.json` in your project root:

```yaml
# .theneo-mcp.yaml
profile: default
baseApiUrl: https://api.theneo.io
baseAppUrl: https://app.theneo.io

# Multi-environment support
profiles:
  development:
    profile: development
  
  production:
    profile: production
```

**⚠️ Security Note**: Never commit API keys to version control! Store them in keychain or environment variables.

### User Configuration

Create `~/.config/theneo-mcp/config.json` (Linux/macOS) or `%AppData%/theneo-mcp/config.json` (Windows):

```json
{
  "profile": "default",
  "baseApiUrl": "https://api.theneo.io",
  "baseAppUrl": "https://app.theneo.io",
  "profiles": {
    "default": {},
    "production": {}
  }
}
```

### OS Keychain (Recommended)

Store API keys securely in your system's keychain:

```bash
# Save API key
theneo-mcp creds save --profile default --apiKey YOUR_KEY

# Remove API key
theneo-mcp creds rm --profile default

# List stored profiles
theneo-mcp creds list
```

### Using Profiles

Switch between environments easily:

```bash
# Use production profile
theneo-mcp server --profile production

# Or via environment
THENEO_PROFILE=production theneo-mcp server
```

## Available Tools

### 1. `theneo_list_workspaces`

List all workspaces accessible to your account.

**Parameters:** None

**Example:**
```
Use theneo_list_workspaces to show my workspaces
```

### 2. `theneo_create_project`

Create a new API documentation project with optional spec import and AI generation.

**Parameters:**
- `name` (string, required): Project name
- `workspaceKey` (string, optional): Workspace slug
- `workspaceId` (string, optional): Workspace ID
- `publish` (boolean, optional): Publish immediately
- `isPublic` (boolean, optional): Make project public
- `descriptionGeneration` (enum, optional): `FILL` | `OVERWRITE` | `NO_GENERATION`
- **Data sources** (choose one):
  - `file` (string): Path to local OpenAPI/Swagger file
  - `link` (string): URL to OpenAPI/Swagger spec
  - `text` (string): Raw OpenAPI/Swagger spec
  - `postmanApiKey` + `postmanCollectionIds`: Import from Postman

**Example:**
```
Use theneo_create_project to create:
- name: "My API"
- link: "https://example.com/openapi.json"
- publish: true
- descriptionGeneration: "FILL"
```

### 3. `theneo_import_project_document`

Import or update API documentation in an existing project.

**Parameters:**
- `projectId` (string, required): Target project ID
- `publish` (boolean, optional): Publish after import
- `importOption` (enum, optional): `MERGE` | `OVERWRITE` | `ENDPOINTS_ONLY`
- **Data sources** (same as create_project, one required)

**Example:**
```
Use theneo_import_project_document:
- projectId: "proj_123"
- file: "./openapi.json"
- importOption: "MERGE"
- publish: true
```

### 4. `theneo_publish_project`

Publish a project to make it live.

**Parameters:**
- `projectId` (string, required): Project to publish

**Example:**
```
Use theneo_publish_project with projectId "proj_123"
```

### 5. `theneo_preview_link`

Get the editor preview URL for a project.

**Parameters:**
- `projectId` (string, required): Project ID

**Example:**
```
Use theneo_preview_link for project "proj_123"
```

### 6. `theneo_wait_for_generation`

Wait for AI description generation to complete.

**Parameters:**
- `projectId` (string, required): Project ID
- `retryTimeMs` (number, optional): Polling interval (default: 2500)
- `maxWaitTimeMs` (number, optional): Max wait time (default: 120000)

**Example:**
```
Use theneo_wait_for_generation for project "proj_123"
```

## Demo Script (End-to-End)

This 5-minute demo shows the complete workflow:

```
Step 1: List workspaces
Use theneo_list_workspaces

Step 2: Create a project with AI generation
Use theneo_create_project with:
- name: "USPTO API Documentation"
- link: "https://raw.githubusercontent.com/OAI/OpenAPI-Specification/main/examples/v3.0/uspto.json"
- publish: true
- isPublic: true
- descriptionGeneration: "FILL"

Step 3: Wait for AI to finish
Use theneo_wait_for_generation with the project ID from step 2

Step 4: Get the preview link
Use theneo_preview_link with the project ID

Step 5: Import an update (merge mode)
Use theneo_import_project_document with:
- projectId: (from step 2)
- file: "./examples/sample-openapi.json"
- importOption: "MERGE"
- publish: true

Step 6: Get final published URL
Use theneo_publish_project with the project ID
```

More examples in [`examples/demo-prompts.md`](./examples/demo-prompts.md).

## Security Best Practices

### ✅ DO

- **Use OS keychain** for API keys on local machines
- **Use environment variables** in CI/CD and containers
- **Enable secret masking** in your CI logs
- **Rotate API keys** regularly and after demos
- **Use profiles** to isolate environments
- **Review `.gitignore`** to exclude secrets
- **Use `.npmignore`** to prevent publishing secrets

### ❌ DON'T

- **Never commit** API keys to git
- **Never log** full configuration objects
- **Never use** API keys in URLs or query parameters
- **Never share** API keys in public channels
- **Avoid** storing keys in project RC files checked into git

### CI/CD Integration

Example GitHub Actions workflow:

```yaml
name: Update API Docs

on:
  push:
    paths:
      - 'openapi.yaml'

jobs:
  update-docs:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install Theneo MCP
        run: npm install -g theneo-mcp
      
      - name: Update Documentation
        env:
          THENEO_API_KEY: ${{ secrets.THENEO_API_KEY }}
        run: |
          # Your automation script here
          # Call MCP tools via a script or AI assistant
```

**Security Notes for CI:**
- Store `THENEO_API_KEY` as a GitHub secret
- Use `secrets.` syntax to avoid exposure
- Consider short-lived tokens if Theneo supports OIDC
- Mask secrets in logs: `echo "::add-mask::$THENEO_API_KEY"`

## Development

### Build from Source

```bash
git clone https://github.com/theneo/mcp-server
cd theneo-mcp
npm install
npm run build
```

### Development Mode

```bash
npm run dev  # Start server with auto-reload
```

### Code Quality

```bash
npm run lint        # Run ESLint
npm run format      # Format with Prettier
npm run type-check  # TypeScript validation
```

### Project Structure

```
theneo-mcp/
├── src/
│   ├── server.ts       # MCP server implementation
│   ├── cli.ts          # CLI commands
│   ├── config.ts       # Configuration schema
│   ├── loadConfig.ts   # Multi-source config loader
│   ├── credentials.ts  # Keychain management
│   └── utils/
│       └── logger.ts   # Structured logging with secret masking
├── examples/           # Sample files and demos
├── dist/              # Compiled output
└── package.json
```

## Troubleshooting

### API Key Not Found

**Problem:** Server exits with "API key not configured"

**Solutions:**
1. Set environment variable: `export THENEO_API_KEY=your_key`
2. Save to keychain: `theneo-mcp creds save --apiKey your_key`
3. Check profile: `theneo-mcp server --profile default`

### Keychain Not Available

**Problem:** "OS keychain is not available"

**Solution:** Use environment variables or config files instead:
```bash
export THENEO_API_KEY=your_key
theneo-mcp server
```

### MCP Server Not Connecting

**Problem:** AI assistant can't find tools

**Solutions:**
1. Restart your AI assistant after config changes
2. Check logs: Look for MCP connection errors
3. Verify command path: Use absolute path to `theneo-mcp`
4. Test manually: Run `theneo-mcp server` to see startup logs

### Import Fails

**Problem:** "Failed to import document"

**Solutions:**
1. Verify file path or URL is accessible
2. Ensure OpenAPI spec is valid JSON/YAML
3. Check project ID is correct
4. Review API key permissions

### AI Generation Timeout

**Problem:** "Generation failed or timed out"

**Solutions:**
1. Increase timeout: `maxWaitTimeMs: 300000` (5 minutes)
2. Check Theneo dashboard for generation status
3. Try again - large specs may take time

## Publishing to npm

### Pre-Publish Checklist

- [ ] Update version in `package.json`
- [ ] Run `npm run type-check`
- [ ] Run `npm run lint`
- [ ] Test build: `npm run build`
- [ ] Verify `.npmignore` excludes secrets
- [ ] Test installation: `npm pack` and install locally
- [ ] Update CHANGELOG.md

### Publish

```bash
npm run prepublishOnly  # Runs checks and build
npm publish
```

### What Gets Published

✅ **Included:**
- `dist/` (compiled JavaScript)
- `package.json`, `README.md`, `LICENSE`

❌ **Excluded** (via `.npmignore`):
- `src/` (TypeScript source)
- `.env` and secrets
- Examples with sensitive data
- Development configs

## Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes with tests
4. Run linting and type checks
5. Submit a pull request

## License

MIT License - see [LICENSE](LICENSE) file for details

## Links

- **Theneo Platform**: [https://theneo.io](https://theneo.io)
- **Theneo SDK**: [https://www.npmjs.com/package/@theneo/sdk](https://www.npmjs.com/package/@theneo/sdk)
- **Model Context Protocol**: [https://modelcontextprotocol.io](https://modelcontextprotocol.io)
- **Issues**: [https://github.com/theneo/mcp-server/issues](https://github.com/theneo/mcp-server/issues)

## Support

- **Documentation**: This README and [`examples/demo-prompts.md`](./examples/demo-prompts.md)
- **Issues**: [GitHub Issues](https://github.com/theneo/mcp-server/issues)
- **Theneo Support**: [https://theneo.io/support](https://theneo.io/support)

---

**Made with ❤️ for the AI-powered documentation era**

*Positioning Theneo as the automation backbone for developer documentation*

