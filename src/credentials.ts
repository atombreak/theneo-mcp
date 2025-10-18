import keytar from "keytar";
import { logger } from "./utils/logger.js";

const SERVICE_NAME = "theneo-mcp";

/**
 * Save API key to OS keychain
 * @param profile - Profile name (e.g., "default", "prod", "staging")
 * @param apiKey - The API key to store
 */
export async function saveKey(profile: string, apiKey: string): Promise<void> {
  try {
    await keytar.setPassword(SERVICE_NAME, profile, apiKey);
    logger.info(`API key saved to keychain for profile: ${profile}`);
  } catch (error) {
    logger.error("Failed to save API key to keychain", { error, profile });
    throw new Error(`Failed to save API key: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Retrieve API key from OS keychain
 * @param profile - Profile name
 * @returns The API key or null if not found
 */
export async function getKey(profile: string): Promise<string | null> {
  try {
    const key = await keytar.getPassword(SERVICE_NAME, profile);
    if (key) {
      logger.debug(`Retrieved API key from keychain for profile: ${profile}`);
    }
    return key;
  } catch (error) {
    logger.error("Failed to retrieve API key from keychain", { error, profile });
    return null;
  }
}

/**
 * Delete API key from OS keychain
 * @param profile - Profile name
 */
export async function deleteKey(profile: string): Promise<boolean> {
  try {
    const result = await keytar.deletePassword(SERVICE_NAME, profile);
    if (result) {
      logger.info(`API key deleted from keychain for profile: ${profile}`);
    } else {
      logger.warn(`No API key found in keychain for profile: ${profile}`);
    }
    return result;
  } catch (error) {
    logger.error("Failed to delete API key from keychain", { error, profile });
    throw new Error(`Failed to delete API key: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * List all stored profiles in keychain
 * @returns Array of profile names
 */
export async function listProfiles(): Promise<string[]> {
  try {
    const credentials = await keytar.findCredentials(SERVICE_NAME);
    return credentials.map((cred) => cred.account);
  } catch (error) {
    logger.error("Failed to list profiles from keychain", { error });
    return [];
  }
}

/**
 * Check if keytar is available on this system
 */
export async function isKeychainAvailable(): Promise<boolean> {
  try {
    // Try a simple operation to see if keychain works
    await keytar.findCredentials(SERVICE_NAME);
    return true;
  } catch {
    return false;
  }
}

