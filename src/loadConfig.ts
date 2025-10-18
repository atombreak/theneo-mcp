import fs from "fs";
import path from "path";
import os from "os";
import * as dotenv from "dotenv";
import * as yaml from "yaml";
import minimist from "minimist";
import { ConfigSchema, AppConfig, PartialConfig } from "./config.js";
import { getKey, isKeychainAvailable } from "./credentials.js";
import { logger } from "./utils/logger.js";

/**
 * Read file if it exists, return undefined otherwise
 */
function readIfExists(filePath: string): string | undefined {
  try {
    return fs.readFileSync(filePath, "utf8");
  } catch {
    return undefined;
  }
}

/**
 * Load and parse RC file (project or user config)
 * Supports both JSON and YAML formats
 */
function loadRcObject(): PartialConfig {
  // Try project RC files first
  const projectRcFiles = [".theneo-mcp.json", ".theneo-mcp.yaml", ".theneo-mcp.yml"];

  for (const file of projectRcFiles) {
    if (fs.existsSync(file)) {
      const content = readIfExists(file);
      if (content) {
        try {
          const parsed = file.endsWith(".json") ? JSON.parse(content) : yaml.parse(content);
          logger.debug(`Loaded project RC file: ${file}`);
          return parsed;
        } catch (error) {
          logger.warn(`Failed to parse RC file ${file}`, { error });
        }
      }
    }
  }

  // Try user config directory (XDG standard)
  const xdgConfigHome = process.env.XDG_CONFIG_HOME || path.join(os.homedir(), ".config");
  const userConfigDir = path.join(xdgConfigHome, "theneo-mcp");
  const userConfigFiles = ["config.json", "config.yaml", "config.yml"];

  for (const file of userConfigFiles) {
    const filePath = path.join(userConfigDir, file);
    if (fs.existsSync(filePath)) {
      const content = readIfExists(filePath);
      if (content) {
        try {
          const parsed = file.endsWith(".json") ? JSON.parse(content) : yaml.parse(content);
          logger.debug(`Loaded user config file: ${filePath}`);
          return parsed;
        } catch (error) {
          logger.warn(`Failed to parse config file ${filePath}`, { error });
        }
      }
    }
  }

  return {};
}

/**
 * Parse CLI arguments
 */
function parseCliArgs(): PartialConfig {
  const argv = minimist(process.argv.slice(2));

  const config: PartialConfig = {};

  if (argv.profile) config.profile = String(argv.profile);
  if (argv.apiKey) config.apiKey = String(argv.apiKey);
  if (argv.baseApiUrl) config.baseApiUrl = String(argv.baseApiUrl);
  if (argv.baseAppUrl) config.baseAppUrl = String(argv.baseAppUrl);

  return config;
}

/**
 * Load configuration from environment variables
 */
function loadEnvConfig(): PartialConfig {
  const config: PartialConfig = {};

  if (process.env.THENEO_API_KEY) config.apiKey = process.env.THENEO_API_KEY;
  if (process.env.THENEO_BASE_API_URL) config.baseApiUrl = process.env.THENEO_BASE_API_URL;
  if (process.env.THENEO_BASE_APP_URL) config.baseAppUrl = process.env.THENEO_BASE_APP_URL;
  if (process.env.THENEO_PROFILE) config.profile = process.env.THENEO_PROFILE;

  return config;
}

/**
 * Merge configuration objects with precedence
 * Later sources override earlier ones
 */
function mergeConfigs(...configs: PartialConfig[]): PartialConfig {
  const result: PartialConfig = {};

  for (const config of configs) {
    if (config.profile !== undefined) result.profile = config.profile;
    if (config.apiKey !== undefined) result.apiKey = config.apiKey;
    if (config.baseApiUrl !== undefined) result.baseApiUrl = config.baseApiUrl;
    if (config.baseAppUrl !== undefined) result.baseAppUrl = config.baseAppUrl;
  }

  return result;
}

