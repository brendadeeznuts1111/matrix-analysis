/**
 * Multi-Project S3 Architecture Tests
 * Tests for ProjectManager, ProjectStorage, and S3 schema utilities
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from "bun:test";
import { join } from "path";
import { tmpdir } from "os";

import { ProjectManager } from "./project-manager";
import { ProjectStorage } from "./project-storage";
import {
  generateS3Key,
  parseS3Key,
  generateProjectId,
  isValidProjectId,
  getProjectPrefix,
  getProjectSubfolders,
  formatBytes,
} from "./s3-schema";
import { BUCKET_SCHEMA } from "./types";

// Test directory
const TEST_DIR = join(tmpdir(), `s3-project-test-${process.pid}`);

describe("S3 Schema Utilities", () => {
  describe("generateProjectId", () => {
    it("generates valid project IDs", () => {
      const id = generateProjectId();
      expect(id).toStartWith("proj_");
      expect(id.length).toBeGreaterThanOrEqual(13);
      expect(isValidProjectId(id)).toBe(true);
    });

    it("generates unique IDs", async () => {
      const ids = new Set<string>();
      for (let i = 0; i < 10; i++) {
        ids.add(generateProjectId());
        // Small delay to ensure UUID v7 timestamp changes
        await Bun.sleep(1);
      }
      expect(ids.size).toBe(10);
    });
  });

  describe("isValidProjectId", () => {
    it("validates correct project IDs", () => {
      expect(isValidProjectId("proj_abc12345")).toBe(true);
      expect(isValidProjectId("proj_0123456789ab")).toBe(true);
      expect(isValidProjectId("proj_abcdef12")).toBe(true);
    });

    it("rejects invalid project IDs", () => {
      expect(isValidProjectId("proj_")).toBe(false);
      expect(isValidProjectId("project_abc123")).toBe(false);
      expect(isValidProjectId("proj_ABC123")).toBe(false); // uppercase not allowed
      expect(isValidProjectId("abc123")).toBe(false);
      expect(isValidProjectId("")).toBe(false);
    });
  });

  describe("generateS3Key", () => {
    const projectId = "proj_test1234";

    it("generates archive keys with timestamp", () => {
      const key = generateS3Key(projectId, "archives", "", {
        timestamp: "2025-01-20T10-00-00",
      });
      expect(key).toStartWith(`projects/${projectId}/archives/archive_`);
      expect(key).toContain("2025-01-20T10-00-00");
      expect(key).toEndWith(".tar.gz");
    });

    it("generates build keys with version", () => {
      const key = generateS3Key(projectId, "builds", "bundle.js", {
        version: "v1.2.3",
      });
      expect(key).toBe(`projects/${projectId}/builds/v1.2.3/bundle.js`);
    });

    it("generates config keys", () => {
      const key = generateS3Key(projectId, "configs", "production.jsonc");
      expect(key).toBe(`projects/${projectId}/configs/production.jsonc`);
    });

    it("generates log keys", () => {
      const key = generateS3Key(projectId, "logs", "2025-01-20.log");
      expect(key).toBe(`projects/${projectId}/logs/2025-01-20.log`);
    });
  });

  describe("parseS3Key", () => {
    it("parses valid S3 keys", () => {
      const result = parseS3Key(
        "projects/proj_test1234/archives/archive_001.tar.gz"
      );
      expect(result.projectId).toBe("proj_test1234");
      expect(result.type).toBe("archives");
      expect(result.filename).toBe("archive_001.tar.gz");
    });

    it("parses nested paths", () => {
      const result = parseS3Key(
        "projects/proj_abc123/builds/v1.0.0/bundle.js"
      );
      expect(result.projectId).toBe("proj_abc123");
      expect(result.type).toBe("builds");
      expect(result.filename).toBe("v1.0.0/bundle.js");
    });

    it("returns null for invalid keys", () => {
      const result = parseS3Key("invalid/path/file.txt");
      expect(result.projectId).toBeNull();
      expect(result.type).toBeNull();
    });
  });

  describe("getProjectSubfolders", () => {
    it("returns all expected subfolders", () => {
      const subfolders = getProjectSubfolders("proj_test");
      expect(subfolders.length).toBe(
        Object.keys(BUCKET_SCHEMA.subfolders).length
      );
      expect(subfolders).toContain("projects/proj_test/archives/");
      expect(subfolders).toContain("projects/proj_test/configs/");
      expect(subfolders).toContain("projects/proj_test/builds/");
    });
  });

  describe("formatBytes", () => {
    it("formats bytes correctly", () => {
      expect(formatBytes(0)).toBe("0 B");
      expect(formatBytes(1024)).toBe("1.00 KB");
      expect(formatBytes(1024 * 1024)).toBe("1.00 MB");
      expect(formatBytes(1024 * 1024 * 1024)).toBe("1.00 GB");
      expect(formatBytes(1536)).toBe("1.50 KB");
    });
  });
});

describe("ProjectManager", () => {
  let manager: ProjectManager;

  beforeAll(async () => {
    await Bun.$`mkdir -p ${TEST_DIR}`.quiet();
    manager = new ProjectManager(TEST_DIR);
  });

  afterAll(async () => {
    await Bun.$`rm -rf ${TEST_DIR}`.quiet();
  });

  describe("createProject", () => {
    it("creates a project with valid structure", async () => {
      const project = await manager.createProject(
        "test-project",
        "test@example.com"
      );

      expect(project.id).toStartWith("proj_");
      expect(project.name).toBe("test-project");
      expect(project.owner).toBe("test@example.com");
      expect(project.status).toBe("active");
      expect(project.config.storageQuota).toBe(100 * 1024 * 1024 * 1024);
    });

    it("creates all required subfolders", async () => {
      const project = await manager.createProject(
        "folder-test",
        "test@example.com"
      );

      const projectPath = join(TEST_DIR, project.prefix);

      for (const subfolder of Object.values(BUCKET_SCHEMA.subfolders)) {
        const folderPath = join(projectPath, subfolder);
        const markerPath = join(folderPath, ".folder-marker");
        expect(await Bun.file(markerPath).exists()).toBe(true);
      }
    });

    it("creates project.json and default config", async () => {
      const project = await manager.createProject(
        "config-test",
        "test@example.com"
      );

      const projectPath = join(TEST_DIR, project.prefix);

      // Check project.json
      const projectJson = await Bun.file(
        join(projectPath, "project.json")
      ).json();
      expect(projectJson.name).toBe("config-test");

      // Check production.jsonc
      const configJson = await Bun.file(
        join(projectPath, "configs/production.jsonc")
      ).json();
      expect(configJson.project.name).toBe("config-test");
    });

    it("accepts custom config options", async () => {
      const project = await manager.createProject(
        "custom-config",
        "test@example.com",
        {
          storageQuota: 50 * 1024 * 1024 * 1024, // 50GB
          maxArchives: 500,
          retentionDays: 60,
        }
      );

      expect(project.config.storageQuota).toBe(50 * 1024 * 1024 * 1024);
      expect(project.config.maxArchives).toBe(500);
      expect(project.config.retentionDays).toBe(60);
    });
  });

  describe("getProject", () => {
    it("retrieves existing project", async () => {
      const created = await manager.createProject(
        "get-test",
        "test@example.com"
      );
      const retrieved = await manager.getProject(created.id);

      expect(retrieved).not.toBeNull();
      expect(retrieved!.id).toBe(created.id);
      expect(retrieved!.name).toBe("get-test");
    });

    it("returns null for non-existent project", async () => {
      const result = await manager.getProject("proj_nonexistent");
      expect(result).toBeNull();
    });
  });

  describe("listProjects", () => {
    it("lists all projects", async () => {
      // Create a few projects first
      await manager.createProject("list-test-1", "test@example.com");
      await manager.createProject("list-test-2", "test@example.com");

      const projects = await manager.listProjects();
      expect(projects.length).toBeGreaterThanOrEqual(2);

      const names = projects.map((p) => p.name);
      expect(names).toContain("list-test-1");
      expect(names).toContain("list-test-2");
    });
  });

  describe("getProjectUsage", () => {
    it("calculates storage usage", async () => {
      const project = await manager.createProject(
        "usage-test",
        "test@example.com"
      );

      // Add some test files
      const projectPath = join(TEST_DIR, project.prefix);
      await Bun.write(
        join(projectPath, "archives/test.tar.gz"),
        "test archive content"
      );
      await Bun.write(
        join(projectPath, "builds/v1.0.0/bundle.js"),
        "// bundle content"
      );
      await Bun.write(
        join(projectPath, "logs/app.log"),
        "log entry"
      );

      const usage = await manager.getProjectUsage(project.id);

      expect(usage.totalSize).toBeGreaterThan(0);
      expect(usage.fileCount).toBeGreaterThanOrEqual(3);
      expect(usage.archiveCount).toBe(1);
      expect(usage.buildCount).toBe(1);
      expect(usage.logCount).toBe(1);
      expect(usage.usagePercentage).toBeLessThan(1); // Very small usage
    });
  });

  describe("archiveProject", () => {
    it("moves project to archived prefix", async () => {
      const project = await manager.createProject(
        "archive-test",
        "test@example.com"
      );
      const originalPath = join(TEST_DIR, project.prefix);
      const originalProjectJson = join(originalPath, "project.json");

      // Add a test file
      await Bun.write(
        join(originalPath, "test.txt"),
        "test content"
      );

      await manager.archiveProject(project.id);

      // Original project.json should not exist
      expect(await Bun.file(originalProjectJson).exists()).toBe(false);

      // Project should be marked as archived
      const archived = await manager.getProject(project.id);
      expect(archived!.status).toBe("archived");
      expect(archived!.archivedAt).toBeDefined();
      expect(archived!.archivedPrefix).toStartWith("archived/");
    });
  });

  describe("deleteProject", () => {
    it("removes project completely", async () => {
      const project = await manager.createProject(
        "delete-test",
        "test@example.com"
      );
      const projectPath = join(TEST_DIR, project.prefix);
      const projectJsonPath = join(projectPath, "project.json");

      // Check that project.json exists (indicates project was created)
      expect(await Bun.file(projectJsonPath).exists()).toBe(true);

      await manager.deleteProject(project.id);

      // Check that project.json no longer exists
      expect(await Bun.file(projectJsonPath).exists()).toBe(false);
      expect(await manager.getProject(project.id)).toBeNull();
    });
  });
});

describe("ProjectStorage", () => {
  let manager: ProjectManager;
  let projectId: string;

  beforeAll(async () => {
    await Bun.$`mkdir -p ${TEST_DIR}`.quiet();
    manager = new ProjectManager(TEST_DIR);
    const project = await manager.createProject(
      "storage-test",
      "test@example.com"
    );
    projectId = project.id;
  });

  afterAll(async () => {
    await Bun.$`rm -rf ${TEST_DIR}`.quiet();
  });

  describe("uploadArchive", () => {
    it("creates tar.gz archive with metadata", async () => {
      const storage = new ProjectStorage(projectId, TEST_DIR);

      const result = await storage.uploadArchive(
        {
          "file1.txt": "Hello, World!",
          "file2.json": JSON.stringify({ key: "value" }),
          "nested/file3.txt": "Nested content",
        },
        {
          description: "Test archive",
          retentionDays: 30,
        }
      );

      expect(result.success).toBe(true);
      expect(result.key).toContain("archives/archive_");
      expect(result.key).toEndWith(".tar.gz");
      expect(result.size).toBeGreaterThan(0);
      expect(result.checksum).toHaveLength(8);
      expect(result.metrics.archiveCreation).toContain("ms");
      expect(result.metrics.throughput).toContain("MB/s");
    });

    it("creates metadata sidecar file", async () => {
      const storage = new ProjectStorage(projectId, TEST_DIR);

      const result = await storage.uploadArchive(
        { "test.txt": "content" },
        { description: "Meta test" }
      );

      const metaPath = join(TEST_DIR, `${result.key}.meta.json`);
      expect(await Bun.file(metaPath).exists()).toBe(true);

      const meta = await Bun.file(metaPath).json();
      expect(meta.description).toBe("Meta test");
      expect(meta.fileCount).toBe(1);
      expect(meta.files).toContain("test.txt");
    });

    it("handles binary content", async () => {
      const storage = new ProjectStorage(projectId, TEST_DIR);
      const binaryData = new Uint8Array([0, 1, 2, 3, 255, 254, 253]);

      const result = await storage.uploadArchive({
        "binary.bin": binaryData,
      });

      expect(result.success).toBe(true);
      expect(result.size).toBeGreaterThan(0);
    });
  });

  describe("listArchives", () => {
    it("lists uploaded archives", async () => {
      const storage = new ProjectStorage(projectId, TEST_DIR);

      // Upload a few archives with delays to ensure unique timestamps
      await storage.uploadArchive({ "a.txt": "a" });
      await Bun.sleep(5);
      await storage.uploadArchive({ "b.txt": "b" });
      await Bun.sleep(5);
      await storage.uploadArchive({ "c.txt": "c" });

      const archives = await storage.listArchives();

      expect(archives.length).toBeGreaterThanOrEqual(3);
      expect(archives[0].key).toContain("archives/");
      expect(archives[0].size).toBeGreaterThan(0);
      expect(archives[0].checksum).toHaveLength(8);
    });

    it("sorts by newest first by default", async () => {
      const storage = new ProjectStorage(projectId, TEST_DIR);
      const archives = await storage.listArchives({ sort: "newest" });

      for (let i = 1; i < archives.length; i++) {
        expect(archives[i - 1].lastModified.getTime()).toBeGreaterThanOrEqual(
          archives[i].lastModified.getTime()
        );
      }
    });

    it("supports pagination", async () => {
      const storage = new ProjectStorage(projectId, TEST_DIR);

      const page1 = await storage.listArchives({ limit: 2, offset: 0 });
      const page2 = await storage.listArchives({ limit: 2, offset: 2 });

      expect(page1.length).toBeLessThanOrEqual(2);
      if (page2.length > 0) {
        expect(page1[0].key).not.toBe(page2[0].key);
      }
    });
  });

  describe("getArchiveContents", () => {
    it("returns file list from metadata", async () => {
      const storage = new ProjectStorage(projectId, TEST_DIR);

      const result = await storage.uploadArchive({
        "file1.txt": "content1",
        "file2.txt": "content2",
        "dir/file3.txt": "content3",
      });

      const contents = await storage.getArchiveContents(result.key);

      expect(contents).toContain("file1.txt");
      expect(contents).toContain("file2.txt");
      expect(contents).toContain("dir/file3.txt");
    });
  });

  describe("deleteArchive", () => {
    it("removes archive and metadata", async () => {
      const storage = new ProjectStorage(projectId, TEST_DIR);

      const result = await storage.uploadArchive({ "delete.txt": "content" });
      const archivePath = join(TEST_DIR, result.key);
      const metaPath = `${archivePath}.meta.json`;

      expect(await Bun.file(archivePath).exists()).toBe(true);
      expect(await Bun.file(metaPath).exists()).toBe(true);

      const deleted = await storage.deleteArchive(result.key);

      expect(deleted).toBe(true);
      expect(await Bun.file(archivePath).exists()).toBe(false);
      expect(await Bun.file(metaPath).exists()).toBe(false);
    });

    it("returns false for non-existent archive", async () => {
      const storage = new ProjectStorage(projectId, TEST_DIR);
      const deleted = await storage.deleteArchive("nonexistent.tar.gz");
      expect(deleted).toBe(false);
    });
  });

  describe("writeFile / readFile", () => {
    it("writes and reads config files", async () => {
      const storage = new ProjectStorage(projectId, TEST_DIR);
      const content = JSON.stringify({ setting: "value" });

      const key = await storage.writeFile("configs", "test.json", content);
      expect(key).toContain("configs/test.json");

      const read = await storage.readFile("configs", "test.json");
      expect(read).toBe(content);
    });

    it("writes and reads log files", async () => {
      const storage = new ProjectStorage(projectId, TEST_DIR);
      const content = "2025-01-20 10:00:00 INFO Application started";

      await storage.writeFile("logs", "app.log", content);
      const read = await storage.readFile("logs", "app.log");

      expect(read).toBe(content);
    });

    it("throws for non-existent file", async () => {
      const storage = new ProjectStorage(projectId, TEST_DIR);

      expect(
        storage.readFile("configs", "nonexistent.json")
      ).rejects.toThrow();
    });
  });

  describe("getProjectInfo", () => {
    it("returns storage breakdown by type", async () => {
      const storage = new ProjectStorage(projectId, TEST_DIR);

      const info = await storage.getProjectInfo();

      expect(info.projectId).toBe(projectId);
      expect(info.totalObjects).toBeGreaterThan(0);
      expect(info.totalSize).toBeGreaterThan(0);
      expect(info.storageByType).toBeDefined();
      expect(info.prefixes.length).toBe(
        Object.keys(BUCKET_SCHEMA.subfolders).length
      );
    });
  });
});

describe("Integration: Full Project Lifecycle", () => {
  const LIFECYCLE_DIR = join(tmpdir(), `s3-lifecycle-test-${process.pid}`);

  beforeAll(async () => {
    await Bun.$`mkdir -p ${LIFECYCLE_DIR}`.quiet();
  });

  afterAll(async () => {
    await Bun.$`rm -rf ${LIFECYCLE_DIR}`.quiet();
  });

  it("complete project workflow", async () => {
    const manager = new ProjectManager(LIFECYCLE_DIR);

    // 1. Create project
    const project = await manager.createProject(
      "lifecycle-project",
      "admin@company.com",
      { maxArchives: 10 }
    );
    expect(project.status).toBe("active");

    // 2. Upload archives
    const storage = new ProjectStorage(project.id, LIFECYCLE_DIR);

    const archive1 = await storage.uploadArchive(
      {
        "src/index.ts": 'console.log("Hello");',
        "package.json": '{"name":"test"}',
      },
      { description: "Initial release" }
    );
    expect(archive1.success).toBe(true);

    // Small delay to ensure unique timestamp
    await Bun.sleep(10);

    const archive2 = await storage.uploadArchive(
      {
        "src/index.ts": 'console.log("Updated");',
        "src/utils.ts": 'export const util = () => {};',
        "package.json": '{"name":"test","version":"1.1.0"}',
      },
      { description: "Update with utils" }
    );
    expect(archive2.success).toBe(true);

    // 3. List archives
    const archives = await storage.listArchives();
    expect(archives.length).toBeGreaterThanOrEqual(2);

    // 4. Check usage
    const usage = await manager.getProjectUsage(project.id);
    expect(usage.archiveCount).toBeGreaterThanOrEqual(2);
    expect(usage.totalSize).toBeGreaterThan(0);

    // 5. Write config
    await storage.writeFile(
      "configs",
      "staging.jsonc",
      JSON.stringify({ env: "staging", debug: true })
    );
    const config = await storage.readFile("configs", "staging.jsonc");
    expect(JSON.parse(config).env).toBe("staging");

    // 6. Get project info
    const info = await storage.getProjectInfo();
    expect(info.totalObjects).toBeGreaterThan(0);

    // 7. Archive project
    await manager.archiveProject(project.id);
    const archived = await manager.getProject(project.id);
    expect(archived!.status).toBe("archived");
    expect(archived!.archivedPrefix).toStartWith("archived/");
  });
});
