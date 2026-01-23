/**
 * Keyboard Shortcuts Module
 *
 * Provides conflict-free keyboard shortcut management.
 * Replaces useGlobalShortcuts with a config-driven approach.
 */

export { KeyboardShortcutManager, keyboardShortcuts, DEFAULT_SHORTCUTS } from "./KeyboardShortcutManager.js";

/**
 * Quick setup function to initialize shortcuts from config
 *
 * @example
 * ```ts
 * import { initShortcuts } from "./shortcuts";
 *
 * await initShortcuts("./config.toml", {
 *   "open-search": () => openSearchModal(),
 *   "kyc-validate": () => validateKyc(),
 *   "refresh-network": () => refreshNetworkStatus(),
 * });
 * ```
 */
export async function initShortcuts(
  configPath: string,
  callbacks: Record<string, () => void>
): Promise<void> {
  const { keyboardShortcuts } = await import("./KeyboardShortcutManager.js");

  await keyboardShortcuts.loadFromConfig(configPath, callbacks);
  keyboardShortcuts.init();

  // Log registered shortcuts for debugging
  if (process.env.DEBUG_SHORTCUTS) {
    console.log("[Shortcuts] Registered shortcuts:");
    keyboardShortcuts.printShortcuts();
  }
}

/**
 * Hook-style function for use in component initialization
 * This can be used as a drop-in replacement for useGlobalShortcuts
 */
export function useGlobalShortcuts(shortcuts: Record<string, () => void>): {
  register: (action: string, shortcut: string, callback: () => void) => void;
  unregister: (action: string) => void;
  getConflicts: () => Array<{ key: string; actions: string[] }>;
} {
  const { keyboardShortcuts, KeyboardShortcutManager, DEFAULT_SHORTCUTS } =
    require("./KeyboardShortcutManager.js");

  // Register shortcuts using defaults or custom bindings
  for (const [action, callback] of Object.entries(shortcuts)) {
    const shortcutKey = DEFAULT_SHORTCUTS[action] || `ctrl+shift+${action[0]}`;
    keyboardShortcuts.register(action, shortcutKey, callback);
  }

  keyboardShortcuts.init();

  return {
    register: (action: string, shortcut: string, callback: () => void) => {
      keyboardShortcuts.register(action, shortcut, callback);
    },
    unregister: (action: string) => {
      // Find and remove the shortcut for this action
      const shortcuts = keyboardShortcuts.getRegisteredShortcuts();
      const found = shortcuts.find((s: { action: string }) => s.action === action);
      if (found) {
        keyboardShortcuts.shortcuts.delete(found.shortcut);
      }
    },
    getConflicts: () => {
      return KeyboardShortcutManager.detectConflicts(DEFAULT_SHORTCUTS);
    },
  };
}
