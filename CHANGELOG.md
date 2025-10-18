# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2025-10-17

### Added

- Initial release of Theneo MCP server
- 6 core tools for Theneo SDK integration:
  - `theneo_list_workspaces` - List available workspaces
  - `theneo_create_project` - Create new API documentation projects
  - `theneo_import_project_document` - Import/update API specifications
  - `theneo_publish_project` - Publish projects
  - `theneo_preview_link` - Get editor preview URLs
  - `theneo_wait_for_generation` - Wait for AI description generation
- Multi-source configuration system with precedence:
  - CLI flags
  - Environment variables
  - Project RC files (.theneo-mcp.{json,yaml})
  - User config files (~/.config/theneo-mcp/)
  - OS keychain integration
  - .env files (development)
- Credential management CLI:
  - `theneo-mcp creds save` - Store API keys in OS keychain
  - `theneo-mcp creds rm` - Remove stored credentials
  - `theneo-mcp creds list` - List stored profiles
- Profile support for multi-environment setups
- Comprehensive security features:
  - Secret masking in logs
  - OS keychain support
  - No hardcoded secrets
  - Secure configuration guidelines
- Full documentation:
  - Complete README with setup guides
  - Demo prompts and examples
  - Configuration templates
  - Security best practices
- Sample OpenAPI specification (USPTO API)
- Support for multiple data sources:
  - Local files
  - URLs
  - Raw text/JSON
  - Postman collections
- AI-powered description generation modes:
  - FILL - Add descriptions where missing
  - OVERWRITE - Replace all descriptions
  - NO_GENERATION - Skip AI generation
- Import strategies:
  - MERGE - Combine with existing content
  - OVERWRITE - Replace everything
  - ENDPOINTS_ONLY - Update only endpoints
- TypeScript with strict mode
- ESLint and Prettier configuration
- Structured logging with secret masking

### Developer Experience

- Hot reload development mode
- Comprehensive type safety
- Clear error messages
- Helpful CLI usage information
- Example configurations and prompts

[0.1.0]: https://github.com/atombreak/mcp-server/releases/tag/v0.1.0

