/**
 * S3 Schema Utilities - Key Generation and Path Helpers
 */

import { BUCKET_SCHEMA, type SubfolderType } from "./types";

/**
 * Generate S3 key for any project resource
 */
export function generateS3Key(
  projectId: string,
  type: SubfolderType,
  filename: string,
  options?: { version?: string; timestamp?: string }
): string {
  const subfolder = BUCKET_SCHEMA.subfolders[type];
  const prefix = `projects/${projectId}/${subfolder}`;

  if (options?.version && type === "builds") {
    return `${prefix}${options.version}/${filename}`;
  }

  if (options?.timestamp && type === "archives") {
    const name = BUCKET_SCHEMA.naming.archive
      .replace("{timestamp}", options.timestamp)
      .replace("{uuid8}", Bun.randomUUIDv7().slice(0, 8));
    return `${prefix}${name}`;
  }

  return `${prefix}${filename}`;
}

/**
 * Parse S3 key to extract project and type info
 */
export function parseS3Key(key: string): {
  projectId: string | null;
  type: SubfolderType | null;
  filename: string;
} {
  const match = key.match(/^projects\/([^/]+)\/([^/]+)\/(.+)$/);

  if (!match) {
    return { projectId: null, type: null, filename: key };
  }

  const [, projectId, folder, filename] = match;

  // Find matching subfolder type
  const type = (Object.entries(BUCKET_SCHEMA.subfolders).find(
    ([, prefix]) => prefix === `${folder}/`
  )?.[0] || null) as SubfolderType | null;

  return { projectId, type, filename };
}

/**
 * Generate project prefix
 */
export function getProjectPrefix(projectId: string): string {
  return `projects/${projectId}/`;
}

/**
 * Generate archived project prefix
 */
export function getArchivedPrefix(projectId: string): string {
  const timestamp = Date.now();
  return `archived/${projectId}_${timestamp}/`;
}

/**
 * Validate project ID format
 */
export function isValidProjectId(projectId: string): boolean {
  return /^proj_[a-z0-9]{8,16}$/.test(projectId);
}

/**
 * Generate a new project ID
 */
export function generateProjectId(): string {
  const uuid = Bun.randomUUIDv7().replace(/-/g, "").slice(0, 12);
  return `proj_${uuid}`;
}

/**
 * Get all subfolder paths for a project
 */
export function getProjectSubfolders(projectId: string): string[] {
  const prefix = getProjectPrefix(projectId);
  return Object.values(BUCKET_SCHEMA.subfolders).map(
    (subfolder) => `${prefix}${subfolder}`
  );
}

/**
 * Format bytes to human readable
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

/**
 * Calculate retention date
 */
export function getRetentionDate(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
}
