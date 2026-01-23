/**
 * Project Manager Service
 * Handles project lifecycle: create, archive, usage tracking
 * Uses local filesystem as mock S3 storage
 */

import { join } from "path";
import type { Project, ProjectConfig, ProjectUsage } from "./types";
import { BUCKET_SCHEMA } from "./types";
import {
  generateProjectId,
  getProjectPrefix,
  getArchivedPrefix,
  getProjectSubfolders,
  formatBytes,
} from "./s3-schema";

export class ProjectManager {
  private basePath: string;
  private projects: Map<string, Project> = new Map();

  constructor(basePath: string) {
    this.basePath = basePath;
  }

  /**
   * Create a new project with full directory structure
   */
  async createProject(
    name: string,
    owner: string,
    config?: Partial<ProjectConfig>
  ): Promise<Project> {
    const projectId = generateProjectId();
    const prefix = getProjectPrefix(projectId);

    // Initialize project structure
    await this.initializeProjectStructure(projectId);

    // Create project metadata
    const project: Project = {
      id: projectId,
      name,
      owner,
      bucket: BUCKET_SCHEMA.bucketName,
      prefix,
      createdAt: new Date().toISOString(),
      status: "active",
      config: {
        storageQuota: config?.storageQuota ?? 100 * 1024 * 1024 * 1024, // 100GB
        maxArchives: config?.maxArchives ?? 1000,
        retentionDays: config?.retentionDays ?? 30,
        allowedFileTypes: config?.allowedFileTypes ?? [
          ".tar.gz",
          ".zip",
          ".json",
          ".log",
        ],
      },
    };

    // Store project metadata
    this.projects.set(projectId, project);

    // Write project.json
    const projectPath = join(this.basePath, prefix);
    await Bun.write(
      join(projectPath, "project.json"),
      JSON.stringify(project, null, 2)
    );

    // Write default config
    const defaultConfig = {
      project: { name, owner },
      features: { archives: true, analytics: true },
      limits: { maxFileSize: 100 * 1024 * 1024 },
      created: project.createdAt,
    };

    await Bun.write(
      join(projectPath, "configs/production.jsonc"),
      JSON.stringify(defaultConfig, null, 2)
    );

    return project;
  }

  /**
   * Initialize project directory structure
   */
  private async initializeProjectStructure(projectId: string): Promise<void> {
    const subfolders = getProjectSubfolders(projectId);

    for (const subfolder of subfolders) {
      const fullPath = join(this.basePath, subfolder);
      await Bun.$`mkdir -p ${fullPath}`.quiet();

      // Create folder marker
      await Bun.write(join(fullPath, ".folder-marker"), "");
    }
  }

  /**
   * Get project by ID
   */
  async getProject(projectId: string): Promise<Project | null> {
    // Check in-memory cache
    if (this.projects.has(projectId)) {
      return this.projects.get(projectId)!;
    }

    // Try to load from disk
    const projectPath = join(
      this.basePath,
      getProjectPrefix(projectId),
      "project.json"
    );
    const file = Bun.file(projectPath);

    if (await file.exists()) {
      const project = (await file.json()) as Project;
      this.projects.set(projectId, project);
      return project;
    }

    return null;
  }

  /**
   * List all projects
   */
  async listProjects(): Promise<Project[]> {
    const projectsDir = join(this.basePath, "projects");

    // Check if projects directory exists using shell
    const result = await Bun.$`test -d ${projectsDir} && echo "exists"`.quiet().nothrow();
    if (result.exitCode !== 0) {
      return [];
    }

    const glob = new Bun.Glob("**/project.json");
    const projects: Project[] = [];

    for await (const file of glob.scan({ cwd: projectsDir, onlyFiles: true })) {
      const projectPath = join(projectsDir, file);
      try {
        const project = (await Bun.file(projectPath).json()) as Project;
        projects.push(project);
        this.projects.set(project.id, project);
      } catch {
        // Skip invalid project.json files
      }
    }

    return projects;
  }

