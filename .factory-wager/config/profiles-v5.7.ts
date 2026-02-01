#!/usr/bin/env bun
/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * FactoryWager Profile Secrets Manager — Reverse-DNS Namespace (SERVICE-NAMING.md)
 * Bun.secrets integration with profile-scoped secret resolution
 * ═══════════════════════════════════════════════════════════════════════════════
 */

declare module "bun" {
  interface Env {
    FW_ACTIVE_PROFILE: "development" | "staging" | "production";
    FW_SECRET_NAMESPACE: string;
  }
}

const GLYPH = {
  SECURE: "🔐",
  MISSING: "❌",
  SYNC: "▵⟂⥂",
  NAMESPACE: "📦",
  PROFILE: "👤"
} as const;

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION: Reverse-DNS Secret Namespacing (Per Your Standard)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * SERVICE-NAMING.md Standard Implementation:
 * Format: com.{company}.{service}-{env}.{category}/{name}
 * Example: com.factory-wager.dev.registry/api-token
 */

interface SecretDefinition {
  service: string;      // "com.factory-wager.dev"
  category: string;     // "registry", "r2", "database"
  name: string;         // "api-token", "access-key"
  required: boolean;
  description: string;
}

const PROFILE_SECRETS: Record<string, SecretDefinition[]> = {
  development: [
    {
      service: "com.factory-wager.dev",
      category: "registry",
      name: "api-token",
      required: false,
      description: "Development registry API token"
    },
    {
      service: "com.factory-wager.dev",
      category: "r2",
      name: "access-key",
      required: false,
      description: "R2 storage access key for development"
    },
    {
      service: "com.factory-wager.dev",
      category: "database",
      name: "url",
      required: false,
      description: "Development database connection string"
    }
  ],
  staging: [
    {
      service: "com.factory-wager.staging",
      category: "registry",
      name: "api-token",
      required: true,
      description: "Staging registry API token"
    },
    {
      service: "com.factory-wager.staging",
      category: "r2",
      name: "access-key",
      required: true,
      description: "R2 storage access key for staging"
    }
  ],
  production: [
    {
      service: "com.factory-wager.prod",
      category: "registry",
      name: "api-token",
      required: true,
      description: "Production registry API token"
    },
    {
      service: "com.factory-wager.prod",
      category: "r2",
      name: "access-key",
      required: true,
      description: "R2 storage access key for production"
    },
    {
      service: "com.factory-wager.prod",
      category: "ssl",
      name: "certificate",
      required: true,
      description: "Production SSL certificate"
    }
  ]
};

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION: Profile Secret Resolver
// ═══════════════════════════════════════════════════════════════════════════════

class ProfileSecretResolver {
  private profile: string;

  constructor(profile: string = Bun.env.FW_ACTIVE_PROFILE || "development") {
    this.profile = profile;
  }

  /**
   * Build reverse-DNS key per SERVICE-NAMING.md
   */
  buildKey(category: string, name: string): string {
    const base = this.getServiceBase();
    return `${base}.${category}/${name}`;
  }

  /**
   * Parse reverse-DNS key into components
   */
  parseKey(fullKey: string): { service: string; category: string; name: string } {
    const [servicePart, namePart] = fullKey.split('/');
    const parts = servicePart.split('.');
    return {
      service: parts.slice(0, -1).join('.'),
      category: parts[parts.length - 1],
      name: namePart
    };
  }

  private getServiceBase(): string {
    const map: Record<string, string> = {
      development: "com.factory-wager.dev",
      staging: "com.factory-wager.staging",
      production: "com.factory-wager.prod"
    };
    return map[this.profile] || map.development;
  }

  /**
   * List all secrets for current profile with status
   */
  async list(): Promise<Array<SecretDefinition & { status: "present" | "missing"; value?: string }>> {
    const definitions = PROFILE_SECRETS[this.profile] || [];

    return Promise.all(definitions.map(async def => {
      const key = this.buildKey(def.category, def.name);

      try {
        // Attempt to retrieve from Bun.secrets using reverse-DNS format
        const value = await this.getFromBunSecrets(def.category, def.name);
        return { ...def, status: "present", value: value ? "****" : undefined };
      } catch {
        return { ...def, status: "missing" };
      }
    }));
  }

