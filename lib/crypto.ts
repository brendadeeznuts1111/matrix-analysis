// lib/crypto.ts - Password hashing, digest helpers, and comparison utilities
// ═══════════════════════════════════════════════════════════════════════════════
// Consolidates patterns from tools/password-hash.ts into lib form
// ═══════════════════════════════════════════════════════════════════════════════

import { timingSafeEqual as nodeTimingSafe } from "crypto";

// ─────────────────────────────────────────────────────────────────────────────
// BN-035: Password Hashing
// ─────────────────────────────────────────────────────────────────────────────
export type HashLevel = "production" | "highSecurity" | "balanced" | "development";

export const ARGON2_CONFIGS = {
  production: {
    algorithm: "argon2id" as const,
    memoryCost: 65536,
    timeCost: 3,
    parallelism: 4,
  },
  highSecurity: {
    algorithm: "argon2id" as const,
    memoryCost: 131072,
    timeCost: 4,
    parallelism: 4,
  },
  balanced: {
    algorithm: "argon2id" as const,
    memoryCost: 32768,
    timeCost: 2,
    parallelism: 2,
  },
  development: {
    algorithm: "argon2id" as const,
    memoryCost: 16384,
    timeCost: 1,
    parallelism: 1,
  },
} as const;

export const hashPassword = async (
  password: string,
  level: HashLevel = "production",
): Promise<string> => {
  const config = ARGON2_CONFIGS[level];
  return await Bun.password.hash(password, config);
};

export const verifyPassword = async (
  password: string,
  hash: string,
): Promise<boolean> => {
  try {
    return await Bun.password.verify(password, hash);
  } catch {
    return false;
  }
};

export const needsRehash = (hash: string, level: HashLevel = "production"): boolean => {
  const match = hash.match(/\$m=(\d+),t=(\d+),p=(\d+)\$/);
  if (!match) return true;
  const [, m, t, p] = match.map(Number);
  const target = ARGON2_CONFIGS[level];
  return m < target.memoryCost || t < target.timeCost || p < target.parallelism;
};

// ─────────────────────────────────────────────────────────────────────────────
// BN-036: Multi-Algorithm Digest
// ─────────────────────────────────────────────────────────────────────────────
export type Algorithm = "md5" | "sha1" | "sha256" | "sha512" | "blake2b256";

export const digest = (
  data: string | Buffer,
  algo: Algorithm = "sha256",
): string => {
  const hasher = new Bun.CryptoHasher(algo);
  hasher.update(data);
  return hasher.digest("hex") as string;
};

// ─────────────────────────────────────────────────────────────────────────────
// BN-037: Deep Comparison
// ─────────────────────────────────────────────────────────────────────────────
export const deepEquals = (a: unknown, b: unknown, strict: boolean = false): boolean =>
  Bun.deepEquals(a, b, strict);

export const strictEquals = (a: unknown, b: unknown): boolean =>
  Bun.deepEquals(a, b, true);

// ─────────────────────────────────────────────────────────────────────────────
// BN-038: Constant-Time Compare
// ─────────────────────────────────────────────────────────────────────────────
export const timingSafeEqual = (a: string, b: string): boolean => {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return nodeTimingSafe(bufA, bufB);
};
