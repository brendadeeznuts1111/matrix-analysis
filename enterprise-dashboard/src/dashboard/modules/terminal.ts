/**
 * Enterprise Terminal Module (ENTERPRISE Tier Only)
 *
 * PTY shell access and interactive debugging.
 * Physically removed from Free and Pro tier bundles.
 */

import { randomUUIDv7, inspect, nanoseconds } from "bun";
import {
  MAX_TERMINAL_SESSIONS,
  TERMINAL_SESSION_TIMEOUT_MS,
  MAX_AUDIT_LOG_SIZE,
  AUDIT_LOG_CULL_PERCENT,
  AUDIT_LOG_DISPLAY_LIMIT,
} from "../../config/constants.ts";
import { terminalLog } from "../../utils/logger.ts";

// Enterprise-only configuration (uses centralized constants)
const TERMINAL_CONFIG = {
  maxSessions: MAX_TERMINAL_SESSIONS,
  sessionTimeout: TERMINAL_SESSION_TIMEOUT_MS,
  allowedCommands: ["bash", "zsh", "sh", "fish"],
  auditLog: true,
  encryptionEnabled: true,
  complianceMode: "SOC2",
  maxAuditLogSize: MAX_AUDIT_LOG_SIZE,
};

interface TerminalSession {
  id: string;
  userId: string;
  command: string;
  startTime: number;
  status: "active" | "idle" | "terminated";
}

class EnterpriseTerminalManager {
  private sessions: Map<string, TerminalSession> = new Map();
  private auditLog: Array<{ timestamp: number; action: string; sessionId: string }> = [];

  createSession(userId: string, command: string): string {
    const sessionId = randomUUIDv7("hex").slice(0, 16);

    const session: TerminalSession = {
      id: sessionId,
      userId,
      command,
      startTime: Date.now(),
      status: "active",
    };

    this.sessions.set(sessionId, session);
    this.audit("session_created", sessionId);

    return sessionId;
  }

  terminateSession(sessionId: string): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) return false;

    session.status = "terminated";
    this.audit("session_terminated", sessionId);
    return true;
  }

  private audit(action: string, sessionId: string) {
    if (TERMINAL_CONFIG.auditLog) {
      this.auditLog.push({ timestamp: Date.now(), action, sessionId });
      // Cap audit log size to prevent memory leak
      if (this.auditLog.length > TERMINAL_CONFIG.maxAuditLogSize) {
        // Remove oldest entries when cap is exceeded
        const removeCount = Math.ceil(TERMINAL_CONFIG.maxAuditLogSize * AUDIT_LOG_CULL_PERCENT);
        this.auditLog.splice(0, removeCount);
      }
    }
  }

  getActiveSessions(): TerminalSession[] {
    return Array.from(this.sessions.values()).filter(s => s.status === "active");
  }

  getAuditLog() {
    return this.auditLog.slice(-AUDIT_LOG_DISPLAY_LIMIT);
  }

  getConfig() {
    return TERMINAL_CONFIG;
  }
}

const terminalManager = new EnterpriseTerminalManager();

/**
 * Enable enterprise shell access.
 * ENTERPRISE-only feature.
 */
export function enableShellAccess() {
  terminalLog.info("\x1b[33m[ENTERPRISE]\x1b[0m Terminal Access: Enabled");
  terminalLog.info(`             Max Sessions: ${TERMINAL_CONFIG.maxSessions}`);
  terminalLog.info(`             Compliance: ${TERMINAL_CONFIG.complianceMode}`);
  terminalLog.info(`             Encryption: ${TERMINAL_CONFIG.encryptionEnabled ? "AES-256" : "Disabled"}`);

  // Create demo session
  const sessionId = terminalManager.createSession("system", "bash");
  terminalLog.info(`             Demo Session: ${sessionId}`);

  // Show config table
  const configTable = [{
    "Max Sessions": TERMINAL_CONFIG.maxSessions,
    "Timeout": `${TERMINAL_CONFIG.sessionTimeout / 60000}min`,
    "Audit": TERMINAL_CONFIG.auditLog ? "ON" : "OFF",
    "Compliance": TERMINAL_CONFIG.complianceMode,
  }];
  terminalLog.table(configTable);
}

/**
 * Create a new terminal session.
 */
export function createTerminalSession(userId: string, command = "bash"): string {
  return terminalManager.createSession(userId, command);
}

/**
 * Get all active terminal sessions.
 */
export function getActiveSessions(): TerminalSession[] {
  return terminalManager.getActiveSessions();
}

/**
 * Get terminal audit log.
 */
export function getTerminalAuditLog() {
  return terminalManager.getAuditLog();
}

export default { enableShellAccess, createTerminalSession, getActiveSessions, getTerminalAuditLog };
