import { loadProfile } from "../lib/profileLoader";
import { maskValue } from "../lib/output";

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
    console.error(`\x1b[31mError: Profile "${leftName}" not found\x1b[0m`);
    process.exit(1);
  }

  if (!right) {
    console.error(`\x1b[31mError: Profile "${rightName}" not found\x1b[0m`);
    process.exit(1);
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

  console.log(`\x1b[1mComparing profiles:\x1b[0m ${leftName} ↔ ${rightName}\n`);

  const added = diffs.filter((d) => d.status === "added");
  const removed = diffs.filter((d) => d.status === "removed");
  const changed = diffs.filter((d) => d.status === "changed");

  if (added.length === 0 && removed.length === 0 && changed.length === 0) {
    console.log("\x1b[32m✓ Profiles are identical\x1b[0m");
    return;
  }

  // Summary
  const parts: string[] = [];
  if (added.length > 0) parts.push(`\x1b[32m+${added.length} added\x1b[0m`);
  if (removed.length > 0) parts.push(`\x1b[31m-${removed.length} removed\x1b[0m`);
  if (changed.length > 0) parts.push(`\x1b[33m~${changed.length} changed\x1b[0m`);
  console.log(parts.join("  ") + "\n");

  // Details
  if (added.length > 0) {
    console.log(`\x1b[32m── Added in ${rightName} ──\x1b[0m`);
    for (const d of added) {
      console.log(`  \x1b[32m+ ${d.key}\x1b[0m = ${maskValue(d.key, d.right!)}`);
    }
    console.log();
  }

  if (removed.length > 0) {
    console.log(`\x1b[31m── Removed from ${rightName} ──\x1b[0m`);
    for (const d of removed) {
      console.log(`  \x1b[31m- ${d.key}\x1b[0m = ${maskValue(d.key, d.left!)}`);
    }
    console.log();
  }

  if (changed.length > 0) {
    console.log(`\x1b[33m── Changed ──\x1b[0m`);
    for (const d of changed) {
      console.log(`  \x1b[33m~ ${d.key}\x1b[0m`);
      console.log(`    ${leftName}: ${maskValue(d.key, d.left!)}`);
      console.log(`    ${rightName}: ${maskValue(d.key, d.right!)}`);
    }
  }
}
