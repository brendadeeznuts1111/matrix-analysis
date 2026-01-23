/**
 * Multi-Project S3 Architecture - Type Definitions
 */

export interface Project {
  id: string;
  name: string;
  owner: string;
  bucket: string;
  prefix: string;
  createdAt: string;
  status?: "active" | "archived";
  archivedAt?: string;
  archivedPrefix?: string;
  config: ProjectConfig;
}

export interface ProjectConfig {
  storageQuota: number;      // bytes
  maxArchives: number;
  retentionDays: number;
  allowedFileTypes: string[];
}

export interface ProjectUsage {
  totalSize: number;
  fileCount: number;
  archiveCount: number;
  buildCount: number;
  logCount: number;
  quota: number;
  usagePercentage: number;
}

export interface ArchiveResult {
  success: boolean;
  key: string;
  url: string;
  size: number;
  duration: number;
  checksum: string;
  metrics: {
    archiveCreation: string;
    writeTime: string;
    throughput: string;
  };
}

export interface ArchiveListing {
  key: string;
  size: number;
  lastModified: Date;
  checksum: string;
  metadata: {
    fileCount: number;
    description: string;
    projectId: string;
    created: string;
  };
}

export interface ProjectInfo {
  projectId: string;
  totalObjects: number;
  totalSize: number;
  storageByType: Record<string, number>;
  prefixes: string[];
  createdAt: string;
}

export const BUCKET_SCHEMA = {
  bucketName: "company-archives",

  prefixes: {
    projects: "projects/{projectId}/",
    archived: "archived/{projectId}_{timestamp}/",
    shared: "shared/{resourceType}/",
  },

  subfolders: {
    configs: "configs/",
    archives: "archives/",
    builds: "builds/",
    logs: "logs/",
    assets: "assets/",
    datasets: "datasets/",
    exports: "exports/",
    temp: "temp/",
  },

  naming: {
    archive: "archive_{timestamp}_{uuid8}.tar.gz",
    build: "build_{version}_{commitSha}.zip",
    config: "{environment}.jsonc",
    log: "{date}_{service}.log",
  },

  lifecycle: {
    projects: {
      "temp/": { expirationDays: 1 },
      "logs/": { transitionToGlacierDays: 30 },
      "archives/": { expirationDays: 365 },
    },
  },
} as const;

export type SubfolderType = keyof typeof BUCKET_SCHEMA.subfolders;
