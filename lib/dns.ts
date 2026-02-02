// lib/dns.ts - DNS lookup and prefetch
// =============================================================================
// Bun-native DNS resolution with error-safe returns
// =============================================================================

import { dns } from "bun";

// -----------------------------------------------------------------------------
// BN-096: DNS Lookup
// -----------------------------------------------------------------------------
export interface LookupResult {
  address: string;
  family: 4 | 6;
  ttl: number;
}

export const lookup = async (
  hostname: string,
  family?: 4 | 6
): Promise<LookupResult[] | null> => {
  try {
    const results = await dns.lookup(hostname, { family: family ?? 0 });
    return results as LookupResult[];
  } catch {
    return null;
  }
};

// DNS prefetch hint — fire-and-forget for performance
export const prefetch = (hostname: string, port?: number): void => {
  dns.prefetch(hostname, port ?? 443);
};
