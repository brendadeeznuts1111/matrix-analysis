#!/usr/bin/env bun
/**
 * FactoryWager Profiles CLI with Bun.secrets Integration
 * Secure credential management for profile-based development
 */

import { profileManager, ProfileUtils } from './profiles.ts';

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    showHelp();
    return;
  }

  const command = args[0];
  const commandArgs = args.slice(1);

  try {
    switch (command) {
      case 'list':
        await handleList(commandArgs);
        break;
      
      case 'use':
      case 'switch':
        handleSwitch(commandArgs);
        break;
      
      case 'secrets':
        await handleSecrets(commandArgs);
        break;
      
      case 'export':
        handleExport(commandArgs);
        break;
      
      case 'init':
        ProfileUtils.init();
        break;
      
      case 'status':
        handleStatus();
        break;
      
      default:
        console.error(`❌ Unknown command: ${command}`);
        showHelp();
        process.exit(1);
    }
  } catch (error) {
    console.error(`❌ Error: ${(error as Error).message}`);
    process.exit(1);
  }
}

function showHelp(): void {
  console.log(`
🔧 FactoryWager Profiles CLI - Secure Credential Management

USAGE:
  bun run .factory-wager/config/profiles-cli.ts <command> [options]

COMMANDS:
  list                    List all available profiles
  use <profile>           Switch to a profile
  switch <profile>        Alias for 'use'
  secrets <action>        Manage secrets for current profile
  export <profile> <file> Export profile configuration
  init                    Initialize profile system
  status                  Show current profile status

SECRETS ACTIONS:
  secrets list            List all secrets for current profile
  secrets set <service> <name> [value]  Set a secret
  secrets get <service> <name>         Get a secret
  secrets delete <service> <name>      Delete a secret
  secrets validate        Validate all required secrets
  secrets setup           Setup wizard for secrets
  secrets migrate         Migrate from environment variables

EXAMPLES:
  bun run .factory-wager/config/profiles-cli.ts list
  bun run .factory-wager/config/profiles-cli.ts use production
  bun run .factory-wager/config/profiles-cli.ts secrets list
  bun run .factory-wager/config/profiles-cli.ts secrets set com.factory-wager.prod.registry api-token
  bun run .factory-wager/config/profiles-cli.ts secrets validate
  bun run .factory-wager/config/profiles-cli.ts export production ./prod-profile.json

SECURITY FEATURES:
  ✅ Encrypted storage using OS credential manager
  ✅ User-level access control (CRED_PERSIST_ENTERPRISE on Windows)
  ✅ Memory safety - secrets zeroed after use
  ✅ Profile-based credential isolation
  ✅ Required secret validation
`);
}

async function handleList(args: string[]): Promise<void> {
  if (args.includes('--secrets')) {
    await ProfileUtils.listSecrets();
  } else {
    profileManager.listProfiles();
  }
}

function handleSwitch(args: string[]): void {
  if (args.length === 0) {
    console.error('❌ Profile name required');
    console.log('Usage: bun run .factory-wager/config/profiles-cli.ts use <profile>');
    process.exit(1);
  }
  
  ProfileUtils.switchProfile(args[0]);
}

async function handleSecrets(args: string[]): Promise<void> {
  if (args.length === 0) {
    console.error('❌ Secrets action required');
    console.log('Available actions: list, set, get, delete, validate, setup, migrate');
    process.exit(1);
  }

  const action = args[0];
  const actionArgs = args.slice(1);

  switch (action) {
    case 'list':
      await ProfileUtils.listSecrets();
      break;
    
    case 'set':
      if (actionArgs.length < 2) {
        console.error('❌ Service and name required');
        console.log('Usage: secrets set <service> <name> [value]');
        process.exit(1);
      }
      await ProfileUtils.setSecret(actionArgs[0], actionArgs[1], actionArgs[2]);
      break;
    
    case 'get':
      if (actionArgs.length < 2) {
        console.error('❌ Service and name required');
        console.log('Usage: secrets get <service> <name>');
        process.exit(1);
      }
      await ProfileUtils.getSecret(actionArgs[0], actionArgs[1]);
      break;
    
    case 'delete':
      if (actionArgs.length < 2) {
        console.error('❌ Service and name required');
        console.log('Usage: secrets delete <service> <name>');
        process.exit(1);
      }
      await ProfileUtils.deleteSecret(actionArgs[0], actionArgs[1]);
      break;
    
    case 'validate':
      await ProfileUtils.validateSecrets();
      break;
    
    case 'setup':
      await ProfileUtils.setupSecrets();
      break;
    
    case 'migrate':
      await ProfileUtils.migrateFromEnv();
      break;
    
    default:
      console.error(`❌ Unknown secrets action: ${action}`);
      console.log('Available actions: list, set, get, delete, validate, setup, migrate');
      process.exit(1);
  }
}

function handleExport(args: string[]): void {
  if (args.length < 2) {
    console.error('❌ Profile name and file path required');
    console.log('Usage: bun run .factory-wager/config/profiles-cli.ts export <profile> <file>');
    process.exit(1);
  }
  
  ProfileUtils.exportProfile(args[0], args[1]);
}

function handleStatus(): void {
  const activeProfile = profileManager.getActiveProfileName();
  const activeProfileData = profileManager.getActiveProfile();
  
  if (activeProfile && activeProfileData) {
    console.log(`📊 Current Profile Status:`);
    console.log(`   Profile: ${activeProfile}`);
    console.log(`   Environment: ${activeProfileData.environment}`);
    console.log(`   Mode: ${activeProfileData.factoryWager.mode}`);
    console.log(`   Theme: ${activeProfileData.terminal.theme}`);
    
    if (activeProfileData.secrets && activeProfileData.secrets.length > 0) {
      const requiredCount = activeProfileData.secrets.filter(s => s.required).length;
      console.log(`   Secrets: ${activeProfileData.secrets.length} configured (${requiredCount} required)`);
    }
  } else {
    console.log('❌ No active profile set');
    console.log('Use: bun run .factory-wager/config/profiles-cli.ts use <profile>');
  }
}

if (import.meta.main) {
  main();
}
