const SENSITIVE_PATTERNS = [
  "SECRET",
  "PASSWORD",
  "TOKEN",
  "KEY",
  "CREDENTIAL",
  "_AUTH",
  "_PRIVATE",
  "_CERT",
  "API_KEY",
];

export function isSensitiveKey(key: string): boolean {
  const upperKey = key.toUpperCase();
  return SENSITIVE_PATTERNS.some((pattern) => upperKey.includes(pattern));
}

export function maskValue(key: string, value: string): string {
  if (isSensitiveKey(key)) {
    return "************";
  }
  return value;
}

export function printValidation(passed: boolean, errors: string[] = [], warnings: string[] = []): void {
  if (passed) {
    console.log("\x1b[32m✓ Validation: PASSED\x1b[0m");
  } else {
    console.log("\x1b[31m✗ Validation: FAILED\x1b[0m");
  }

  for (const error of errors) {
    console.log(`  \x1b[31m✗ ${error}\x1b[0m`);
  }

  for (const warning of warnings) {
    console.log(`  \x1b[33m⚠ ${warning}\x1b[0m`);
  }
}

export interface EnvChange {
  key: string;
  newValue: string;
  oldValue?: string;
  isNew: boolean;
  isChanged: boolean;
}

export function computeChanges(
  newEnv: Record<string, string>,
  currentEnv: Record<string, string | undefined>
): EnvChange[] {
  const changes: EnvChange[] = [];

  for (const [key, newValue] of Object.entries(newEnv)) {
    const oldValue = currentEnv[key];
    const isNew = oldValue === undefined;
    const isChanged = !isNew && oldValue !== newValue;

    changes.push({
      key,
      newValue,
      oldValue,
      isNew,
      isChanged,
    });
  }

  return changes.sort((a, b) => a.key.localeCompare(b.key));
}

export function printEnvChanges(
  newEnv: Record<string, string>,
  currentEnv: Record<string, string | undefined>,
  dryRun: boolean
): void {
  const changes = computeChanges(newEnv, currentEnv);
  const verb = dryRun ? "Would set" : "Setting";

  console.log(`\n${verb} ${changes.length} environment variables:`);

  for (const change of changes) {
    const maskedNew = maskValue(change.key, change.newValue);
    let line = `  ${change.key}=${maskedNew}`;

    if (change.isChanged && change.oldValue !== undefined) {
      const maskedOld = maskValue(change.key, change.oldValue);
      line += ` \x1b[33m(was: ${maskedOld})\x1b[0m`;
    } else if (change.isNew) {
      line += " \x1b[32m(new)\x1b[0m";
    }

    if (isSensitiveKey(change.key)) {
      line += " \x1b[90m(masked)\x1b[0m";
    }

    console.log(line);
  }
}

export interface Conflict {
  key: string;
  currentValue: string;
  newValue: string;
}

export function detectConflicts(
  newEnv: Record<string, string>,
  currentEnv: Record<string, string | undefined>
): Conflict[] {
  const conflicts: Conflict[] = [];

  for (const [key, newValue] of Object.entries(newEnv)) {
    const currentValue = currentEnv[key];
    if (currentValue !== undefined && currentValue !== newValue) {
      conflicts.push({ key, currentValue, newValue });
    }
  }

  return conflicts.sort((a, b) => a.key.localeCompare(b.key));
}

export function printConflicts(conflicts: Conflict[]): void {
  if (conflicts.length === 0) return;

  console.log(`\n\x1b[33m⚠ Conflicts detected (${conflicts.length}):\x1b[0m`);

  for (const conflict of conflicts) {
    const maskedCurrent = maskValue(conflict.key, conflict.currentValue);
    const maskedNew = maskValue(conflict.key, conflict.newValue);
    console.log(`  ${conflict.key}: ${maskedCurrent} → ${maskedNew}`);
  }
}

export function printExportStatements(env: Record<string, string>): void {
  const sortedKeys = Object.keys(env).sort();
  for (const key of sortedKeys) {
    const value = env[key];
    const escapedValue = value.replace(/'/g, "'\\''");
    console.log(`export ${key}='${escapedValue}'`);
  }
}