  /**
   * Retrieve secret from Bun.secrets with fallback
   */
  private async getFromBunSecrets(category: string, name: string): Promise<string | null> {
    try {
      // Try reverse-DNS format first: service, name
      const service = this.getServiceBase();
      const secret = await (Bun.secrets.get as any)(service, name);
      return secret?.toString() || null;
    } catch {
      // Fallback to legacy format: category, name
      try {
        const secret = await (Bun.secrets.get as any)(category, name);
        return secret?.toString() || null;
      } catch {
        return null;
      }
    }
  }

  /**
   * Public method to get a secret value
   */
  async getSecret(category: string, name: string): Promise<string | null> {
    return this.getFromBunSecrets(category, name);
  }

  /**
   * Store secret with reverse-DNS namespacing
   */
  async set(category: string, name: string, value: string): Promise<void> {
    const service = this.getServiceBase();
    await (Bun.secrets.set as any)(service, name, value);
    console.log(`${GLYPH.SECURE} Stored: ${service}.${category}/${name}`);
  }

  /**
   * Delete secret
   */
  async delete(category: string, name: string): Promise<boolean> {
    const service = this.getServiceBase();
    try {
      const deleted = await (Bun.secrets.delete as any)(service, name);
      if (deleted) {
        console.log(`${GLYPH.SECURE} Deleted: ${service}.${category}/${name}`);
      }
      return deleted;
    } catch {
      return false;
    }
  }

