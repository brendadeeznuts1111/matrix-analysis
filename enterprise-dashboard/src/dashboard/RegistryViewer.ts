// src/dashboard/RegistryViewer.ts
import { SecureRegistryClient } from "../client/RegistryClient.ts";

interface PackageInfo {
  name: string;
  version: string;
  description: string;
  license: string;
  downloads?: number;
  weeklyDownloads?: number;
  repository?: string;
  homepage?: string;
  lastUpdated?: string;
  dependencies?: number;
  devDependencies?: number;
  hasTypes?: boolean;
  unpackedSize?: number;
  engines?: string;
}

interface VersionInfo {
  version: string;
  date: string;
  deprecated?: boolean;
}

export class RegistryViewer {
  private client: SecureRegistryClient;

  private constructor(client: SecureRegistryClient) {
    this.client = client;
  }

  static async create(): Promise<RegistryViewer> {
    const client = await SecureRegistryClient.create();
    return new RegistryViewer(client);
  }

  async getPackageInfo(packageName: string): Promise<PackageInfo> {
    const data = (await this.client.getPackageInfo(packageName)) as Record<string, unknown>;
    const latest = data["dist-tags"] as Record<string, string>;
    const latestVersion = latest?.latest ?? "unknown";
    const versions = data.versions as Record<string, Record<string, unknown>>;
    const latestData = versions?.[latestVersion] ?? {};
    const time = data.time as Record<string, string>;
    const dist = latestData.dist as Record<string, unknown>;

    // Count dependencies
    const deps = latestData.dependencies as Record<string, string> | undefined;
    const devDeps = latestData.devDependencies as Record<string, string> | undefined;

    // Check for TypeScript types
    const types = latestData.types || latestData.typings;
    const hasTypes = !!types || packageName.startsWith("@types/");

    // Get last updated date
    const lastUpdated = time?.[latestVersion]
      ? new Date(time[latestVersion]).toLocaleDateString()
      : undefined;

    return {
      name: (data.name as string) ?? packageName,
      version: latestVersion,
      description: (latestData.description as string) ?? (data.description as string) ?? "",
      license: (latestData.license as string) ?? "unknown",
      repository: this.extractRepo(latestData.repository),
      homepage: latestData.homepage as string,
      lastUpdated,
      dependencies: deps ? Object.keys(deps).length : 0,
      devDependencies: devDeps ? Object.keys(devDeps).length : 0,
      hasTypes,
      unpackedSize: dist?.unpackedSize as number | undefined,
      engines: this.formatEngines(latestData.engines),
    };
  }

  private formatEngines(engines: unknown): string | undefined {
    if (!engines || typeof engines !== "object") return undefined;
    const e = engines as Record<string, string>;
    const parts: string[] = [];
    if (e.node) parts.push(`node ${e.node}`);
    if (e.bun) parts.push(`bun ${e.bun}`);
    return parts.length > 0 ? parts.join(", ") : undefined;
  }

