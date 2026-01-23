// scripts/diagnose/config.ts
// Configuration loader for diagnose commands

interface DiagnoseConfig {
  thresholds: {
    complexity: number;
    coverage: number;
    outdatedDeps: number;
    fileSize: number;
    depCount: number;
  };
  ignore: string[];
  output: {
    format: "table" | "json" | "html";
    colors: boolean;
  };
  severity: {
    minLevel: "low" | "medium" | "high" | "critical";
  };
  paths: {
    include: string[];
    exclude: string[];
  };
}

const DEFAULT_CONFIG: DiagnoseConfig = {
  thresholds: {
    complexity: 10,
    coverage: 80,
    outdatedDeps: 5,
    fileSize: 500,
    depCount: 50,
  },
  ignore: [
    "node_modules",
    ".git",
    "dist",
    "build",
    "coverage",
    ".next",
    ".nuxt",
    ".output",
  ],
  output: {
    format: "table",
    colors: true,
  },
  severity: {
    minLevel: "low",
  },
  paths: {
    include: ["**/*.ts", "**/*.tsx", "**/*.js", "**/*.jsx"],
    exclude: ["**/*.test.ts", "**/*.spec.ts", "**/*.d.ts"],
  },
};

export async function loadConfig(projectPath: string): Promise<DiagnoseConfig> {
  const configPaths = [
    `${projectPath}/.diagnose.json`,
    `${projectPath}/diagnose.config.json`,
    `${projectPath}/.config/diagnose.json`,
  ];

  for (const configPath of configPaths) {
    const file = Bun.file(configPath);
    if (await file.exists()) {
      try {
        const userConfig = await file.json();
        return mergeConfig(DEFAULT_CONFIG, userConfig);
      } catch (e) {
        console.warn(`Warning: Failed to parse ${configPath}`);
      }
    }
  }

  // Check package.json for diagnose field
  const pkgPath = `${projectPath}/package.json`;
  const pkgFile = Bun.file(pkgPath);
  if (await pkgFile.exists()) {
    try {
      const pkg = await pkgFile.json();
      if (pkg.diagnose) {
        return mergeConfig(DEFAULT_CONFIG, pkg.diagnose);
      }
    } catch {
      // Ignore
    }
  }

  return DEFAULT_CONFIG;
}

function mergeConfig(base: DiagnoseConfig, override: Partial<DiagnoseConfig>): DiagnoseConfig {
  return {
    thresholds: { ...base.thresholds, ...override.thresholds },
    ignore: override.ignore ?? base.ignore,
    output: { ...base.output, ...override.output },
    severity: { ...base.severity, ...override.severity },
    paths: {
      include: override.paths?.include ?? base.paths.include,
      exclude: override.paths?.exclude ?? base.paths.exclude,
    },
  };
}

export async function saveConfig(projectPath: string, config: Partial<DiagnoseConfig>): Promise<void> {
  const configPath = `${projectPath}/.diagnose.json`;
  await Bun.write(configPath, JSON.stringify(config, null, 2));
  console.log(`Config saved to ${configPath}`);
}

export function renderConfig(config: DiagnoseConfig): string {
  const sections = ["\n=== Diagnose Configuration ===\n"];

  // Thresholds
  const thresholdRows = Object.entries(config.thresholds).map(([key, value]) => ({
    Setting: key,
    Value: value,
    Type: "threshold",
  }));
  sections.push("Thresholds:");
  sections.push(Bun.inspect.table(thresholdRows, undefined, { colors: config.output.colors }));

  // Output settings
  sections.push("\nOutput:");
  const outputRows = Object.entries(config.output).map(([key, value]) => ({
    Setting: key,
    Value: String(value),
  }));
  sections.push(Bun.inspect.table(outputRows, undefined, { colors: config.output.colors }));

  // Ignore patterns
  sections.push("\nIgnore Patterns:");
  const ignoreRows = config.ignore.map((pattern, i) => ({ "#": i + 1, Pattern: pattern }));
  sections.push(Bun.inspect.table(ignoreRows, undefined, { colors: config.output.colors }));

  return sections.join("\n");
}

// CLI entry point
if (import.meta.main) {
  const projectPath = process.argv[2] || process.cwd();
  const action = process.argv[3];

  const config = await loadConfig(projectPath);

  if (action === "init") {
    await saveConfig(projectPath, config);
  } else {
    console.log(renderConfig(config));
  }
}

export { DiagnoseConfig, DEFAULT_CONFIG };
