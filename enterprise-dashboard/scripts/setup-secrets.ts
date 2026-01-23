#!/usr/bin/env bun
/**
 * Setup Production Secrets
 * Stores sensitive credentials in OS keychain via Bun.secrets
 */

const SERVICE = "matrix-analysis";

const secrets = [
  { name: "npm-token", env: "NPM_TOKEN", description: "npm registry auth token" },
  { name: "registry-password", env: "NPM_PASSWORD", description: "Azure/JFrog registry password" },
] as const;

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (command === "list") {
    console.log("Configured secrets:");
    for (const { name, description } of secrets) {
      const exists = await Bun.secrets.get({ service: SERVICE, name }).catch(() => null);
      const status = exists ? "set" : "not set";
      console.log(`  ${name}: ${status} - ${description}`);
    }
    return;
  }

  if (command === "delete") {
    const name = args[1];
    if (!name) {
      console.error("Usage: bun scripts/setup-secrets.ts delete <secret-name>");
      process.exit(1);
    }
    await Bun.secrets.delete({ service: SERVICE, name });
    console.log(`Deleted ${name} from keychain`);
    return;
  }

  // Default: store secrets from environment
  console.log(`Storing secrets in OS keychain (service: ${SERVICE})...\n`);

  let stored = 0;
  let skipped = 0;

  for (const { name, env, description } of secrets) {
    const value = process.env[env];
    if (value) {
      await Bun.secrets.set({ service: SERVICE, name, value });
      console.log(`[stored] ${name} (from $${env})`);
      stored++;
    } else {
      console.log(`[skip]   ${name} - $${env} not set`);
      skipped++;
    }
  }

  console.log(`\nDone: ${stored} stored, ${skipped} skipped`);

  if (skipped > 0) {
    console.log("\nTo set missing secrets:");
    for (const { name, env } of secrets) {
      if (!process.env[env]) {
        console.log(`  export ${env}="your-token" && bun scripts/setup-secrets.ts`);
      }
    }
  }
}

main().catch(console.error);
