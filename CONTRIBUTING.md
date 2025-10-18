# Contributing to Theneo MCP

Thank you for your interest in contributing to Theneo MCP! This document provides guidelines and instructions for contributing.

## Development Setup

### Prerequisites

- Node.js 18 or higher
- npm or yarn
- Git
- A code editor (VS Code recommended)

### Getting Started

1. **Fork and clone the repository**

```bash
git clone https://github.com/YOUR_USERNAME/theneo-mcp.git
cd theneo-mcp
```

2. **Install dependencies**

```bash
npm install
```

3. **Set up your environment**

```bash
# Copy the example env file
cp env.example .env

# Add your Theneo API key for testing
echo "THENEO_API_KEY=your_test_key" >> .env
```

4. **Build the project**

```bash
npm run build
```

5. **Run in development mode**

```bash
npm run dev
```

## Development Workflow

### Making Changes

1. **Create a feature branch**

```bash
git checkout -b feature/your-feature-name
```

2. **Make your changes**
   - Follow the existing code style
   - Add comments for complex logic
   - Update documentation if needed

3. **Test your changes**

```bash
# Type check
npm run type-check

# Lint
npm run lint

# Build
npm run build
```

4. **Format your code**

```bash
npm run format
```

### Code Style

We use ESLint and Prettier to maintain consistent code style.

**Key guidelines:**
- Use TypeScript strict mode
- Add JSDoc comments for public APIs
- Use meaningful variable names
- Keep functions focused and small
- Handle errors explicitly

**Example:**

```typescript
/**
 * Load configuration from all sources
 * @returns Validated configuration object
 * @throws {Error} if configuration is invalid
 */
export async function loadConfig(): Promise<AppConfig> {
  // Implementation
}
```

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add new tool for listing projects
fix: correct API key validation logic
docs: update README with new examples
refactor: simplify config loading logic
test: add unit tests for credentials module
chore: update dependencies
```

### Testing

Currently manual testing is used. When adding tests:

1. Add test files next to source: `*.test.ts`
2. Use descriptive test names
3. Test both success and error cases
4. Mock external dependencies

```typescript
describe("loadConfig", () => {
  it("should load config from environment variables", async () => {
    // Test implementation
  });

  it("should throw error when API key is missing", async () => {
    // Test implementation
  });
});
```

## Pull Request Process

1. **Ensure all checks pass**
   - [ ] TypeScript compiles without errors
   - [ ] All tests pass (if applicable)
   - [ ] Linting passes
   - [ ] Code is formatted

2. **Update documentation**
   - [ ] Update README.md if adding features
   - [ ] Update CHANGELOG.md
   - [ ] Add JSDoc comments
   - [ ] Update examples if needed

3. **Create pull request**
   - Use a clear title
   - Describe what changed and why
   - Reference related issues
   - Add screenshots for UI changes

4. **Code review**
   - Address reviewer feedback
   - Keep discussions focused
   - Be open to suggestions

## Project Structure

```
src/
├── server.ts        # Main MCP server with tool definitions
├── cli.ts           # CLI interface and commands
├── config.ts        # Configuration schema
├── loadConfig.ts    # Multi-source configuration loader
├── credentials.ts   # OS keychain integration
└── utils/
    └── logger.ts    # Secure logging utility
```

### Key Components

**Server** (`server.ts`)
- Defines MCP tools
- Handles tool execution
- Manages Theneo SDK client

**Config** (`config.ts`, `loadConfig.ts`)
- Schema validation with Zod
- Multi-source configuration
- Profile support

**Credentials** (`credentials.ts`)
- Keychain integration
- Cross-platform support

**CLI** (`cli.ts`)
- Command routing
- User interaction
- Help messages

## Adding New Tools

To add a new MCP tool:

1. **Define the tool schema**

```typescript
const MyNewTool: Tool = {
  name: "theneo_my_new_tool",
  description: "Description of what it does",
  inputSchema: {
    type: "object",
    properties: {
      param1: { type: "string", description: "..." },
    },
    required: ["param1"],
  },
};
```

2. **Add Zod validation**

```typescript
const MyNewToolSchema = z.object({
  param1: z.string().describe("Parameter description"),
});
```

3. **Register the tool**

```typescript
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      // ... existing tools
      MyNewTool,
    ],
  };
});
```

4. **Implement the handler**

```typescript
case "theneo_my_new_tool": {
  const input = MyNewToolSchema.parse(args);
  // Implementation
  return { content: [{ type: "text", text: result }] };
}
```

5. **Update documentation**
   - Add to README.md
   - Add example to demo-prompts.md

## Security Guidelines

### Never commit secrets
- API keys
- Tokens
- Passwords
- Private keys

### Use secret masking
- All logging should use the logger utility
- Logger automatically masks secrets
- Verify no secrets in error messages

### Configuration
- Support multiple secure config sources
- Document security best practices
- Never log full config objects

## Documentation

When adding features:

1. **Code comments**
   - JSDoc for public APIs
   - Inline comments for complex logic

2. **README updates**
   - Add tool documentation
   - Update configuration examples
   - Add troubleshooting if needed

3. **Examples**
   - Add demo prompts
   - Update sample configs
   - Show real use cases

## Release Process

1. **Update version**
   ```bash
   npm version patch|minor|major
   ```

2. **Update CHANGELOG.md**
   - Document all changes
   - Follow Keep a Changelog format

3. **Test thoroughly**
   ```bash
   npm run prepublishOnly
   npm pack
   # Test the tarball
   ```

4. **Create release**
   - Tag in git
   - Create GitHub release
   - Publish to npm

## Questions?

- **Issues**: [GitHub Issues](https://github.com/atombreak/mcp-server/issues)
- **Discussions**: [GitHub Discussions](https://github.com/atombreak/mcp-server/discussions)

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

