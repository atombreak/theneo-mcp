#!/usr/bin/env node

import minimist from "minimist";
import { saveKey, deleteKey, listProfiles, isKeychainAvailable } from "./credentials.js";
import { logger } from "./utils/logger.js";

const USAGE = `
Theneo MCP - Model Context Protocol server for Theneo SDK

USAGE:
  theneo-mcp [command] [options]

COMMANDS:
  server              Start the MCP server (default)
  creds save          Save API key to OS keychain
  creds rm            Remove API key from OS keychain
  creds list          List stored credential profiles

SERVER OPTIONS:
  --profile <name>    Configuration profile to use (default: "default")
  --apiKey <key>      Theneo API key (overrides other sources)
  --baseApiUrl <url>  Theneo API base URL
  --baseAppUrl <url>  Theneo app base URL

CREDENTIAL OPTIONS:
  --profile <name>    Profile name (default: "default")
  --apiKey <key>      API key to save (required for 'save' command)

EXAMPLES:
  # Start MCP server (reads config from env/keychain/files)
  theneo-mcp server

  # Start server with specific profile
  theneo-mcp server --profile production

  # Save API key to keychain
  theneo-mcp creds save --profile default --apiKey sk_xxx

  # Remove stored credentials
  theneo-mcp creds rm --profile default

  # List all profiles
  theneo-mcp creds list

CONFIGURATION:
  Config is loaded from multiple sources (highest priority first):
  1. CLI flags (--apiKey, --profile, etc.)
  2. Environment variables (THENEO_API_KEY, THENEO_PROFILE, etc.)
  3. Project RC file (.theneo-mcp.json or .theneo-mcp.yaml)
  4. User config (~/.config/theneo-mcp/config.json)
  5. OS keychain (for API key)
  6. .env file (development only)

  Get your API key: https://app.theneo.io/

MORE INFO:
  Documentation: https://github.com/theneo/mcp-server
  Issues: https://github.com/theneo/mcp-server/issues
`;

async function handleCredsCommand(subcommand: string, argv: minimist.ParsedArgs) {
  const profile = argv.profile || "default";

  switch (subcommand) {
    case "save": {
      const apiKey = argv.apiKey;
      if (!apiKey) {
        console.error("Error: --apiKey is required for 'creds save' command");
        console.error("\nUsage: theneo-mcp creds save --profile <name> --apiKey <key>");
        process.exit(1);
      }

      // Check if keychain is available
      const available = await isKeychainAvailable();
      if (!available) {
        console.error("Error: OS keychain is not available on this system");
        console.error(
          "Please use environment variables or config files to store your API key"
        );
        process.exit(1);
      }

      try {
        await saveKey(profile, apiKey);
        console.log(`✓ API key saved successfully for profile: ${profile}`);
        console.log("\nYou can now start the server:");
        console.log(`  theneo-mcp server --profile ${profile}`);
      } catch (error) {
        console.error("Error saving API key:", error instanceof Error ? error.message : error);
        process.exit(1);
      }
      break;
    }

    case "rm":
    case "remove":
    case "delete": {
      // Check if keychain is available
      const available = await isKeychainAvailable();
      if (!available) {
        console.error("Error: OS keychain is not available on this system");
        process.exit(1);
      }

      try {
        const deleted = await deleteKey(profile);
        if (deleted) {
          console.log(`✓ API key removed successfully for profile: ${profile}`);
        } else {
          console.log(`No API key found for profile: ${profile}`);
        }
      } catch (error) {
        console.error("Error removing API key:", error instanceof Error ? error.message : error);
        process.exit(1);
      }
      break;
    }

    case "list":
    case "ls": {
      // Check if keychain is available
      const available = await isKeychainAvailable();
      if (!available) {
        console.error("Error: OS keychain is not available on this system");
        process.exit(1);
      }

      try {
        const profiles = await listProfiles();
        if (profiles.length === 0) {
          console.log("No stored credentials found");
          console.log("\nTo save a credential:");
          console.log("  theneo-mcp creds save --profile <name> --apiKey <key>");
        } else {
          console.log("Stored credential profiles:");
          profiles.forEach((p) => console.log(`  - ${p}`));
        }
      } catch (error) {
        console.error("Error listing profiles:", error instanceof Error ? error.message : error);
        process.exit(1);
      }
      break;
    }

    default:
      console.error(`Unknown creds subcommand: ${subcommand}`);
      console.error("\nAvailable subcommands: save, rm, list");
      process.exit(1);
  }
}

async function main() {
  const argv = minimist(process.argv.slice(2));
  const command = argv._[0] || "server";

  // Handle help flag
  if (argv.help || argv.h) {
    console.log(USAGE);
    process.exit(0);
  }

  // Handle version flag
  if (argv.version || argv.v) {
    console.log("theneo-mcp v0.1.0");
    process.exit(0);
  }

  try {
    switch (command) {
      case "server":
      case "start": {
        // Import and run the server module
        // The server module executes immediately when imported
        await import("./server.js");
        break;
      }

      case "creds":
      case "credentials": {
        const subcommand = argv._[1];
        if (!subcommand) {
          console.error("Error: creds command requires a subcommand (save, rm, list)");
          console.error("\nUsage:");
          console.error("  theneo-mcp creds save --profile <name> --apiKey <key>");
          console.error("  theneo-mcp creds rm --profile <name>");
          console.error("  theneo-mcp creds list");
          process.exit(1);
        }
        await handleCredsCommand(subcommand, argv);
        break;
      }

      default:
        console.error(`Unknown command: ${command}`);
        console.error("\nAvailable commands: server, creds");
        console.error("Run 'theneo-mcp --help' for more information");
        process.exit(1);
    }
  } catch (error) {
    logger.error("CLI error", { error });
    console.error("Error:", error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

main();

