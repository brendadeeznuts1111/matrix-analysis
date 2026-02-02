// lib/secrets.ts - OS Keychain access via Bun.secrets
// =============================================================================
// Secure credential storage using system keychain
// =============================================================================

// -----------------------------------------------------------------------------
// BN-105: Keychain Operations
// -----------------------------------------------------------------------------
export const get = async (
  service: string,
  name: string
): Promise<string | null> => {
  try {
    const value = await Bun.secrets.get({ service, name });
    return value ?? null;
  } catch {
    return null;
  }
};

export const set = async (
  service: string,
  name: string,
  value: string
): Promise<boolean> => {
  try {
    await Bun.secrets.set({ service, name, value });
    return true;
  } catch {
    return false;
  }
};

export const remove = async (
  service: string,
  name: string
): Promise<boolean> => {
  try {
    await Bun.secrets.delete({ service, name });
    return true;
  } catch {
    return false;
  }
};
