// lib/build.ts - Bun bundler API
// =============================================================================
// Programmatic bundling with Bun.build
// =============================================================================

// -----------------------------------------------------------------------------
// BN-107: Build/Bundle
// -----------------------------------------------------------------------------
export interface BuildPlugin {
  name: string;
  setup: (build: any) => void | Promise<void>;
}

export interface BuildOptions {
  entrypoints: string[];
  outdir?: string;
  target?: "bun" | "node" | "browser";
  format?: "esm" | "cjs" | "iife";
  minify?: boolean | { whitespace?: boolean; syntax?: boolean; identifiers?: boolean };
  sourcemap?: "none" | "inline" | "linked" | "external";
  splitting?: boolean;
  env?: "inline" | "disable" | (string & {});
  drop?: string[];
  external?: string[];
  define?: Record<string, string>;
  bytecode?: boolean;
  metafile?: boolean;
  naming?: string;
  publicPath?: string;
  root?: string;
  plugins?: BuildPlugin[];
  files?: Record<string, string>;
}

export interface MetafileInput {
  bytes: number;
  imports: { path: string; kind: string }[];
  format?: string;
}

export interface MetafileOutput {
  bytes: number;
  inputs: Record<string, { bytesInOutput: number }>;
  imports: { path: string; kind: string }[];
  exports: string[];
  entryPoint?: string;
}

export interface Metafile {
  inputs: Record<string, MetafileInput>;
  outputs: Record<string, MetafileOutput>;
}

export interface BuildArtifact {
  path: string;
  size: number;
  kind: string;
  hash: string | null;
  loader: string;
}

export interface BuildResult {
  success: boolean;
  outputs: BuildArtifact[];
  logs: string[];
  metafile: Metafile | null;
}

export const build = async (options: BuildOptions): Promise<BuildResult> => {
  try {
    const buildConfig: Record<string, any> = {
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
    };

    if (options.env !== undefined) buildConfig.env = options.env;
    if (options.bytecode !== undefined) buildConfig.bytecode = options.bytecode;
    if (options.metafile !== undefined) buildConfig.metafile = options.metafile;
    if (options.naming !== undefined) buildConfig.naming = options.naming;
    if (options.publicPath !== undefined) buildConfig.publicPath = options.publicPath;
    if (options.root !== undefined) buildConfig.root = options.root;
    if (options.plugins !== undefined) buildConfig.plugins = options.plugins;
    if (options.files !== undefined) buildConfig.files = options.files;

    const result = await Bun.build(buildConfig);

    return {
      success: result.success,
      outputs: result.outputs.map((o: any) => ({
        path: o.path,
        size: o.size,
        kind: o.kind,
        hash: o.hash ?? null,
        loader: o.loader ?? null,
      })),
      logs: result.logs.map((l: any) => l.message),
      metafile: (result as any).metafile ?? null,
    };
  } catch (e) {
    return {
      success: false,
      outputs: [],
      logs: [e instanceof Error ? e.message : String(e)],
      metafile: null,
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