  private formatSize(bytes?: number): string {
    if (!bytes) return "-";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  async getVersions(packageName: string, limit = 10): Promise<VersionInfo[]> {
    const data = (await this.client.getPackageInfo(packageName)) as Record<string, unknown>;
    const versions = data.versions as Record<string, Record<string, unknown>>;
    const time = data.time as Record<string, string>;

    if (!versions) return [];

    return Object.keys(versions)
      .slice(-limit)
      .reverse()
      .map((v) => ({
        version: v,
        date: time?.[v] ? new Date(time[v]).toLocaleDateString() : "unknown",
        deprecated: !!versions[v]?.deprecated,
      }));
  }

  private extractRepo(repo: unknown): string | undefined {
    if (!repo) return undefined;
    if (typeof repo === "string") return repo;
    if (typeof repo === "object" && repo !== null) {
      const r = repo as Record<string, unknown>;
      return (r.url as string)?.replace(/^git\+/, "").replace(/\.git$/, "");
    }
    return undefined;
  }

  async renderPackage(packageName: string): Promise<string> {
    const info = await this.getPackageInfo(packageName);
    const versions = await this.getVersions(packageName, 5);

    const lines = [
      `\n=== ${info.name}@${info.version} ===\n`,
      `Description: ${info.description}`,
      `License: ${info.license}`,
      info.repository ? `Repository: ${info.repository}` : null,
      info.homepage ? `Homepage: ${info.homepage}` : null,
      `\nRecent Versions:`,
    ].filter(Boolean);

    const versionRows = versions.map((v) => ({
      Version: v.version,
      Published: v.date,
      Status: v.deprecated ? "deprecated" : "active",
    }));

    return lines.join("\n") + "\n" + Bun.inspect.table(versionRows, { colors: true });
  }

  async renderMultiple(packages: string[]): Promise<string> {
    const infos = await Promise.all(packages.map((p) => this.getPackageInfo(p)));

    const rows = infos.map((info) => ({
      Package: info.name,
      Version: info.version,
      License: info.license,
      Size: this.formatSize(info.unpackedSize),
      Deps: info.dependencies ?? 0,
      Types: info.hasTypes ? "TS" : "-",
      Updated: info.lastUpdated ?? "-",
      Description: info.description.slice(0, 40) + (info.description.length > 40 ? "..." : ""),
    }));

    return "\n=== Registry Viewer ===\n\n" + Bun.inspect.table(rows, undefined, { colors: true });
  }

  async renderDetailed(packages: string[]): Promise<string> {
    const infos = await Promise.all(packages.map((p) => this.getPackageInfo(p)));
    const versionsMap = await Promise.all(packages.map((p) => this.getVersions(p, 5)));

    // Package info table
    const rows = infos.map((info) => ({
      Name: info.name,
      Version: info.version,
      License: info.license,
      Size: this.formatSize(info.unpackedSize),
      Deps: info.dependencies ?? 0,
      DevDeps: info.devDependencies ?? 0,
      Types: info.hasTypes ? "Yes" : "No",
      Updated: info.lastUpdated ?? "-",
      Engines: info.engines ?? "-",
      Repository: info.repository ? (info.repository.length > 35 ? info.repository.slice(0, 32) + "..." : info.repository) : "-",
      Description: info.description.slice(0, 40) + (info.description.length > 40 ? "..." : ""),
    }));

    const sections = [
      "\n=== Registry Viewer (Detailed) ===\n",
      Bun.inspect.table(rows, undefined, { colors: true }),
      "\n=== Version History ===\n",
    ];

    // Version history table - flatten all versions with package name
    const versionRows = infos.flatMap((info, i) =>
      versionsMap[i].map((v) => ({
        Package: info.name,
        Version: v.version,
        Published: v.date,
        Status: v.deprecated ? "deprecated" : "active",
        Engines: info.engines ?? "-",
      }))
    );

    sections.push(Bun.inspect.table(versionRows, undefined, { colors: true }));

    return sections.join("\n");
  }

  async renderSummary(): Promise<string> {
    const packages = ["zod", "lodash", "typescript", "react", "bun-types"];
    const infos = await Promise.all(
      packages.map((p) => this.getPackageInfo(p).catch(() => null))
    );

    const valid = infos.filter((i): i is PackageInfo => i !== null);

    const totalDeps = valid.reduce((sum, i) => sum + (i.dependencies ?? 0), 0);
    const totalSize = valid.reduce((sum, i) => sum + (i.unpackedSize ?? 0), 0);
    const withTypes = valid.filter((i) => i.hasTypes).length;

    const summary = {
      "Packages Analyzed": valid.length,
      "Total Dependencies": totalDeps,
      "Total Size": this.formatSize(totalSize),
      "With TypeScript": `${withTypes}/${valid.length}`,
    };

    const rows = Object.entries(summary).map(([Metric, Value]) => ({ Metric, Value }));

    return "\n=== Registry Summary ===\n\n" + Bun.inspect.table(rows, undefined, { colors: true });
  }
}

// Default packages
const DEFAULT_PACKAGES = ["zod", "lodash", "typescript", "react", "express", "axios"];

// CLI usage
if (import.meta.main) {
  const packages = process.argv.slice(2);
  if (packages.length === 0) {
    packages.push(...DEFAULT_PACKAGES);
  }

  const viewer = await RegistryViewer.create();

  if (packages.length === 1) {
    console.log(await viewer.renderPackage(packages[0]));
  } else {
    console.log(await viewer.renderMultiple(packages));
  }
}
