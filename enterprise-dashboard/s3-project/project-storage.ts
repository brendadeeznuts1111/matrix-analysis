/**
 * Project Storage Service
 * Handles archive creation, listing, and retrieval
 * Uses local filesystem with Bun.Archive for tar.gz support
 */

import { join } from "path";
import type { ArchiveResult, ArchiveListing, ProjectInfo, SubfolderType } from "./types";
import { BUCKET_SCHEMA } from "./types";
import { generateS3Key, getProjectPrefix, formatBytes } from "./s3-schema";

export class ProjectStorage {
  private basePath: string;
  private projectId: string;

  constructor(projectId: string, basePath: string) {
    this.projectId = projectId;
    this.basePath = basePath;
  }

  /**
   * Get full path for project prefix
   */
  private getProjectPath(): string {
    return join(this.basePath, getProjectPrefix(this.projectId));
  }

  /**
   * Upload files as a compressed archive
   */
  async uploadArchive(
    files: Record<string, string | Uint8Array | Blob>,
    options?: {
      description?: string;
      tags?: Record<string, string>;
      retentionDays?: number;
    }
  ): Promise<ArchiveResult> {
    const start = performance.now();

    // Convert files to archive format
    const archiveFiles: Record<string, Uint8Array> = {};
    for (const [name, content] of Object.entries(files)) {
      if (typeof content === "string") {
        archiveFiles[name] = new TextEncoder().encode(content);
      } else if (content instanceof Blob) {
        archiveFiles[name] = new Uint8Array(await content.arrayBuffer());
      } else {
        archiveFiles[name] = content;
      }
    }

    const archiveCreationStart = performance.now();

    // Create tar archive using Bun.Archive, then compress with gzip
    const archive = new Bun.Archive(archiveFiles);
    const tarData = await archive.bytes();
    const archiveData = Bun.gzipSync(tarData, { level: 6 });

    const archiveCreationTime = performance.now() - archiveCreationStart;

    // Generate S3 key with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const key = generateS3Key(this.projectId, "archives", "", { timestamp });

    // Calculate checksum
    const checksum = Bun.hash.crc32(archiveData).toString(16).padStart(8, "0");

    // Write to filesystem
    const writeStart = performance.now();
    const fullPath = join(this.basePath, key);

    // Ensure directory exists
    const dir = fullPath.substring(0, fullPath.lastIndexOf("/"));
    await Bun.$`mkdir -p ${dir}`.quiet();

    await Bun.write(fullPath, archiveData);

    const writeTime = performance.now() - writeStart;

    // Write metadata sidecar file
    const metadata = {
      projectId: this.projectId,
      fileCount: Object.keys(files).length,
      totalSize: archiveData.byteLength,
      description: options?.description || "",
      created: new Date().toISOString(),
      retention: options?.retentionDays || 30,
      checksum,
      tags: options?.tags || {},
      files: Object.keys(files),
    };

    await Bun.write(`${fullPath}.meta.json`, JSON.stringify(metadata, null, 2));

    const duration = performance.now() - start;
    const throughput =
      (archiveData.byteLength / duration) * 1000 / 1024 / 1024;

    return {
      success: true,
      key,
      url: `file://${fullPath}`,
      size: archiveData.byteLength,
      duration,
      checksum,
      metrics: {
        archiveCreation: `${archiveCreationTime.toFixed(2)}ms`,
        writeTime: `${writeTime.toFixed(2)}ms`,
        throughput: `${throughput.toFixed(2)} MB/s`,
      },
    };
  }

  /**
   * List all archives in the project
   */
  async listArchives(options?: {
    limit?: number;
    offset?: number;
    sort?: "newest" | "oldest" | "size";
  }): Promise<ArchiveListing[]> {
    const archivesPath = join(this.getProjectPath(), "archives");
    const glob = new Bun.Glob("*.tar.gz");

    const archives: ArchiveListing[] = [];

    for await (const file of glob.scan({ cwd: archivesPath })) {
      const fullPath = join(archivesPath, file);
      const metaPath = `${fullPath}.meta.json`;

      const fileHandle = Bun.file(fullPath);
      const metaFile = Bun.file(metaPath);

      // Get actual file size
      const fileSize = fileHandle.size;
      const fileModified = fileHandle.lastModified;

      let metadata: any = {
        fileCount: 0,
        description: "",
        projectId: this.projectId,
        created: new Date().toISOString(),
      };

      if (await metaFile.exists()) {
        metadata = await metaFile.json();
      }

      // Calculate checksum if not in metadata
      let checksum = metadata.checksum;
      if (!checksum) {
        const bytes = await fileHandle.bytes();
        checksum = Bun.hash.crc32(bytes).toString(16).padStart(8, "0");
      }

      archives.push({
        key: `projects/${this.projectId}/archives/${file}`,
        size: fileSize,
        lastModified: new Date(fileModified),
        checksum,
        metadata: {
          fileCount: metadata.fileCount,
          description: metadata.description,
          projectId: metadata.projectId,
          created: metadata.created,
        },
      });
    }

    // Apply sorting
    const sorted = archives.sort((a, b) => {
      switch (options?.sort || "newest") {
        case "newest":
          return b.lastModified.getTime() - a.lastModified.getTime();
        case "oldest":
          return a.lastModified.getTime() - b.lastModified.getTime();
        case "size":
          return b.size - a.size;
        default:
          return 0;
      }
    });

    // Apply pagination
    const offset = options?.offset || 0;
    const limit = options?.limit || 50;

    return sorted.slice(offset, offset + limit);
  }

