// lib/cookie.ts - Cookie and CookieMap wrappers
// =============================================================================
// Bun-native HTTP cookie parsing and creation
// =============================================================================

// -----------------------------------------------------------------------------
// BN-101: Cookie Creation
// -----------------------------------------------------------------------------
export interface CookieOptions {
  domain?: string;
  path?: string;
  maxAge?: number;
  expires?: Date;
  secure?: boolean;
  httpOnly?: boolean;
  sameSite?: "strict" | "lax" | "none";
}

export const create = (
  name: string,
  value: string,
  options?: CookieOptions
): InstanceType<typeof Bun.Cookie> =>
  new Bun.Cookie(name, value, options);

export const toString = (
  name: string,
  value: string,
  options?: CookieOptions
): string =>
  new Bun.Cookie(name, value, options).toString();

// -----------------------------------------------------------------------------
// BN-101b: CookieMap — parse and manage cookie collections
// -----------------------------------------------------------------------------
export const parse = (
  input?: string | [string, string][]
): InstanceType<typeof Bun.CookieMap> =>
  new Bun.CookieMap(input);

export const get = (
  cookieHeader: string,
  name: string
): string | null => {
  const map = new Bun.CookieMap(cookieHeader as any);
  const cookie = map.get(name);
  return cookie?.value ?? null;
};

export const getAll = (
  input: string | [string, string][]
): Record<string, string> => {
  const map = new Bun.CookieMap(input as any);
  const result: Record<string, string> = {};
  map.forEach((value: any, key: string) => {
    result[key] = typeof value === "string" ? value : value.value;
  });
  return result;
};
