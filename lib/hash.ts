// lib/hash.ts - Non-cryptographic hash algorithms
// =============================================================================
// Fast hashes for data structures, caching, checksums — NOT for security.
// All functions accept string | Uint8Array | ArrayBuffer.
// =============================================================================

type Hashable = string | Uint8Array | ArrayBuffer;

// -----------------------------------------------------------------------------
// BN-094: Hash Algorithms
// -----------------------------------------------------------------------------

// Default hash (wyhash) — returns bigint
export const hash = (data: Hashable, seed?: bigint): bigint =>
  Bun.hash(data, seed ?? 0n) as bigint;

// WyHash — fast, good distribution (64-bit)
export const wyhash = (data: Hashable, seed?: bigint): bigint =>
  Bun.hash.wyhash(data, seed ?? 0n);

// CRC32 — classic checksum (32-bit)
export const crc32 = (data: Hashable, seed?: number): number =>
  Bun.hash.crc32(data, seed ?? 0);

// Adler-32 — fast rolling checksum (32-bit)
export const adler32 = (data: Hashable, seed?: number): number =>
  Bun.hash.adler32(data, seed ?? 0);

// CityHash — Google's hash family
export const cityHash32 = (data: Hashable, seed?: number): number =>
  Bun.hash.cityHash32(data, seed ?? 0);

export const cityHash64 = (data: Hashable, seed?: bigint): bigint =>
  Bun.hash.cityHash64(data, seed ?? 0n);

// MurmurHash — well-known, good for hash tables
export const murmur32v3 = (data: Hashable, seed?: number): number =>
  Bun.hash.murmur32v3(data, seed ?? 0);

export const murmur64v2 = (data: Hashable, seed?: bigint): bigint =>
  Bun.hash.murmur64v2(data, seed ?? 0n);

// -----------------------------------------------------------------------------
// BN-094b: Convenience — hex string output
// -----------------------------------------------------------------------------
export const hashHex = (data: Hashable): string =>
  Bun.hash(data).toString(16);

export const crc32Hex = (data: Hashable): string =>
  Bun.hash.crc32(data).toString(16).padStart(8, "0");

// -----------------------------------------------------------------------------
// BN-094c: SHA-512/256 (Bun.sha — cryptographic)
// -----------------------------------------------------------------------------
type ShaFormat = "hex" | "base64";

export const sha = (data: Hashable): Uint8Array => {
  try {
    return (Bun as any).sha(data);
  } catch {
    return new Uint8Array(0);
  }
};

export const shaHex = (data: Hashable): string | null => {
  try {
    return (Bun as any).sha(data, "hex");
  } catch {
    return null;
  }
};

export const shaBase64 = (data: Hashable): string | null => {
  try {
    return (Bun as any).sha(data, "base64");
  } catch {
    return null;
  }
};
