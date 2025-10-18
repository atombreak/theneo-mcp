#!/usr/bin/env node

import minimist from "minimist";
import fs from "fs/promises";
import path from "path";
import os from "os";
import { saveKey, deleteKey, listProfiles, isKeychainAvailable } from "./credentials.js";
import { logger } from "./utils/logger.js";
import { TelemetryService } from "./telemetry/telemetry.service.js";

const USAGE = `
Theneo MCP - Model Context Protocol server for Theneo SDK

USAGE:
  theneo-mcp [command] [options]

COMMANDS:
  server              Start the MCP server (default)
  creds save          Save API key to OS keychain
  creds rm            Remove API key from OS keychain
  creds list          List stored credential profiles
  telemetry enable    Enable anonymous usage telemetry
  telemetry disable   Disable telemetry
  telemetry status    Show telemetry status and statistics
  telemetry view      View collected telemetry data
  telemetry clear     Clear all telemetry data

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

  # Enable telemetry
  theneo-mcp telemetry enable

  # View telemetry status
  theneo-mcp telemetry status

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
  Documentation: https://github.com/atombreak/mcp-server
  Issues: https://github.com/atombreak/mcp-server/issues
`;

const CONFIG_DIR = path.join(os.homedir(), ".config", "theneo-mcp");
const USER_CONFIG_FILE = path.join(CONFIG_DIR, "config.json");

async function handleTelemetryCommand(subcommand: string, _argv: minimist.ParsedArgs) {
  switch (subcommand) {
    case "enable": {
      await setTelemetryStatus(true);
      console.log("✅ Telemetry enabled");
      console.log("📊 Anonymous usage data will be collected locally");
      console.log('ℹ️  Run "theneo-mcp telemetry status" to see what is collected');
      break;
    }

    case "disable": {
      await setTelemetryStatus(false);
      console.log("✅ Telemetry disabled");
      break;
    }

    case "status": {
      await showTelemetryStatus();
      break;
    }

    case "view": {
      await viewTelemetryData();
      break;
    }

    case "clear": {
      const enabled = await getTelemetryStatus();
      const telemetry = new TelemetryService(enabled);
      await telemetry.clearData();
      console.log("✅ Telemetry data cleared");
      break;
    }

    default:
      console.error(`Unknown telemetry subcommand: ${subcommand}`);
      console.error("\nAvailable: enable, disable, status, view, clear");
      process.exit(1);
  }
}

async function setTelemetryStatus(enabled: boolean): Promise<void> {
  await fs.mkdir(CONFIG_DIR, { recursive: true });

  let config: any = {};
  try {
    const data = await fs.readFile(USER_CONFIG_FILE, "utf-8");
    config = JSON.parse(data);
  } catch {
    // File doesn't exist yet
  }

  config.telemetryEnabled = enabled;

  await fs.writeFile(USER_CONFIG_FILE, JSON.stringify(config, null, 2), "utf-8");
}

async function getTelemetryStatus(): Promise<boolean> {
  try {
    const data = await fs.readFile(USER_CONFIG_FILE, "utf-8");
    const config = JSON.parse(data);
    return config.telemetryEnabled || false;
  } catch {
    return false;
  }
}

async function showTelemetryStatus(): Promise<void> {
  const enabled = await getTelemetryStatus();
  const telemetry = new TelemetryService(enabled);

  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("📊 Telemetry Status");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`Status: ${enabled ? "✅ Enabled" : "❌ Disabled"}`);
  console.log(`Storage: ${path.join(os.homedir(), ".theneo-mcp", "telemetry.json")}`);

  const stats = await telemetry.getStats();
  if (stats) {
    console.log("\n📈 Statistics:");
    console.log(`  Total Events: ${stats.totalEvents}`);
    console.log(`  Success Rate: ${(stats.successRate * 100).toFixed(1)}%`);
    console.log(`  Avg Duration: ${stats.averageDuration}ms`);
    console.log("\n🔧 Tool Usage:");
    Object.entries(stats.toolUsage)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .forEach(([tool, count]) => {
        console.log(`  ${tool}: ${count}`);
      });
  } else {
    console.log("\nℹ️  No telemetry data collected yet");
  }

  console.log("\n📋 What We Collect:");
  console.log('  • Tool name (e.g., "theneo_create_project")');
  console.log("  • Execution time (milliseconds)");
  console.log("  • Success/error status (no error details)");
  console.log("  • SDK version, Node version");
  console.log("  • Generic OS type (darwin/linux/win32)");
  console.log("\n🔒 Privacy Guarantees:");
  console.log("  • Completely anonymous - no user identification");
  console.log("  • No API keys, project names, or sensitive data");
  console.log("  • Stored locally only");
  console.log("  • You can view/clear data anytime");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
}

async function viewTelemetryData(): Promise<void> {
  const enabled = await getTelemetryStatus();
  const telemetry = new TelemetryService(enabled);

  const storage = await telemetry.getStoredData();
  if (!storage) {
    console.log("ℹ️  No telemetry data available");
    return;
  }

  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("📊 Telemetry Data");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`Created: ${storage.createdAt}`);
  console.log(`Events: ${storage.eventCount}`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  // Show last 10 events
  const recentEvents = storage.events.slice(-10);
  console.log("Recent Events (last 10):");
  recentEvents.forEach((event, i) => {
    console.log(`\n[${i + 1}] ${event.timestamp}`);
    console.log(`    Tool: ${event.tool}`);
    console.log(`    Duration: ${event.duration_ms}ms`);
    console.log(`    Success: ${event.success ? "✅" : "❌"}`);
    console.log(`    Node: ${event.node_version} | OS: ${event.os_type}`);
  });

  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
}

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

      case "telemetry": {
        const subcommand = argv._[1];
        if (!subcommand) {
          console.error("Error: telemetry command requires a subcommand");
          console.error("\nAvailable: enable, disable, status, view, clear");
          process.exit(1);
        }
        await handleTelemetryCommand(subcommand, argv);
        break;
      }

      default:
        console.error(`Unknown command: ${command}`);
        console.error("\nAvailable commands: server, creds, telemetry");
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

