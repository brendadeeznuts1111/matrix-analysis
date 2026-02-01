#!/usr/bin/env bun
/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * FactoryWager Secrets Persistence Guide & Implementation
 * Bun.secrets API with CRED_PERSIST_* levels and best practices
 * ═══════════════════════════════════════════════════════════════════════════════
 */

declare module "bun" {
  interface Env {
    FW_SECRET_PERSISTENCE: "session" | "local" | "enterprise";
    FW_SECRET_SCOPE: "user" | "machine" | "domain";
  }
}

const GLYPH = {
  PERSISTENCE: "🔐",
  SESSION: "⏰",
  LOCAL: "🖥️",
  ENTERPRISE: "🏢",
  WARNING: "⚠️",
  SUCCESS: "✅"
} as const;

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION: Credential Persistence Levels
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Bun Secrets Persistence Levels (Windows Credential Manager API)
 * Maps to CRED_PERSIST_* constants for different storage durations
 */
export enum SecretPersistence {
  SESSION = "session",           // CRED_PERSIST_SESSION - Until logout/restart
  LOCAL_MACHINE = "local",       // CRED_PERSIST_LOCAL_MACHINE - Until explicitly removed
  ENTERPRISE = "enterprise"      // CRED_PERSIST_ENTERPRISE - Roaming across domain
}

/**
 * Platform-specific persistence capabilities
 */
