// lib/file.ts - File I/O with existence checks and error-safe returns
// ═══════════════════════════════════════════════════════════════════════════════
// Consolidates the Bun.file() + exists() + read/write pattern.
// All read operations return null on failure instead of throwing.
// ═══════════════════════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────────────────────────────
// BN-045: Read Helpers
// ─────────────────────────────────────────────────────────────────────────────
export const readText = async (path: string): Promise<string | null> => {
  const file = Bun.file(path);
  if (!(await file.exists())) return null;
  return file.text().catch(() => null);
};

export const readJson = async <T>(path: string): Promise<T | null> => {
  const file = Bun.file(path);
  if (!(await file.exists())) return null;
  return file.json().catch(() => null) as Promise<T | null>;
};

export const readBytes = async (path: string): Promise<Uint8Array | null> => {
  const file = Bun.file(path);
  if (!(await file.exists())) return null;
  return file.bytes().catch(() => null);
};

// ─────────────────────────────────────────────────────────────────────────────
// BN-046: Write Helpers
// ─────────────────────────────────────────────────────────────────────────────
export const writeText = async (path: string, content: string): Promise<boolean> =>
  Bun.write(path, content).then(() => true).catch(() => false);

export const writeJson = async (path: string, data: unknown, indent = 2): Promise<boolean> =>
  Bun.write(path, JSON.stringify(data, null, indent) + "\n").then(() => true).catch(() => false);

// ─────────────────────────────────────────────────────────────────────────────
// BN-047: Exists
// ─────────────────────────────────────────────────────────────────────────────
export const exists = async (path: string): Promise<boolean> =>
  Bun.file(path).exists();

// ─────────────────────────────────────────────────────────────────────────────
// BN-047b: Stat & Delete
// ─────────────────────────────────────────────────────────────────────────────
export interface FileStat {
  size: number;
  mtime: Date;
  isFile: boolean;
  isDirectory: boolean;
}

export const stat = async (path: string): Promise<FileStat | null> => {
  try {
    const { stat: fsStat } = await import("node:fs/promises");
    const s = await fsStat(path);
    return {
      size: s.size,
      mtime: s.mtime,
      isFile: s.isFile(),
      isDirectory: s.isDirectory(),
    };
  } catch {
    return null;
  }
};

export const remove = async (path: string): Promise<boolean> => {
  try {
    const file = Bun.file(path);
    if (!(await file.exists())) return false;
    await file.delete();
    return true;
  } catch {
    return false;
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// BN-047c: Directory Operations
// ─────────────────────────────────────────────────────────────────────────────
export const mkdir = async (path: string): Promise<boolean> => {
  try {
    const { mkdir: fsMkdir } = await import("node:fs/promises");
    await fsMkdir(path, { recursive: true });
    return true;
  } catch {
    return false;
  }
};

export const copyFile = async (src: string, dest: string): Promise<boolean> => {
  try {
    const content = await Bun.file(src).arrayBuffer();
    await Bun.write(dest, content);
    return true;
  } catch {
    return false;
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// BN-048: Glob Scanner
// ─────────────────────────────────────────────────────────────────────────────
export async function* glob(pattern: string, cwd?: string): AsyncGenerator<string> {
  const g = new Bun.Glob(pattern);
  for await (const entry of g.scan({ cwd: cwd ?? ".", absolute: true })) {
    yield entry;
  }
}

export const globAll = async (pattern: string, cwd?: string): Promise<string[]> => {
  const results: string[] = [];
  for await (const entry of glob(pattern, cwd)) {
    results.push(entry);
  }
  return results;
};

// ─────────────────────────────────────────────────────────────────────────────
// BN-049: Parallel Multi-File Read
// ─────────────────────────────────────────────────────────────────────────────
export interface FileEntry<T = string> {
  path: string;
  data: T | null;
}

export const readAll = async (paths: string[]): Promise<FileEntry[]> =>
  Promise.all(paths.map(async (path) => ({
    path,
    data: await readText(path),
  })));

export const readAllJson = async <T>(paths: string[]): Promise<FileEntry<T>[]> =>
  Promise.all(paths.map(async (path) => ({
    path,
    data: await readJson<T>(path),
  })));

// ─────────────────────────────────────────────────────────────────────────────
// BN-099: Memory-Mapped I/O
// ─────────────────────────────────────────────────────────────────────────────
export const mmap = (path: string): Uint8Array | null => {
  try {
    return Bun.mmap(path);
  } catch {
    return null;
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// BN-100: Synchronous Glob
// ─────────────────────────────────────────────────────────────────────────────
export function* globSync(pattern: string, cwd?: string): Generator<string> {
  const g = new Bun.Glob(pattern);
  for (const entry of g.scanSync({ cwd: cwd ?? ".", absolute: true })) {
    yield entry;
  }
}

export const globAllSync = (pattern: string, cwd?: string): string[] => {
  const results: string[] = [];
  for (const entry of globSync(pattern, cwd)) {
    results.push(entry);
  }
  return results;
};

// ─────────────────────────────────────────────────────────────────────────────
// BN-111: File Stream / Writer / Slice
// ─────────────────────────────────────────────────────────────────────────────
export const stream = (path: string): ReadableStream | null => {
  try {
    return Bun.file(path).stream();
  } catch {
    return null;
  }
};

export const writer = (path: string): ReturnType<BunFile["writer"]> | null => {
  try {
    return Bun.file(path).writer();
  } catch {
    return null;
  }
};

export const slice = async (
  path: string,
  start: number,
  end: number
): Promise<string | null> => {
  try {
    const file = Bun.file(path);
    if (!(await file.exists())) return null;
    return await file.slice(start, end).text();
  } catch {
    return null;
  }
};

export const sliceBytes = async (
  path: string,
  start: number,
  end: number
): Promise<Uint8Array | null> => {
  try {
    const file = Bun.file(path);
    if (!(await file.exists())) return null;
    return new Uint8Array(await file.slice(start, end).arrayBuffer());
  } catch {
    return null;
  }
};

type BunFile = ReturnType<typeof Bun.file>;