  /**
   * Archive a project (move to archived prefix)
   */
  async archiveProject(projectId: string): Promise<void> {
    const project = await this.getProject(projectId);
    if (!project) {
      throw new Error(`Project ${projectId} not found`);
    }

    const oldPath = join(this.basePath, project.prefix);
    const newPrefix = getArchivedPrefix(projectId);
    const newPath = join(this.basePath, newPrefix);

    // Ensure archived directory exists
    const archivedDir = join(this.basePath, "archived");
    await Bun.$`mkdir -p ${archivedDir}`.quiet();

    // Copy to archived location
    await Bun.$`cp -r ${oldPath} ${newPath}`.quiet();

    // Remove original
    await Bun.$`rm -rf ${oldPath}`.quiet();

    // Update project metadata
    project.status = "archived";
    project.archivedAt = new Date().toISOString();
    project.archivedPrefix = newPrefix;

    // Write updated metadata to archived location
    await Bun.write(
      join(newPath, "project.json"),
      JSON.stringify(project, null, 2)
    );

    this.projects.set(projectId, project);
  }

  /**
   * Calculate project storage usage
   */
  async getProjectUsage(projectId: string): Promise<ProjectUsage> {
    const project = await this.getProject(projectId);
    if (!project) {
      throw new Error(`Project ${projectId} not found`);
    }

    const projectPath = join(this.basePath, project.prefix);
    const glob = new Bun.Glob("**/*");

    let totalSize = 0;
    let fileCount = 0;
    let archiveCount = 0;
    let buildCount = 0;
    let logCount = 0;

    for await (const file of glob.scan({
      cwd: projectPath,
      onlyFiles: true,
    })) {
      const filePath = join(projectPath, file);
      const stat = Bun.file(filePath);
      const size = stat.size;

      totalSize += size;
      fileCount++;

      if (file.startsWith("archives/")) archiveCount++;
      if (file.startsWith("builds/")) buildCount++;
      if (file.startsWith("logs/")) logCount++;
    }

    return {
      totalSize,
      fileCount,
      archiveCount,
      buildCount,
      logCount,
      quota: project.config.storageQuota,
      usagePercentage: (totalSize / project.config.storageQuota) * 100,
    };
  }

  /**
   * Delete a project permanently
   */
  async deleteProject(projectId: string): Promise<void> {
    const project = await this.getProject(projectId);
    if (!project) {
      throw new Error(`Project ${projectId} not found`);
    }

    const projectPath = join(this.basePath, project.prefix);
    await Bun.$`rm -rf ${projectPath}`.quiet();

    this.projects.delete(projectId);
  }

  /**
   * Get storage summary for all projects
   */
  async getStorageSummary(): Promise<{
    totalProjects: number;
    totalSize: number;
    totalFiles: number;
    byProject: Array<{ projectId: string; name: string; size: number }>;
  }> {
    const projects = await this.listProjects();
    const byProject: Array<{ projectId: string; name: string; size: number }> =
      [];
    let totalSize = 0;
    let totalFiles = 0;

    for (const project of projects) {
      if (project.status === "archived") continue;

      const usage = await this.getProjectUsage(project.id);
      totalSize += usage.totalSize;
      totalFiles += usage.fileCount;
      byProject.push({
        projectId: project.id,
        name: project.name,
        size: usage.totalSize,
      });
    }

    return {
      totalProjects: projects.filter((p) => p.status !== "archived").length,
      totalSize,
      totalFiles,
      byProject: byProject.sort((a, b) => b.size - a.size),
    };
  }

  /**
   * Print project usage table
   */
  async printUsageTable(projectId: string): Promise<void> {
    const project = await this.getProject(projectId);
    if (!project) {
      console.error(`Project ${projectId} not found`);
      return;
    }

    const usage = await this.getProjectUsage(projectId);

    const tableData = [
      {
        Metric: "Total Size",
        Value: formatBytes(usage.totalSize),
        Limit: formatBytes(usage.quota),
        Usage: `${usage.usagePercentage.toFixed(2)}%`,
      },
      {
        Metric: "Total Files",
        Value: usage.fileCount.toString(),
        Limit: "—",
        Usage: "—",
      },
      {
        Metric: "Archives",
        Value: usage.archiveCount.toString(),
        Limit: project.config.maxArchives.toString(),
        Usage: `${((usage.archiveCount / project.config.maxArchives) * 100).toFixed(1)}%`,
      },
      {
        Metric: "Builds",
        Value: usage.buildCount.toString(),
        Limit: "—",
        Usage: "—",
      },
      {
        Metric: "Logs",
        Value: usage.logCount.toString(),
        Limit: "—",
        Usage: "—",
      },
    ];

    console.log(`\nProject: ${project.name} (${project.id})\n`);
    console.log(Bun.inspect.table(tableData, { colors: true }));
  }
}