export const PERSISTENCE_CAPABILITIES: Record<string, Record<SecretPersistence, { supported: boolean; description: string }>> = {
  win32: {
    [SecretPersistence.SESSION]: { supported: true, description: "Until logout/restart" },
    [SecretPersistence.LOCAL_MACHINE]: { supported: true, description: "Until explicitly removed" },
    [SecretPersistence.ENTERPRISE]: { supported: true, description: "Roaming across domain" }
  },
  darwin: {
    [SecretPersistence.SESSION]: { supported: true, description: "Until logout/restart" },
    [SecretPersistence.LOCAL_MACHINE]: { supported: true, description: "Until explicitly removed" },
    [SecretPersistence.ENTERPRISE]: { supported: false, description: "Not supported on macOS" }
  },
  linux: {
    [SecretPersistence.SESSION]: { supported: true, description: "Until logout/restart" },
    [SecretPersistence.LOCAL_MACHINE]: { supported: true, description: "Until explicitly removed" },
    [SecretPersistence.ENTERPRISE]: { supported: false, description: "Not supported on Linux" }
  },
  // Fallback for unknown platforms
  fallback: {
    [SecretPersistence.SESSION]: { supported: true, description: "Until logout/restart" },
    [SecretPersistence.LOCAL_MACHINE]: { supported: true, description: "Until explicitly removed" },
    [SecretPersistence.ENTERPRISE]: { supported: false, description: "Not supported on this platform" }
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION: Enhanced Secret Manager with Persistence Levels
// ═══════════════════════════════════════════════════════════════════════════════

export interface SecretMetadata {
  service: string;
  name: string;
  value: string;
  persistence: SecretPersistence;
  description?: string;
  category: string;
  required: boolean;
  createdAt: string;
  expiresAt?: string;
}

export class EnhancedSecretManager {
  private platform: NodeJS.Platform;
  private defaultPersistence: SecretPersistence;

  constructor() {
    this.platform = process.platform;
    this.defaultPersistence = this.getDefaultPersistence();
  }

  /**
   * Get platform-appropriate default persistence level
   */
  private getDefaultPersistence(): SecretPersistence {
    const envPersistence = Bun.env.FW_SECRET_PERSISTENCE;
    if (envPersistence && Object.values(SecretPersistence).includes(envPersistence as SecretPersistence)) {
      return envPersistence as SecretPersistence;
    }

    // Platform-specific defaults
    switch (this.platform) {
      case 'win32':
        return SecretPersistence.ENTERPRISE; // Best for enterprise environments
      case 'darwin':
        return SecretPersistence.LOCAL_MACHINE; // Keychain default
      case 'linux':
        return SecretPersistence.LOCAL_MACHINE; // libsecret default
      default:
        return SecretPersistence.SESSION; // Fallback
    }
  }

  /**
   * Validate persistence support
   */
  private validatePersistence(persistence: SecretPersistence): { supported: boolean; description: string } {
    const capabilities = PERSISTENCE_CAPABILITIES[this.platform] || PERSISTENCE_CAPABILITIES.fallback;
    return capabilities[persistence] || { supported: false, description: "Unknown persistence level" };
  }

  /**
   * Store secret with specified persistence level
   */
  async storeSecret(metadata: Omit<SecretMetadata, 'createdAt'>): Promise<void> {
    const secret: SecretMetadata = {
      ...metadata,
      createdAt: new Date().toISOString(),
      persistence: metadata.persistence || this.getDefaultPersistence()
    };

    // Validate persistence support
    const capability = this.validatePersistence(secret.persistence);
    if (!capability.supported) {
      const supportedLevels = Object.keys(PERSISTENCE_CAPABILITIES[this.platform] || PERSISTENCE_CAPABILITIES.fallback);
      throw new Error(`Persistence level '${secret.persistence}' not supported on ${this.platform}. Use: ${supportedLevels.join(', ')}`);
    }

    try {
      // Store with platform-specific options
      await this.storeWithPersistence(secret);
      console.log(`${GLYPH.SUCCESS} Secret stored with ${secret.persistence} persistence: ${secret.service}/${secret.name}`);
      console.log(`   ${GLYPH.PERSISTENCE} Duration: ${capability.description}`);
    } catch (error) {
      throw new Error(`Failed to store secret: ${(error as Error).message}`);
    }
  }

  /**
   * Platform-specific secret storage with persistence
   */
  private async storeWithPersistence(secret: SecretMetadata): Promise<void> {
    // Note: Bun.secrets API doesn't expose persistence options directly
    // This is a conceptual implementation showing how it would work
    // In practice, persistence is handled by the underlying OS credential manager

    const service = this.buildServiceKey(secret.service, secret.category);

    // Store the secret value
    await (Bun.secrets.set as any)(service, secret.name, secret.value);

    // Store metadata separately (in a real implementation, this would be part of the credential)
    const metadataKey = `${service}.${secret.name}.meta`;
    const metadataValue = JSON.stringify({
      persistence: secret.persistence,
      description: secret.description,
      category: secret.category,
      required: secret.required,
      createdAt: secret.createdAt,
      expiresAt: secret.expiresAt
    });

    await (Bun.secrets.set as any)(metadataKey, 'metadata', metadataValue);
  }

  /**
   * Retrieve secret with metadata
   */
  async retrieveSecret(service: string, name: string): Promise<SecretMetadata | null> {
    try {
      const serviceKey = this.buildServiceKey(service, '');
      const value = await (Bun.secrets.get as any)(serviceKey, name);

      if (!value) {
        return null;
      }

      // Try to retrieve metadata
      const metadataKey = `${serviceKey}.${name}.meta`;
      const metadataValue = await (Bun.secrets.get as any)(metadataKey, 'metadata');

      let metadata: Record<string, any> = {};
      if (metadataValue) {
        try {
          metadata = JSON.parse(metadataValue);
        } catch {
          // Metadata corrupted or missing
        }
      }

      return {
        service,
        name,
        value: value.toString(),
        persistence: metadata.persistence || this.defaultPersistence,
        description: metadata.description,
        category: metadata.category || 'general',
        required: metadata.required || false,
        createdAt: metadata.createdAt || new Date().toISOString(),
        expiresAt: metadata.expiresAt
      };
    } catch {
      return null;
    }
  }

  /**
   * Delete secret and its metadata
   */
  async deleteSecret(service: string, name: string): Promise<boolean> {
    try {
      const serviceKey = this.buildServiceKey(service, '');

      // Delete the secret
      const secretDeleted = await (Bun.secrets.delete as any)(serviceKey, name);

      // Delete metadata
      const metadataKey = `${serviceKey}.${name}.meta`;
      const metadataDeleted = await (Bun.secrets.delete as any)(metadataKey, 'metadata');

      return secretDeleted || metadataDeleted;
    } catch {
      return false;
    }
  }

  /**
   * List all secrets with their persistence levels
   */
  async listSecrets(servicePrefix?: string): Promise<SecretMetadata[]> {
    // Note: Bun.secrets doesn't provide a list API
    // This is a conceptual implementation
    // In practice, you'd need to maintain an index or use platform-specific APIs

    const secrets: SecretMetadata[] = [];

    // For FactoryWager, we know the expected secrets
    const knownSecrets = [
      { service: 'com.factory-wager.dev', category: 'registry', name: 'api-token' },
      { service: 'com.factory-wager.dev', category: 'r2', name: 'access-key' },
      { service: 'com.factory-wager.dev', category: 'database', name: 'url' },
      { service: 'com.factory-wager.prod', category: 'registry', name: 'api-token' },
      { service: 'com.factory-wager.prod', category: 'r2', name: 'access-key' },
      { service: 'com.factory-wager.prod', category: 'ssl', name: 'certificate' }
    ];

    for (const secretInfo of knownSecrets) {
      if (servicePrefix && !secretInfo.service.startsWith(servicePrefix)) {
        continue;
      }

      const secret = await this.retrieveSecret(secretInfo.service, secretInfo.name);
      if (secret) {
        secrets.push(secret);
      }
    }

    return secrets;
  }

  /**
   * Show persistence capabilities for current platform
   */
  showPersistenceCapabilities(): void {
    console.log(`\n${GLYPH.PERSISTENCE} Bun Secrets Persistence - ${this.platform.toUpperCase()}\n`);

    const capabilities = PERSISTENCE_CAPABILITIES[this.platform] || PERSISTENCE_CAPABILITIES.fallback;

    Object.entries(capabilities).forEach(([level, info]) => {
      const icon = info.supported ? GLYPH.SUCCESS : GLYPH.WARNING;
      const status = info.supported ? 'Supported' : 'Not Supported';
      console.log(`${icon} ${level.padEnd(12)} ${status.padEnd(14)} ${info.description}`);
    });

    console.log(`\nDefault: ${this.getDefaultPersistence()}`);
    console.log(`Environment Variable: FW_SECRET_PERSISTENCE\n`);
  }

  private buildServiceKey(service: string, category: string): string {
    return category ? `${service}.${category}` : service;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION: Best Practices Guide
// ═══════════════════════════════════════════════════════════════════════════════

export class SecretBestPractices {
  private manager: EnhancedSecretManager;

  constructor() {
    this.manager = new EnhancedSecretManager();
  }

  /**
   * Store development secrets with session persistence
   */
  async storeDevelopmentSecrets(): Promise<void> {
    const devSecrets = [
      {
        service: 'com.factory-wager.dev',
        name: 'api-token',
        value: `dev-token-${Date.now()}`,
        persistence: SecretPersistence.SESSION,
        category: 'registry',
        required: false,
        description: 'Development registry API token (session-based)'
      },
      {
        service: 'com.factory-wager.dev',
        name: 'db-password',
        value: 'dev-db-pass',
        persistence: SecretPersistence.SESSION,
        category: 'database',
        required: false,
        description: 'Development database password (session-based)'
      }
    ];

    for (const secret of devSecrets) {
      await this.manager.storeSecret(secret);
    }
  }

  /**
   * Store production secrets with enterprise persistence
   */
  async storeProductionSecrets(): Promise<void> {
    const prodSecrets = [
      {
        service: 'com.factory-wager.prod',
        name: 'api-token',
        value: 'prod-api-token-secure',
        persistence: SecretPersistence.ENTERPRISE,
        category: 'registry',
        required: true,
        description: 'Production registry API token (enterprise roaming)'
      },
      {
        service: 'com.factory-wager.prod',
        name: 'ssl-certificate',
        value: '-----BEGIN CERTIFICATE-----\n...\n-----END CERTIFICATE-----',
        persistence: SecretPersistence.ENTERPRISE,
        category: 'ssl',
        required: true,
        description: 'Production SSL certificate (enterprise roaming)'
      }
    ];

    for (const secret of prodSecrets) {
      await this.manager.storeSecret(secret);
    }
  }

  /**
   * Store service account secrets with local machine persistence
   */
  async storeServiceAccountSecrets(): Promise<void> {
    const serviceSecrets = [
      {
        service: 'com.factory-wager.service',
        name: 'daemon-token',
        value: 'service-daemon-token',
        persistence: SecretPersistence.LOCAL_MACHINE,
        category: 'service',
        required: true,
        description: 'Daemon service account token (local machine)'
      }
    ];

    for (const secret of serviceSecrets) {
      await this.manager.storeSecret(secret);
    }
  }

  /**
   * Show best practices recommendations
   */
  showBestPractices(): void {
    console.log(`
${GLYPH.PERSISTENCE} BUN SECRETS BEST PRACTICES

${GLYPH.SESSION} SESSION PERSISTENCE (CRED_PERSIST_SESSION)
  Use Case: Development, testing, temporary credentials
  Duration: Until logout/restart
  Examples:
    - Development API tokens
    - Test database passwords
    - Temporary auth tokens
  Command: FW_SECRET_PERSISTENCE=session bun run secrets:v5.7:set

${GLYPH.LOCAL} LOCAL MACHINE PERSISTENCE (CRED_PERSIST_LOCAL_MACHINE)
  Use Case: Service accounts, daemons, user-specific credentials
  Duration: Until explicitly removed
  Examples:
    - Service account tokens
    - User SSH keys
    - Local database credentials
  Command: FW_SECRET_PERSISTENCE=local bun run secrets:v5.7:set

${GLYPH.ENTERPRISE} ENTERPRISE PERSISTENCE (CRED_PERSIST_ENTERPRISE)
  Use Case: Enterprise SSO, roaming credentials, domain users
  Duration: Roaming across domain
  Examples:
    - Enterprise API tokens
    - Domain user credentials
    - Roaming certificates
  Command: FW_SECRET_PERSISTENCE=enterprise bun run secrets:v5.7:set

🔐 SECURITY CONSIDERATIONS:
  • Use SESSION for development/testing only
  • Use LOCAL for service accounts and daemons
  • Use ENTERPRISE for corporate environments
  • Always validate required secrets before operations
  • Implement secret rotation policies
  • Monitor secret access and usage

⚠️  PLATFORM LIMITATIONS:
  • ENTERPRISE mode only available on Windows
  • macOS and Linux default to LOCAL persistence
  • Cross-platform compatibility requires fallback logic
`);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION: CLI Interface for Persistence Management
// ═══════════════════════════════════════════════════════════════════════════════

class PersistenceCLI {
  private manager: EnhancedSecretManager;
  private bestPractices: SecretBestPractices;

  constructor() {
    this.manager = new EnhancedSecretManager();
    this.bestPractices = new SecretBestPractices();
  }

  async run(args: string[]): Promise<void> {
    const command = args[0] || "help";

    switch (command) {
      case "capabilities":
        this.manager.showPersistenceCapabilities();
        break;
      case "best-practices":
        this.bestPractices.showBestPractices();
        break;
      case "store-dev":
        await this.bestPractices.storeDevelopmentSecrets();
        break;
      case "store-prod":
        await this.bestPractices.storeProductionSecrets();
        break;
      case "store-service":
        await this.bestPractices.storeServiceAccountSecrets();
        break;
      case "list":
        await this.listSecrets(args[1]);
        break;
      default:
        this.showHelp();
    }
  }

  private async listSecrets(servicePrefix?: string): Promise<void> {
    const secrets = await this.manager.listSecrets(servicePrefix);

    console.log(`\n${GLYPH.PERSISTENCE} Secrets with Persistence Levels:\n`);

    for (const secret of secrets) {
      const persistenceIcon = this.getPersistenceIcon(secret.persistence);
      console.log(`${persistenceIcon} ${secret.service}/${secret.name}`);
      console.log(`   Persistence: ${secret.persistence}`);
      console.log(`   Category: ${secret.category}`);
      console.log(`   Required: ${secret.required ? 'Yes' : 'No'}`);
      console.log(`   Created: ${secret.createdAt}`);
      if (secret.description) {
        console.log(`   Description: ${secret.description}`);
      }
      console.log();
    }
  }

  private getPersistenceIcon(persistence: SecretPersistence): string {
    switch (persistence) {
      case SecretPersistence.SESSION: return GLYPH.SESSION;
      case SecretPersistence.LOCAL_MACHINE: return GLYPH.LOCAL;
      case SecretPersistence.ENTERPRISE: return GLYPH.ENTERPRISE;
      default: return GLYPH.PERSISTENCE;
    }
  }

  private showHelp(): void {
    console.log(`
${GLYPH.PERSISTENCE} Bun Secrets Persistence Manager

Commands:
  capabilities           Show platform persistence capabilities
  best-practices         Display best practices guide
  store-dev             Store development secrets (session)
  store-prod            Store production secrets (enterprise)
  store-service         Store service account secrets (local)
  list [service]        List secrets with persistence levels

Environment Variables:
  FW_SECRET_PERSISTENCE  Set default persistence level
  FW_SECRET_SCOPE        Set secret scope (user/machine/domain)

Examples:
  FW_SECRET_PERSISTENCE=session bun run secrets:persistence store-dev
  FW_SECRET_PERSISTENCE=enterprise bun run secrets:persistence store-prod
  bun run secrets:persistence capabilities
    `);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION: Execution
// ═══════════════════════════════════════════════════════════════════════════════

if (import.meta.main) {
  const cli = new PersistenceCLI();
  await cli.run(Bun.argv.slice(2));
}
