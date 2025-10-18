import { z } from "zod";

/**
 * Configuration schema for Theneo MCP server
 * Validates all configuration options at startup
 */
export const ConfigSchema = z.object({
  /**
   * Theneo API key (required for API operations)
   * Can be provided via env, keychain, or config files
   */
  apiKey: z
    .string()
    .min(1, "THENEO_API_KEY is required")
    .optional()
    .describe("Theneo API key"),

  /**
   * Base URL for Theneo API
   */
  baseApiUrl: z
    .string()
    .url("THENEO_BASE_API_URL must be a valid URL")
    .default("https://api.theneo.io")
    .describe("Theneo API base URL"),

  /**
   * Base URL for Theneo web application
   */
  baseAppUrl: z
    .string()
    .url("THENEO_BASE_APP_URL must be a valid URL")
    .default("https://app.theneo.io")
    .describe("Theneo app base URL"),

  /**
   * Configuration profile name
   * Allows for multi-environment setups (dev, staging, prod)
   */
  profile: z.string().default("default").describe("Configuration profile name"),
});

export type AppConfig = z.infer<typeof ConfigSchema>;

/**
 * Validates the provided configuration object
 * @throws {z.ZodError} if validation fails
 */
export function validateConfig(config: unknown): AppConfig {
  return ConfigSchema.parse(config);
}

/**
 * Partial configuration schema for merging sources
 */
export type PartialConfig = Partial<AppConfig>;