  /**
   * Get archive contents without extracting
   */
  async getArchiveContents(key: string): Promise<string[]> {
    const fullPath = join(this.basePath, key);
    const metaPath = `${fullPath}.meta.json`;

    const metaFile = Bun.file(metaPath);
    if (await metaFile.exists()) {
      const meta = await metaFile.json();
      return meta.files || [];
    }

    return [];
  }

  /**
   * Extract archive to specified directory
   */
  async extractArchive(key: string, outputDir: string): Promise<string[]> {
    const fullPath = join(this.basePath, key);
    const file = Bun.file(fullPath);

    if (!(await file.exists())) {
      throw new Error(`Archive not found: ${key}`);
    }

    // Create output directory
    await Bun.$`mkdir -p ${outputDir}`.quiet();

    // Extract using tar command (since Bun.Archive doesn't have extract yet)
    await Bun.$`tar -xzf ${fullPath} -C ${outputDir}`.quiet();

    // List extracted files
    const glob = new Bun.Glob("**/*");
    const files: string[] = [];

    for await (const f of glob.scan({ cwd: outputDir, onlyFiles: true })) {
      files.push(f);
    }

    return files;
  }

  /**
   * Delete an archive
   */
  async deleteArchive(key: string): Promise<boolean> {
    const fullPath = join(this.basePath, key);
    const metaPath = `${fullPath}.meta.json`;

    const file = Bun.file(fullPath);
    if (!(await file.exists())) {
      return false;
    }

    await Bun.$`rm -f ${fullPath} ${metaPath}`.quiet();
    return true;
  }

  /**
   * Get project storage info
   */
  async getProjectInfo(): Promise<ProjectInfo> {
    const projectPath = this.getProjectPath();
    const glob = new Bun.Glob("**/*");

    const storageByType: Record<string, number> = {};
    let totalObjects = 0;
    let totalSize = 0;
    let earliestDate = new Date();

    for await (const file of glob.scan({ cwd: projectPath, onlyFiles: true })) {
      const fullPath = join(projectPath, file);
      const stat = Bun.file(fullPath);
      const size = stat.size;

      totalObjects++;
      totalSize += size;

      // Categorize by type
      const type = this.getObjectType(file);
      storageByType[type] = (storageByType[type] || 0) + size;

      // Track earliest file
      const modified = new Date(stat.lastModified);
      if (modified < earliestDate) {
        earliestDate = modified;
      }
    }

    return {
      projectId: this.projectId,
      totalObjects,
      totalSize,
      storageByType,
      prefixes: Object.keys(BUCKET_SCHEMA.subfolders),
      createdAt: earliestDate.toISOString(),
    };
  }

  /**
   * Determine object type from path
   */
  private getObjectType(path: string): string {
    for (const [type, prefix] of Object.entries(BUCKET_SCHEMA.subfolders)) {
      if (path.startsWith(prefix.replace("/", ""))) {
        return type;
      }
    }
    return "other";
  }

  /**
   * Write file to project storage
   */
  async writeFile(
    type: SubfolderType,
    filename: string,
    content: string | Uint8Array
  ): Promise<string> {
    const key = generateS3Key(this.projectId, type, filename);
    const fullPath = join(this.basePath, key);

    // Ensure directory exists
    const dir = fullPath.substring(0, fullPath.lastIndexOf("/"));
    await Bun.$`mkdir -p ${dir}`.quiet();

    await Bun.write(fullPath, content);
    return key;
  }

  /**
   * Read file from project storage
   */
  async readFile(type: SubfolderType, filename: string): Promise<string> {
    const key = generateS3Key(this.projectId, type, filename);
    const fullPath = join(this.basePath, key);

    const file = Bun.file(fullPath);
    if (!(await file.exists())) {
      throw new Error(`File not found: ${key}`);
    }

    return await file.text();
  }

  /**
   * Print storage info table
   */
  async printStorageInfo(): Promise<void> {
    const info = await this.getProjectInfo();

    const tableData = Object.entries(info.storageByType).map(
      ([type, size]) => ({
        Type: type,
        Size: formatBytes(size),
        Percentage: `${((size / info.totalSize) * 100).toFixed(1)}%`,
        Files: "—",
      })
    );

    console.log(`\nProject Storage: ${this.projectId}\n`);
    console.log(`Total: ${formatBytes(info.totalSize)} (${info.totalObjects} objects)\n`);
    console.log(Bun.inspect.table(tableData, { colors: true }));
  }
}
