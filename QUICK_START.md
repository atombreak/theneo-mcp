# Quick Start Guide

Get up and running with Theneo MCP in under 5 minutes!

## Prerequisites

- Node.js 18 or higher
- npm or yarn
- A Theneo API key ([get one here](https://app.theneo.io/))

## Installation

### Option 1: Global Installation (Coming Soon)

```bash
npm install -g theneo-mcp
```

### Option 2: Use from Source

```bash
git clone https://github.com/atombreak/mcp-server
cd theneo-mcp
npm install
npm run build
```

## Setup Your API Key

Choose one of these methods:

### Method 1: OS Keychain (Most Secure for Local Dev)

```bash
theneo-mcp creds save --profile default --apiKey YOUR_API_KEY
```

### Method 2: Environment Variable (Good for CI/CD)

```bash
# Add to your ~/.bashrc, ~/.zshrc, or ~/.profile
export THENEO_API_KEY=YOUR_API_KEY
```

### Method 3: Config File (Good for Teams)

Create `~/.config/theneo-mcp/config.json`:

```json
{
  "apiKey": "YOUR_API_KEY",
  "profile": "default"
}
```

**⚠️ Important:** Never commit API keys to git!

## Connect to Your AI Assistant

### Claude Desktop

1. Open `~/Library/Application Support/Claude/claude_desktop_config.json`
2. Add this configuration:

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

3. Restart Claude Desktop

### VS Code Copilot

1. Open VS Code Settings (JSON)
2. Add this configuration:

```json
{
  "chat.mcp.access": "all",
  "chat.mcp.servers": {
    "theneo": {
      "command": "theneo-mcp",
      "args": ["server"],
      "env": {
        "THENEO_API_KEY": "YOUR_API_KEY"
      }
    }
  }
}
```

3. Reload VS Code

### Cursor

1. Go to Settings → MCP
2. Add this configuration:

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

3. Restart Cursor

## Test It Out

### 1. List Your Workspaces

In your AI assistant:

```
Use theneo_list_workspaces to show me my Theneo workspaces
```

### 2. Create Your First Project

```
Use theneo_create_project to create a project called "My First API" with:
- name: "My First API"
- link: "https://raw.githubusercontent.com/OAI/OpenAPI-Specification/main/examples/v3.0/petstore.json"
- publish: true
- isPublic: true
- descriptionGeneration: "FILL"
```

### 3. Wait for AI Generation (Optional)

```
Use theneo_wait_for_generation with the project ID from the previous response
```

### 4. Get the Preview Link

```
Use theneo_preview_link with the project ID to see where I can view it
```

## What's Next?

- 📖 Read the full [README](./README.md) for detailed documentation
- 🎯 Try the [demo prompts](./examples/demo-prompts.md) for more examples
- 🔐 Review [security best practices](./README.md#security-best-practices)
- 🚀 Set up [CI/CD integration](./README.md#cicd-integration)

## Troubleshooting

### "API key not configured"

Make sure you've set your API key using one of the methods above. Verify with:

```bash
# Check if keychain has the key
theneo-mcp creds list

# Or check environment variable
echo $THENEO_API_KEY
```

### "Keychain not available"

Some systems don't support keychain. Use environment variables instead:

```bash
export THENEO_API_KEY=YOUR_API_KEY
theneo-mcp server
```

### "Cannot find command 'theneo-mcp'"

If globally installed, make sure npm global bin is in your PATH:

```bash
npm config get prefix  # Should be in your PATH
```

If using from source, use the full path:

```bash
/full/path/to/theneo-mcp/dist/cli.js server
```

### AI Assistant Can't Find Tools

1. Restart your AI assistant after config changes
2. Check the command path in your config
3. Test manually: `theneo-mcp server` (should start without errors)

## Need Help?

- **Issues**: [GitHub Issues](https://github.com/atombreak/mcp-server/issues)
- **Documentation**: [Full README](./README.md)
- **Theneo Support**: [https://theneo.io/support](https://theneo.io/support)

