import { describe, it, expect } from "bun:test";
import {
  loadProfile,
  resolveSecretRefs,
  getUnresolvedRefs,
  listProfiles,
} from "../lib/profile-loader";
import { validateProfile } from "../lib/validators";
import {
  maskValue,
  isSensitiveKey,
  detectConflicts,
  computeChanges,
} from "../lib/output";

describe("profile-loader", () => {
  describe("loadProfile", () => {
    it("loads existing profile", async () => {
      const profile = await loadProfile("dev");
      expect(profile).not.toBeNull();
      expect(profile?.name).toBe("dev");
      expect(profile?.version).toBeDefined();
      expect(profile?.env).toBeDefined();
    });

    it("returns null for non-existent profile", async () => {
      const profile = await loadProfile("non-existent-profile-xyz");
      expect(profile).toBeNull();
    });
  });

  describe("listProfiles", () => {
    it("returns array of profile names", async () => {
      const profiles = await listProfiles();
      expect(Array.isArray(profiles)).toBe(true);
      expect(profiles.length).toBeGreaterThan(0);
      expect(profiles).toContain("dev");
    });
  });

  describe("resolveSecretRefs", () => {
    it("resolves existing environment variables", () => {
      const originalHome = process.env.HOME;
      const env = {
        MY_HOME: "${HOME}",
        PLAIN: "value",
      };

      const resolved = resolveSecretRefs(env);
      expect(resolved.MY_HOME).toBe(originalHome);
      expect(resolved.PLAIN).toBe("value");
    });

    it("keeps unresolved refs as-is", () => {
      const env = {
        MISSING: "${UNDEFINED_VAR_XYZ123}",
      };

      const resolved = resolveSecretRefs(env);
      expect(resolved.MISSING).toBe("${UNDEFINED_VAR_XYZ123}");
    });

    it("handles multiple refs in one value", () => {
      const env = {
        COMBINED: "${HOME}:${PATH}",
      };

      const resolved = resolveSecretRefs(env);
      expect(resolved.COMBINED).toContain(process.env.HOME!);
      expect(resolved.COMBINED).toContain(process.env.PATH!);
    });
  });

  describe("getUnresolvedRefs", () => {
    it("returns list of unresolved references", () => {
      const env = {
        RESOLVED: "${HOME}",
        MISSING1: "${UNDEFINED_ABC}",
        MISSING2: "${UNDEFINED_XYZ}",
      };

      const unresolved = getUnresolvedRefs(env);
      expect(unresolved).toContain("UNDEFINED_ABC");
      expect(unresolved).toContain("UNDEFINED_XYZ");
      expect(unresolved).not.toContain("HOME");
    });

    it("returns empty array when all refs resolved", () => {
      const env = {
        RESOLVED: "${HOME}",
        PLAIN: "value",
      };

      const unresolved = getUnresolvedRefs(env);
      expect(unresolved).toEqual([]);
    });
  });
});

