/**
 * Privacy-first telemetry service
 * 
 * Principles:
 * - Completely opt-in (disabled by default)
 * - Anonymous - no user identification
 * - Local-first - data stored locally, optionally shared
 * - Transparent - users see exactly what's collected
 * - Minimal - only essential metrics
 */

import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { TelemetryEvent, TelemetryConfig, TelemetryStorage } from './types.js';
import { logger } from '../utils/logger.js';

const DEFAULT_STORAGE_DIR = path.join(os.homedir(), '.theneo-mcp');
const STORAGE_FILE = 'telemetry.json';
const STORAGE_VERSION = '1.0';

export class TelemetryService {
  private config: TelemetryConfig;

  constructor(enabled: boolean = false, endpoint?: string) {
    this.config = {
      enabled,
      endpoint,
      storagePath: path.join(DEFAULT_STORAGE_DIR, STORAGE_FILE),
    };
  }

  /**
   * Check if telemetry is enabled
   */
  isEnabled(): boolean {
    // Check environment variable as well
    if (process.env.THENEO_TELEMETRY_DISABLED === 'true') {
      return false;
    }
    return this.config.enabled;
  }

  /**
   * Record a telemetry event (non-blocking)
   */
  async recordEvent(
    tool: string,
    duration_ms: number,
    success: boolean
  ): Promise<void> {
    if (!this.isEnabled()) {
      return;
    }

    try {
      const event: TelemetryEvent = {
        timestamp: new Date().toISOString(),
        tool,
        duration_ms,
        success,
        sdk_version: this.getSDKVersion(),
        node_version: process.version,
        os_type: this.getOSType(),
      };

      await this.storeEvent(event);
    } catch (error) {
      // Telemetry failures should never affect normal operation
      logger.debug('Failed to record telemetry event', { error });
    }
  }

  /**
   * Get stored telemetry data
   */
  async getStoredData(): Promise<TelemetryStorage | null> {
    try {
      const data = await fs.readFile(this.config.storagePath, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      if ((error as any).code === 'ENOENT') {
        return null;
      }
      throw error;
    }
  }

  /**
   * Clear all stored telemetry data
   */
  async clearData(): Promise<void> {
    try {
      await fs.unlink(this.config.storagePath);
      logger.info('Telemetry data cleared');
    } catch (error) {
      if ((error as any).code !== 'ENOENT') {
        throw error;
      }
    }
  }

  /**
   * Get telemetry statistics
   */
  async getStats(): Promise<{
    totalEvents: number;
    successRate: number;
    toolUsage: Record<string, number>;
    averageDuration: number;
  } | null> {
    const storage = await this.getStoredData();
    if (!storage || storage.events.length === 0) {
      return null;
    }

    const events = storage.events;
    const successCount = events.filter(e => e.success).length;
    const toolUsage = events.reduce((acc, e) => {
      acc[e.tool] = (acc[e.tool] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const averageDuration = events.reduce((sum, e) => sum + e.duration_ms, 0) / events.length;

    return {
      totalEvents: events.length,
      successRate: successCount / events.length,
      toolUsage,
      averageDuration: Math.round(averageDuration),
    };
  }

  /**
   * Store an event locally
   */
  private async storeEvent(event: TelemetryEvent): Promise<void> {
    // Ensure directory exists
    const dir = path.dirname(this.config.storagePath);
    await fs.mkdir(dir, { recursive: true });

    let storage: TelemetryStorage;

    try {
      const existing = await this.getStoredData();
      if (existing) {
        storage = existing;
        storage.events.push(event);
        storage.eventCount = storage.events.length;
      } else {
        storage = {
          version: STORAGE_VERSION,
          createdAt: new Date().toISOString(),
          eventCount: 1,
          events: [event],
        };
      }
    } catch {
      storage = {
        version: STORAGE_VERSION,
        createdAt: new Date().toISOString(),
        eventCount: 1,
        events: [event],
      };
    }

    // Keep only last 1000 events to prevent unbounded growth
    if (storage.events.length > 1000) {
      storage.events = storage.events.slice(-1000);
      storage.eventCount = storage.events.length;
    }

    await fs.writeFile(
      this.config.storagePath,
      JSON.stringify(storage, null, 2),
      'utf-8'
    );
  }

  /**
   * Get SDK version from package.json
   */
  private getSDKVersion(): string {
    try {
      // This will be the Theneo SDK version
      const pkg = require('@theneo/sdk/package.json');
      return pkg.version || 'unknown';
    } catch {
      return 'unknown';
    }
  }

  /**
   * Get generic OS type (no specific details for privacy)
   */
  private getOSType(): 'darwin' | 'linux' | 'win32' | 'other' {
    const platform = os.platform();
    if (platform === 'darwin' || platform === 'linux' || platform === 'win32') {
      return platform;
    }
    return 'other';
  }
}

/**
 * Create a telemetry wrapper for handler functions
 */
export function withTelemetry<T extends (...args: any[]) => Promise<any>>(
  toolName: string,
  handler: T,
  telemetry: TelemetryService
): T {
  return (async (...args: any[]) => {
    const startTime = Date.now();
    let success = true;

    try {
      const result = await handler(...args);
      success = !result.isError;
      return result;
    } catch (error) {
      success = false;
      throw error;
    } finally {
      const duration = Date.now() - startTime;
      // Non-blocking telemetry recording
      telemetry.recordEvent(toolName, duration, success).catch(() => {
        // Silently ignore telemetry errors
      });
    }
  }) as T;
}

