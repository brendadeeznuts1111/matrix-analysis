import type { Profile } from "./profileLoader";
import { getUnresolvedRefs } from "./profileLoader";

export interface ValidationResult {
  passed: boolean;
  errors: string[];
  warnings: string[];
}

export function validateProfile(profile: Profile): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!profile.name || typeof profile.name !== "string") {
    errors.push("Missing or invalid required field: name");
  }

  if (!profile.version || typeof profile.version !== "string") {
    errors.push("Missing or invalid required field: version");
  }

  if (!profile.env || typeof profile.env !== "object") {
    errors.push("Missing or invalid required field: env");
  } else {
    for (const [key, value] of Object.entries(profile.env)) {
      if (typeof value !== "string") {
        errors.push(`env.${key} must be a string, got ${typeof value}`);
      }
    }

    const unresolvedRefs = getUnresolvedRefs(profile.env);
    if (unresolvedRefs.length > 0) {
      for (const ref of unresolvedRefs) {
        warnings.push(`Unresolved variable reference: \${${ref}}`);
      }
    }

    if (hasCircularRefs(profile.env)) {
      errors.push("Circular reference detected in env variable references");
    }
  }

  return {
    passed: errors.length === 0,
    errors,
    warnings,
  };
}

function hasCircularRefs(env: Record<string, string>): boolean {
  // Circular references only apply when profile keys reference OTHER profile keys
  // whose values also contain references creating a loop.
  // References like SESSION_SECRET: "${SESSION_SECRET}" resolve from process.env,
  // not from the profile's own env, so they are NOT circular.
  const varPattern = /\$\{([^}]+)\}/g;
  const graph: Record<string, string[]> = {};
  const envKeys = new Set(Object.keys(env));

  for (const [key, value] of Object.entries(env)) {
    if (typeof value !== "string") continue;
    graph[key] = [];

    for (const match of value.matchAll(varPattern)) {
      const refKey = match[1];
      // Only track references to OTHER keys in this profile's env
      // Self-references (KEY: "${KEY}") resolve from process.env, not circular
      if (envKeys.has(refKey) && refKey !== key) {
        graph[key].push(refKey);
      }
    }
  }

  const visited = new Set<string>();
  const recursionStack = new Set<string>();

  function hasCycle(node: string): boolean {
    if (recursionStack.has(node)) return true;
    if (visited.has(node)) return false;

    visited.add(node);
    recursionStack.add(node);

    for (const neighbor of graph[node] || []) {
      if (hasCycle(neighbor)) return true;
    }

    recursionStack.delete(node);
    return false;
  }

  for (const key of Object.keys(graph)) {
    if (hasCycle(key)) return true;
  }

  return false;
}