  /**
   * Validate required secrets
   */
  async validate(): Promise<{ valid: boolean; missing: string[] }> {
    const secrets = await this.list();
    const missing = secrets
      .filter(s => s.status === "missing" && s.required)
      .map(s => this.buildKey(s.category, s.name));

    return {
      valid: missing.length === 0,
      missing
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION: CLI Interface (Profiles CLI Integration)
// ═══════════════════════════════════════════════════════════════════════════════

class ProfilesCLI {
  private resolver: ProfileSecretResolver;

  constructor() {
    this.resolver = new ProfileSecretResolver();
  }

  async run(args: string[]): Promise<void> {
    const command = args[0] || "help";
    const subcommand = args[1];

    switch (command) {
      case "secrets":
        await this.handleSecrets(subcommand);
        break;
      case "switch":
        await this.handleSwitch(subcommand);
        break;
      case "migrate":
        await this.handleMigrate(args.slice(1));
        break;
      default:
        this.showHelp();
    }
  }

  private async handleSecrets(subcommand?: string): Promise<void> {
    switch (subcommand) {
      case "list":
        await this.listSecrets();
        break;
      case "set":
        // profiles:secrets:set <category> <name> <value>
        if (process.argv.length < 6) {
          console.log("Usage: profiles:secrets:set <category> <name> <value>");
          return;
        }
        await this.resolver.set(process.argv[4], process.argv[5], process.argv[6]);
        break;
      case "get":
        if (process.argv.length < 5) {
          console.log("Usage: profiles:secrets:get <category> <name>");
          return;
        }
        const value = await this.resolver.getSecret(process.argv[4], process.argv[5]);
        if (value) {
          console.log(`${GLYPH.SECURE} ${this.resolver.buildKey(process.argv[4], process.argv[5])}: ${value.substring(0, 8)}...`);
        } else {
          console.log(`${GLYPH.MISSING} Secret not found: ${this.resolver.buildKey(process.argv[4], process.argv[5])}`);
        }
        break;
      case "validate":
        const validation = await this.resolver.validate();
        if (validation.valid) {
          console.log(`${GLYPH.SECURE} All required secrets are configured for profile '${this.resolver['profile']}'`);
        } else {
          console.log(`${GLYPH.MISSING} Missing required secrets for profile '${this.resolver['profile']}':`);
          validation.missing.forEach(key => console.log(`  - ${key}`));
        }
        break;
      default:
        console.log(`
${GLYPH.SECURE} Profile Secrets Commands:
  list              List all secrets for active profile
  set <cat> <name>  Set a secret value
  get <cat> <name>  Get a secret value
  validate          Validate required secrets
        `);
    }
  }

  private async handleMigrate(args: string[]): Promise<void> {
    const from = args.find(arg => arg.startsWith('--from='))?.split('=')[1];
    const to = args.find(arg => arg.startsWith('--to='))?.split('=')[1];

    if (from === 'legacy' && to === 'reverse-dns') {
      const migrator = new SecretMigrator();
      const profile = Bun.env.FW_ACTIVE_PROFILE || 'development';
      await migrator.migrate(profile);
    } else {
      console.log(`
${GLYPH.SYNC} Migration Commands:
  profiles:migrate --from=legacy --to=reverse-dns    Migrate legacy secrets to reverse-DNS format

Supported migrations:
  legacy → reverse-dns    Convert environment variables to namespaced secrets
      `);
    }
  }

  private async listSecrets(): Promise<void> {
    const profile = Bun.env.FW_ACTIVE_PROFILE || "development";
    console.log(`${GLYPH.SECURE} Secrets for profile '${profile}':\n`);

    const secrets = await this.resolver.list();

    for (const secret of secrets) {
      const key = this.resolver.buildKey(secret.category, secret.name);
      const icon = secret.status === "present" ? "✅" : GLYPH.MISSING;
      const reqLabel = secret.required ? "[REQUIRED]" : "[OPTIONAL]";

      console.log(`${icon} ${reqLabel} ${key}`);
      console.log(`    ${secret.description}`);

      if (secret.status === "missing" && secret.required) {
        console.log(`    ⚠️  This secret is required for ${profile} operations`);
      }
      console.log();
    }

    // Summary
    const present = secrets.filter(s => s.status === "present").length;
    const requiredMissing = secrets.filter(s => s.status === "missing" && s.required).length;

    console.log(`${GLYPH.SYNC} Summary: ${present}/${secrets.length} secrets configured`);
    if (requiredMissing > 0) {
      console.log(`${GLYPH.MISSING} Warning: ${requiredMissing} required secrets missing`);
    }
  }

  private async handleSwitch(profile?: string): Promise<void> {
    if (!profile) {
      console.log(`Active profile: ${Bun.env.FW_ACTIVE_PROFILE || "development"}`);
      return;
    }

    // Update environment
    (Bun.env as Record<string, string>).FW_ACTIVE_PROFILE = profile;
    console.log(`${GLYPH.PROFILE} Switched to profile: ${profile}`);

    // Re-initialize resolver
    this.resolver = new ProfileSecretResolver(profile);
    await this.listSecrets();
  }

  private showHelp(): void {
    console.log(`
${GLYPH.NAMESPACE} FactoryWager Profile Manager v5.7

Commands:
  secrets list          List profile secrets
  secrets set <c> <n>   Set secret value
  secrets get <c> <n>   Get secret value
  secrets validate      Validate required secrets
  switch <profile>      Switch active profile

Profiles: development, staging, production
Namespace: com.factory-wager.{profile}
    `);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION: Migration Helper (Legacy → Reverse-DNS)
// ═══════════════════════════════════════════════════════════════════════════════

class SecretMigrator {
  /**
   * Migrate legacy secrets to reverse-DNS format
   */
  async migrate(profile: string): Promise<void> {
    const legacyMappings: Record<string, { category: string; name: string }> = {
      "CLOUDFLARE_API_TOKEN": { category: "cloudflare", name: "API_TOKEN" },
      "R2_ACCESS_KEY": { category: "r2", name: "AWS_ACCESS_KEY_ID" },
      "REGISTRY_TOKEN": { category: "registry", name: "api-token" }
    };

    console.log(`${GLYPH.SYNC} Migrating secrets to reverse-DNS format...`);

    for (const [legacyKey, target] of Object.entries(legacyMappings)) {
      const value = Bun.env[legacyKey];
      if (value) {
        const resolver = new ProfileSecretResolver(profile);
        await resolver.set(target.category, target.name, value);
        console.log(`  ✅ Migrated ${legacyKey} → ${target.category}/${target.name}`);
      }
    }
  }

  /**
   * Populate development secrets with sample values
   */
  async populateDevelopment(): Promise<void> {
    const resolver = new ProfileSecretResolver("development");
    const timestamp = Date.now();

    await resolver.set("registry", "api-token", `dev-registry-${timestamp}`);
    await resolver.set("r2", "access-key", `dev-r2-key-${timestamp}`);
    await resolver.set("database", "url", `postgresql://localhost:5432/dev_${timestamp}`);

    console.log(`${GLYPH.SECURE} Development secrets populated successfully`);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION: Execution
// ═══════════════════════════════════════════════════════════════════════════════

if (import.meta.main) {
  const cli = new ProfilesCLI();
  await cli.run(Bun.argv.slice(2));
}

export { ProfileSecretResolver, SecretMigrator, PROFILE_SECRETS, ProfilesCLI };
