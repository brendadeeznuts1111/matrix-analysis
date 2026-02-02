// lib/transpiler.ts - Code transpilation via Bun.Transpiler
// =============================================================================
// Transform TypeScript/JSX to JavaScript without bundling
// =============================================================================

type Loader = "tsx" | "ts" | "jsx" | "js";

// -----------------------------------------------------------------------------
// BN-106: Transpile
// -----------------------------------------------------------------------------
export const transpile = (
  code: string,
  loader: Loader = "tsx"
): string | null => {
  try {
    const t = new Bun.Transpiler({ loader });
    return t.transformSync(code);
  } catch {
    return null;
  }
};

export const transpileAsync = async (
  code: string,
  loader: Loader = "tsx"
): Promise<string | null> => {
  try {
    const t = new Bun.Transpiler({ loader });
    return await t.transform(code);
  } catch {
    return null;
  }
};

// Extract imports from source code
export const scanImports = (
  code: string,
  loader: Loader = "tsx"
): { path: string; kind: string }[] => {
  try {
    const t = new Bun.Transpiler({ loader });
    return t.scanImports(code) as { path: string; kind: string }[];
  } catch {
    return [];
  }
};

// Extract exports from source code
export const scanExports = (
  code: string,
  loader: Loader = "tsx"
): string[] => {
  try {
    const t = new Bun.Transpiler({ loader });
    const result = t.scan(code);
    return result.exports as string[];
  } catch {
    return [];
  }
};
