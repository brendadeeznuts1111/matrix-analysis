// lib/parse.ts - Unified file/string parsing with auto-detection
// ═══════════════════════════════════════════════════════════════════════════════
// Safe parsers that return null on error, plus file auto-detection
// ═══════════════════════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────────────────────────────
// BN-030: Safe Parsers (return null on error)
// ─────────────────────────────────────────────────────────────────────────────
export const json = <T>(input: string): T | null => {
  try {
    return JSON.parse(input) as T;
  } catch {
    return null;
  }
};

export const json5 = <T>(input: string): T | null => {
  try {
    return Bun.JSON5.parse(input) as T;
  } catch {
    return null;
  }
};

export const toml = <T>(input: string): T | null => {
  try {
    return Bun.TOML.parse(input) as T;
  } catch {
    return null;
  }
};

export const jsonl = <T>(input: string): T[] | null => {
  try {
    return Bun.JSONL.parse(input) as T[];
  } catch {
    return null;
  }
};

export interface JsonlChunkResult<T> {
  values: T[];
  read: number;
  done: boolean;
  error: Error | null;
}

export const jsonlChunk = <T>(chunk: string | Uint8Array): JsonlChunkResult<T> => {
  return Bun.JSONL.parseChunk(chunk) as JsonlChunkResult<T>;
};

// ─────────────────────────────────────────────────────────────────────────────
// BN-031: File Loader (auto-detect by extension)
// ─────────────────────────────────────────────────────────────────────────────
const EXT_PARSERS: Record<string, <T>(input: string) => T | null> = {
  ".json": json,
  ".json5": json5,
  ".toml": toml,
  ".jsonl": jsonl as <T>(input: string) => T | null,
};

export const loadFile = async <T>(path: string): Promise<T | null> => {
  try {
    const file = Bun.file(path);
    if (!(await file.exists())) return null;
    const text = await file.text();
    const ext = path.slice(path.lastIndexOf(".")).toLowerCase();
    const parser = EXT_PARSERS[ext];
    if (!parser) return null;
    return parser<T>(text);
  } catch {
    return null;
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// BN-032: Stringify Helpers
// ─────────────────────────────────────────────────────────────────────────────
export const toJsonl = (items: unknown[]): string =>
  items.map((item) => JSON.stringify(item)).join("\n") + "\n";

// ─────────────────────────────────────────────────────────────────────────────
// BN-033: YAML & JSONC Parsers (Bun 1.3.7+)
// ─────────────────────────────────────────────────────────────────────────────
export const yaml = <T>(input: string): T | null => {
  try {
    return Bun.YAML.parse(input) as T;
  } catch {
    return null;
  }
};

export const jsonc = <T>(input: string): T | null => {
  try {
    return Bun.JSONC.parse(input) as T;
  } catch {
    return null;
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// BN-034: File Loader Extensions
// ─────────────────────────────────────────────────────────────────────────────
const EXT_PARSERS_V2: Record<string, <T>(input: string) => T | null> = {
  ...EXT_PARSERS,
  ".yaml": yaml,
  ".yml": yaml,
  ".jsonc": jsonc,
};

export const loadFileV2 = async <T>(path: string): Promise<T | null> => {
  try {
    const file = Bun.file(path);
    if (!(await file.exists())) return null;
    const text = await file.text();
    const ext = path.slice(path.lastIndexOf(".")).toLowerCase();
    const parser = EXT_PARSERS_V2[ext];
    if (!parser) return null;
    return parser<T>(text);
  } catch {
    return null;
  }
};
