// Bun Matrix type definitions

export interface Version {
  major: number;
  minor: number;
  patch: number;
}

export interface PerfProfile {
  opsSec: number;
  baseline: string;
  platform?: string;
}

export interface SecurityScope {
  classification: "high" | "medium" | "low";
  requiresRoot?: boolean;
  zeroTrust?: boolean;
}

export interface BunDocEntry {
  term: string;
  path: string;
  bunMinVersion: `${number}.${number}.${number}`;
  stability: "experimental" | "stable" | "deprecated";
  platforms: ("darwin" | "linux" | "win32")[];
  changelogFeed?: URL;
  perfProfile?: PerfProfile;
  security: SecurityScope;
  cliFlags?: string[];
  breakingChanges?: Version[];
  relatedTerms?: string[];
  lastUpdated?: Date;
  category?: "core" | "crypto" | "io" | "network" | "ffi" | "web" | "cli";
  deprecatedIn?: `${number}.${number}.${number}`;
  removedIn?: `${number}.${number}.${number}`;
  thuisConfig?: {
    homeDirectory?: string;
    configFile?: string;
    envVars?: Record<string, string>;
    serviceMode?: "daemon" | "cli" | "gui";
  };
  homeFeatures?: {
    localServer?: boolean;
    autoStart?: boolean;
    trayIcon?: boolean;
    notifications?: boolean;
  };
}
