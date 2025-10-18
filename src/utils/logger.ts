/**
 * Structured logging utility with automatic secret masking
 * Logs to stderr to avoid interfering with MCP protocol (stdout)
 */

type LogLevel = "debug" | "info" | "warn" | "error";

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  data?: unknown;
}

/**
 * Patterns that might indicate secrets
 * These will be masked in log output
 */
const SECRET_PATTERNS = [
  /api[_-]?key["\s:=]+([a-zA-Z0-9_\-]+)/gi,
  /token["\s:=]+([a-zA-Z0-9_\-\.]+)/gi,
  /bearer\s+([a-zA-Z0-9_\-\.]+)/gi,
  /password["\s:=]+([^\s"']+)/gi,
  /secret["\s:=]+([^\s"']+)/gi,
  /(sk|pk)_[a-z]+_[a-zA-Z0-9]{20,}/gi,
];

/**
 * Mask sensitive data in strings
 */
function maskSecrets(text: string): string {
  let masked = text;
  for (const pattern of SECRET_PATTERNS) {
    masked = masked.replace(pattern, (match) => {
      // Keep first 4 and last 4 chars visible if long enough
      if (match.length > 16) {
        const parts = match.split(/[:=\s]+/);
        if (parts.length > 1) {
          const value = parts[parts.length - 1];
          const prefix = match.substring(0, match.indexOf(value));
          if (value.length > 8) {
            return `${prefix}${value.substring(0, 4)}${"*".repeat(value.length - 8)}${value.substring(value.length - 4)}`;
          }
        }
      }
      return match.replace(/[a-zA-Z0-9]/g, "*");
    });
  }
  return masked;
}

/**
 * Mask secrets in objects (recursive)
 */
function maskSecretsInObject(obj: unknown): unknown {
  if (typeof obj === "string") {
    return maskSecrets(obj);
  }
  if (Array.isArray(obj)) {
    return obj.map(maskSecretsInObject);
  }
  if (obj && typeof obj === "object") {
    const masked: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      // Explicitly mask known secret fields
      const lowerKey = key.toLowerCase();
      if (
        lowerKey.includes("key") ||
        lowerKey.includes("token") ||
        lowerKey.includes("secret") ||
        lowerKey.includes("password")
      ) {
        masked[key] = typeof value === "string" && value.length > 4 ? "***REDACTED***" : value;
      } else {
        masked[key] = maskSecretsInObject(value);
      }
    }
    return masked;
  }
  return obj;
}

/**
 * Format and write log entry to stderr
 */
function writeLog(entry: LogEntry): void {
  const maskedEntry = {
    ...entry,
    message: maskSecrets(entry.message),
    data: entry.data ? maskSecretsInObject(entry.data) : undefined,
  };

  // Write to stderr (stdout is reserved for MCP protocol)
  console.error(JSON.stringify(maskedEntry));
}

export const logger = {
  debug(message: string, data?: unknown): void {
    if (process.env.DEBUG) {
      writeLog({
        level: "debug",
        message,
        timestamp: new Date().toISOString(),
        data,
      });
    }
  },

  info(message: string, data?: unknown): void {
    writeLog({
      level: "info",
      message,
      timestamp: new Date().toISOString(),
      data,
    });
  },

  warn(message: string, data?: unknown): void {
    writeLog({
      level: "warn",
      message,
      timestamp: new Date().toISOString(),
      data,
    });
  },

  error(message: string, data?: unknown): void {
    writeLog({
      level: "error",
      message,
      timestamp: new Date().toISOString(),
      data,
    });
  },
};

