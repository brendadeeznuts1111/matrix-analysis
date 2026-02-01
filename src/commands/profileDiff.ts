import { loadProfile } from "../lib/profileLoader";
import { maskValue } from "../lib/output";
import { EXIT_CODES } from "../../.claude/lib/exit-codes.ts";
import { fmt } from "../../.claude/lib/cli.ts";

interface DiffEntry {
  key: string;
  left?: string;
  right?: string;
  status: "added" | "removed" | "changed" | "unchanged";
}

export async function profileDiff(
  leftName: string,
  rightName: string,
  options?: { showUnchanged?: boolean }
): Promise<void> {
  const [left, right] = await Promise.all([
    loadProfile(leftName),
    loadProfile(rightName),
  ]);

  if (!left) {
    console.error(fmt.fail(`Profile "${leftName}" not found`));
    process.exit(EXIT_CODES.NOT_FOUND);
  }

  if (!right) {
    console.error(fmt.fail(`Profile "${rightName}" not found`));
    process.exit(EXIT_CODES.NOT_FOUND);
  }

  const allKeys = new Set([
    ...Object.keys(left.env),
    ...Object.keys(right.env),
  ]);

  const diffs: DiffEntry[] = [];

  for (const key of [...allKeys].sort()) {
    const leftVal = left.env[key];
    const rightVal = right.env[key];

    if (leftVal === undefined) {
      diffs.push({ key, right: rightVal, status: "added" });
    } else if (rightVal === undefined) {
      diffs.push({ key, left: leftVal, status: "removed" });
    } else if (leftVal !== rightVal) {
      diffs.push({ key, left: leftVal, right: rightVal, status: "changed" });
    } else if (options?.showUnchanged) {
      diffs.push({ key, left: leftVal, right: rightVal, status: "unchanged" });
    }
  }

  console.log(fmt.bold(`Comparing profiles: ${leftName} ↔ ${rightName}`) + "\n");

  const added = diffs.filter((d) => d.status === "added");
  const removed = diffs.filter((d) => d.status === "removed");
  const changed = diffs.filter((d) => d.status === "changed");

  if (added.length === 0 && removed.length === 0 && changed.length === 0) {
    console.log(fmt.ok("Profiles are identical"));
    return;
  }

  // Summary
  const parts: string[] = [];
  if (added.length > 0) parts.push(`${fmt.ok('+')}${added.length} added`);
  if (removed.length > 0) parts.push(`${fmt.fail('-')}${removed.length} removed`);
  if (changed.length > 0) parts.push(`${fmt.warn('~')}${changed.length} changed`);
  console.log(parts.join("  ") + "\n");

  // Details
  if (added.length > 0) {
    console.log(fmt.ok(`── Added in ${rightName} ──`));
    for (const d of added) {
      console.log(`  ${fmt.ok('+')} ${d.key} = ${maskValue(d.key, d.right!)}`);
    }
    console.log();
  }

  if (removed.length > 0) {
    console.log(fmt.fail(`── Removed from ${rightName} ──`));
    for (const d of removed) {
      console.log(`  ${fmt.fail('-')} ${d.key} = ${maskValue(d.key, d.left!)}`);
    }
    console.log();
  }

  if (changed.length > 0) {
    console.log(fmt.warn(`── Changed ──`));
    for (const d of changed) {
      console.log(`  ${fmt.warn('~')} ${d.key}`);
      console.log(`    ${leftName}: ${maskValue(d.key, d.left!)}`);
      console.log(`    ${rightName}: ${maskValue(d.key, d.right!)}`);
    }
  }
}