describe("validators", () => {
  describe("validateProfile", () => {
    it("passes valid profile", () => {
      const profile = {
        name: "test",
        version: "1.0.0",
        env: {
          NODE_ENV: "development",
          APP_NAME: "test-app",
        },
      };

      const result = validateProfile(profile);
      expect(result.passed).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("fails on missing name", () => {
      const profile = {
        name: "",
        version: "1.0.0",
        env: { NODE_ENV: "test" },
      };

      const result = validateProfile(profile);
      expect(result.passed).toBe(false);
      expect(result.errors.some((e) => e.includes("name"))).toBe(true);
    });

    it("fails on missing version", () => {
      const profile = {
        name: "test",
        version: "",
        env: { NODE_ENV: "test" },
      };

      const result = validateProfile(profile);
      expect(result.passed).toBe(false);
      expect(result.errors.some((e) => e.includes("version"))).toBe(true);
    });

    it("fails on missing env", () => {
      const profile = {
        name: "test",
        version: "1.0.0",
        env: null as unknown as Record<string, string>,
      };

      const result = validateProfile(profile);
      expect(result.passed).toBe(false);
      expect(result.errors.some((e) => e.includes("env"))).toBe(true);
    });

    it("warns on unresolved references", () => {
      const profile = {
        name: "test",
        version: "1.0.0",
        env: {
          SECRET: "${UNDEFINED_SECRET_ABC}",
        },
      };

      const result = validateProfile(profile);
      expect(result.warnings.some((w) => w.includes("UNDEFINED_SECRET_ABC"))).toBe(true);
    });
  });
});

describe("output", () => {
  describe("isSensitiveKey", () => {
    it("detects SECRET patterns", () => {
      expect(isSensitiveKey("SESSION_SECRET")).toBe(true);
      expect(isSensitiveKey("JWT_SECRET")).toBe(true);
      expect(isSensitiveKey("MY_SECRET_KEY")).toBe(true);
    });

    it("detects PASSWORD patterns", () => {
      expect(isSensitiveKey("DB_PASSWORD")).toBe(true);
      expect(isSensitiveKey("USER_PASSWORD")).toBe(true);
    });

    it("detects TOKEN patterns", () => {
      expect(isSensitiveKey("API_TOKEN")).toBe(true);
      expect(isSensitiveKey("ACCESS_TOKEN")).toBe(true);
      expect(isSensitiveKey("REFRESH_TOKEN")).toBe(true);
    });

    it("detects KEY patterns", () => {
      expect(isSensitiveKey("API_KEY")).toBe(true);
      expect(isSensitiveKey("PRIVATE_KEY")).toBe(true);
      expect(isSensitiveKey("ENCRYPTION_KEY")).toBe(true);
    });

    it("detects AUTH patterns", () => {
      expect(isSensitiveKey("GITHUB_AUTH")).toBe(true);
      expect(isSensitiveKey("NPM_AUTH_TOKEN")).toBe(true);
    });

    it("returns false for non-sensitive keys", () => {
      expect(isSensitiveKey("NODE_ENV")).toBe(false);
      expect(isSensitiveKey("PORT")).toBe(false);
      expect(isSensitiveKey("DEBUG")).toBe(false);
      expect(isSensitiveKey("LOG_LEVEL")).toBe(false);
    });
  });

  describe("maskValue", () => {
    it("masks sensitive values", () => {
      expect(maskValue("API_KEY", "sk-12345")).toBe("************");
      expect(maskValue("DB_PASSWORD", "hunter2")).toBe("************");
    });

    it("does not mask non-sensitive values", () => {
      expect(maskValue("NODE_ENV", "production")).toBe("production");
      expect(maskValue("PORT", "3000")).toBe("3000");
    });
  });

  describe("detectConflicts", () => {
    it("detects value changes", () => {
      const newEnv = { NODE_ENV: "production", PORT: "8080" };
      const currentEnv = { NODE_ENV: "development", PORT: "8080" };

      const conflicts = detectConflicts(newEnv, currentEnv);
      expect(conflicts).toHaveLength(1);
      expect(conflicts[0].key).toBe("NODE_ENV");
      expect(conflicts[0].currentValue).toBe("development");
      expect(conflicts[0].newValue).toBe("production");
    });

    it("returns empty array when no conflicts", () => {
      const newEnv = { NEW_VAR: "value" };
      const currentEnv = { OTHER_VAR: "other" };

      const conflicts = detectConflicts(newEnv, currentEnv);
      expect(conflicts).toHaveLength(0);
    });

    it("ignores matching values", () => {
      const newEnv = { SAME: "value" };
      const currentEnv = { SAME: "value" };

      const conflicts = detectConflicts(newEnv, currentEnv);
      expect(conflicts).toHaveLength(0);
    });
  });

  describe("computeChanges", () => {
    it("identifies new variables", () => {
      const newEnv = { NEW_VAR: "value" };
      const currentEnv = {};

      const changes = computeChanges(newEnv, currentEnv);
      expect(changes).toHaveLength(1);
      expect(changes[0].isNew).toBe(true);
      expect(changes[0].isChanged).toBe(false);
    });

    it("identifies changed variables", () => {
      const newEnv = { EXISTING: "new-value" };
      const currentEnv = { EXISTING: "old-value" };

      const changes = computeChanges(newEnv, currentEnv);
      expect(changes).toHaveLength(1);
      expect(changes[0].isNew).toBe(false);
      expect(changes[0].isChanged).toBe(true);
    });

    it("identifies unchanged variables", () => {
      const newEnv = { SAME: "value" };
      const currentEnv = { SAME: "value" };

      const changes = computeChanges(newEnv, currentEnv);
      expect(changes).toHaveLength(1);
      expect(changes[0].isNew).toBe(false);
      expect(changes[0].isChanged).toBe(false);
    });
  });
});
