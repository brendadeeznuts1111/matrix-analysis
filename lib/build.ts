// lib/build.ts - Bun bundler API
// =============================================================================
// Programmatic bundling with Bun.build
// =============================================================================

// -----------------------------------------------------------------------------
// BN-107: Build/Bundle
// -----------------------------------------------------------------------------
export interface BuildOptions {
  entrypoints: string[];
  outdir?: string;
  target?: "bun" | "node" | "browser";
  format?: "esm" | "cjs" | "iife";
  minify?: boolean | { whitespace?: boolean; syntax?: boolean; identifiers?: boolean };
  sourcemap?: "none" | "inline" | "linked" | "external";
  splitting?: boolean;
  env?: string | Record<string, string>;
  drop?: string[];
  external?: string[];
  define?: Record<string, string>;
}

export interface BuildResult {
  success: boolean;
  outputs: { path: string; size: number; kind: string }[];
  logs: string[];
}

export const build = async (options: BuildOptions): Promise<BuildResult> => {
  try {
    const result = await Bun.build({
      entrypoints: options.entrypoints,
      outdir: options.outdir,
      target: options.target ?? "bun",
      format: options.format ?? "esm",
      minify: options.minify ?? false,
      sourcemap: options.sourcemap ?? "none",
      splitting: options.splitting ?? false,
      external: options.external,
      define: options.define,
      drop: options.drop,
    });

    return {
      success: result.success,
      outputs: result.outputs.map((o) => ({
        path: o.path,
        size: o.size,
        kind: o.kind,
      })),
      logs: result.logs.map((l) => l.message),
    };
  } catch (e) {
    return {
      success: false,
      outputs: [],
      logs: [e instanceof Error ? e.message : String(e)],
    };
  }
};

// Quick single-file bundle to string
export const bundleToString = async (
  entrypoint: string
): Promise<string | null> => {
  try {
    const result = await Bun.build({
      entrypoints: [entrypoint],
      target: "bun",
      format: "esm",
    });
    if (!result.success || result.outputs.length === 0) return null;
    return await result.outputs[0].text();
  } catch {
    return null;
  }
};
