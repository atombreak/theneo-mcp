/**
 * Telemetry types
 */

export interface TelemetryEvent {
  /** ISO timestamp */
  timestamp: string;
  /** Tool name that was executed */
  tool: string;
  /** Execution duration in milliseconds */
  duration_ms: number;
  /** Whether the tool execution succeeded */
  success: boolean;
  /** Theneo SDK version */
  sdk_version: string;
  /** Node.js version */
  node_version: string;
  /** Operating system type (generic, no details) */
  os_type: 'darwin' | 'linux' | 'win32' | 'other';
}

export interface TelemetryConfig {
  /** Whether telemetry is enabled (opt-in) */
  enabled: boolean;
  /** Optional endpoint to send aggregated data */
  endpoint?: string;
  /** Local storage path */
  storagePath: string;
}

export interface TelemetryStorage {
  /** Version of the storage format */
  version: string;
  /** When the storage was created */
  createdAt: string;
  /** Total number of events recorded */
  eventCount: number;
  /** Individual events */
  events: TelemetryEvent[];
}

