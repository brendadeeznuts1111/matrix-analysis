// lib/runtime.ts - Bun process/runtime info, sleep, module resolution
// =============================================================================
// Zero-dependency wrappers for Bun runtime introspection
// =============================================================================

// -----------------------------------------------------------------------------
// BN-090: Runtime Info
// -----------------------------------------------------------------------------
export const main = (): string =>
  Bun.main;

export const isMain = (importMeta: ImportMeta): boolean =>
  importMeta.path === Bun.main;

export const argv = (): string[] =>
  Bun.argv;

export const cwd = (): string =>
  process.cwd();

export const version = (): string =>
  Bun.version;

export const revision = (): string =>
  Bun.revision;

// -----------------------------------------------------------------------------
// BN-091: Sleep
// -----------------------------------------------------------------------------
export const sleep = (ms: number): Promise<void> =>
  Bun.sleep(ms);

export const sleepSync = (ms: number): void =>
  Bun.sleepSync(ms);

// -----------------------------------------------------------------------------
// BN-092: Module Resolution
// -----------------------------------------------------------------------------
export const resolveSync = (
  specifier: string,
  root?: string
): string | null => {
  try {
    return Bun.resolveSync(specifier, root ?? process.cwd());
  } catch {
    return null;
  }
};

export const pathToFileURL = (path: string): URL =>
  Bun.pathToFileURL(path);

export const fileURLToPath = (url: string | URL): string =>
  Bun.fileURLToPath(url);

// -----------------------------------------------------------------------------
// BN-093: System
// -----------------------------------------------------------------------------
export const openInEditor = (path: string, opts?: {
  editor?: string;
  line?: number;
  column?: number;
}): void => {
  Bun.openInEditor(path, opts);
};

export const which = (cmd: string): string | null =>
  Bun.which(cmd);