/**
 * Load configuration from all sources with precedence
 * 
 * Precedence order (highest to lowest):
 * 1. CLI flags (--profile, --apiKey, etc.)
 * 2. Environment variables (THENEO_API_KEY, etc.)
 * 3. Project RC file (.theneo-mcp.{json,yaml,yml})
 * 4. User config (~/.config/theneo-mcp/config.{json,yaml})
 * 5. OS keychain (for API key only)
 * 6. .env file (dev only)
 * 
 * @returns Validated configuration object
 */
export async function loadConfig(): Promise<AppConfig> {
  // 1. Load .env file (dev only, lowest priority)
  dotenv.config();

  // 2. Parse CLI arguments
  const cliConfig = parseCliArgs();
  logger.debug("CLI config loaded", { hasApiKey: !!cliConfig.apiKey });

  // 3. Load environment variables
  const envConfig = loadEnvConfig();
  logger.debug("Environment config loaded", { hasApiKey: !!envConfig.apiKey });

  // 4. Load RC files (project + user)
  const rcConfig = loadRcObject();
  logger.debug("RC config loaded", { hasApiKey: !!rcConfig.apiKey });

  // 5. Determine profile (needed for keychain lookup)
  const profile = cliConfig.profile || envConfig.profile || rcConfig.profile || "default";

  // 6. Handle profile-specific config from RC
  let profileConfig: PartialConfig = {};
  if (rcConfig && typeof rcConfig === "object" && "profiles" in rcConfig) {
    const profiles = rcConfig.profiles as Record<string, PartialConfig>;
    if (profiles[profile]) {
      profileConfig = profiles[profile];
      logger.debug(`Profile-specific config loaded: ${profile}`);
    }
  }

  // 7. Try to load API key from keychain if not already set
  let keychainApiKey: string | undefined;
  const hasApiKey = cliConfig.apiKey || envConfig.apiKey || profileConfig.apiKey || rcConfig.apiKey;

  if (!hasApiKey) {
    const keychainAvailable = await isKeychainAvailable();
    if (keychainAvailable) {
      const key = await getKey(profile);
      if (key) {
        keychainApiKey = key;
        logger.debug("API key loaded from keychain");
      }
    } else {
      logger.debug("Keychain not available on this system");
    }
  }

  // 8. Merge all configs with precedence (last wins)
  const merged = mergeConfigs(
    { profile }, // default profile
    rcConfig, // user/project RC
    profileConfig, // profile-specific block
    { apiKey: keychainApiKey }, // keychain
    envConfig, // environment
    cliConfig // CLI (highest priority)
  );

  // 9. Validate and return
  try {
    const validated = ConfigSchema.parse(merged);
    logger.info("Configuration loaded successfully", {
      profile: validated.profile,
      hasApiKey: !!validated.apiKey,
      baseApiUrl: validated.baseApiUrl,
      baseAppUrl: validated.baseAppUrl,
    });
    return validated;
  } catch (error) {
    logger.error("Configuration validation failed", { error });
    throw error;
  }
}

/**
 * Get a helpful error message when API key is missing
 */
export function getMissingApiKeyHelp(): string {
  return `
API key not configured. Please provide your Theneo API key using one of these methods:

1. Environment variable:
   export THENEO_API_KEY=your_api_key

2. OS Keychain (recommended for local development):
   theneo-mcp creds save --profile default --apiKey your_api_key

3. Project config file (.theneo-mcp.json or .theneo-mcp.yaml):
   {
     "apiKey": "your_api_key"
   }

4. User config file (~/.config/theneo-mcp/config.json):
   {
     "apiKey": "your_api_key"
   }

5. CLI flag:
   theneo-mcp --apiKey your_api_key

Get your API key from: https://app.theneo.io/

Note: Never commit API keys to git. Use environment variables or keychain for secure storage.
`.trim();
}

