/**
 * Keyboard Shortcut Manager
 *
 * Config-driven keyboard shortcut manager that:
 * - Reads shortcuts from config.toml
 * - Detects and prevents conflicts
 * - Provides unique shortcut bindings
 */

import { parse as parseToml } from "@iarna/toml";

interface ShortcutConfig {
  [action: string]: string;
}

interface ShortcutRegistration {
  action: string;
  key: string;
  modifiers: {
    ctrl: boolean;
    meta: boolean;
    alt: boolean;
    shift: boolean;
  };
  callback: () => void;
}

interface ConflictInfo {
  key: string;
  actions: string[];
}

export class KeyboardShortcutManager {
  private shortcuts = new Map<string, ShortcutRegistration>();
  private isInitialized = false;
  private boundHandler: (e: KeyboardEvent) => void;

  constructor() {
    this.boundHandler = this.handleKeydown.bind(this);
  }

  /**
   * Parse a shortcut string like "ctrl+shift+k" into modifiers and key
   */
  private parseShortcut(shortcutStr: string): { key: string; modifiers: ShortcutRegistration["modifiers"] } {
    const parts = shortcutStr.toLowerCase().split("+");
    const key = parts.pop() || "";
    const modifiers = {
      ctrl: parts.includes("ctrl"),
      meta: parts.includes("meta") || parts.includes("cmd"),
      alt: parts.includes("alt"),
      shift: parts.includes("shift"),
    };
    return { key, modifiers };
  }

  /**
   * Create a unique key for a shortcut combination
   */
  private getShortcutKey(modifiers: ShortcutRegistration["modifiers"], key: string): string {
    const parts: string[] = [];
    if (modifiers.ctrl) parts.push("ctrl");
    if (modifiers.meta) parts.push("meta");
    if (modifiers.alt) parts.push("alt");
    if (modifiers.shift) parts.push("shift");
    parts.push(key);
    return parts.join("+");
  }

  /**
   * Register a shortcut from config
   */
  register(action: string, shortcutStr: string, callback: () => void): void {
    const { key, modifiers } = this.parseShortcut(shortcutStr);
    const shortcutKey = this.getShortcutKey(modifiers, key);

    // Check for conflicts
    if (this.shortcuts.has(shortcutKey)) {
      const existing = this.shortcuts.get(shortcutKey)!;
      console.warn(
        `[KeyboardShortcutManager] Conflict detected: ${shortcutKey} already assigned to "${existing.action}", skipping "${action}"`
      );
      return;
    }

    this.shortcuts.set(shortcutKey, {
      action,
      key,
      modifiers,
      callback,
    });
  }

  /**
   * Load shortcuts from config.toml
   */
  async loadFromConfig(configPath: string, callbacks: Record<string, () => void>): Promise<void> {
    try {
      const configFile = Bun.file(configPath);
      const configText = await configFile.text();
      const config = parseToml(configText) as { clitools?: { shortcuts?: ShortcutConfig } };

      const shortcuts = config.clitools?.shortcuts || {};

      for (const [action, shortcutStr] of Object.entries(shortcuts)) {
        if (callbacks[action]) {
          this.register(action, shortcutStr, callbacks[action]);
        }
      }
    } catch (error) {
      console.error("[KeyboardShortcutManager] Failed to load config:", error);
    }
  }

  /**
   * Detect conflicts in a set of shortcut definitions
   */
  static detectConflicts(shortcuts: ShortcutConfig): ConflictInfo[] {
    const keyToActions = new Map<string, string[]>();

    for (const [action, shortcutStr] of Object.entries(shortcuts)) {
      const normalized = shortcutStr.toLowerCase().split("+").sort().join("+");
      const actions = keyToActions.get(normalized) || [];
      actions.push(action);
      keyToActions.set(normalized, actions);
    }

    const conflicts: ConflictInfo[] = [];
    for (const [key, actions] of keyToActions.entries()) {
      if (actions.length > 1) {
        conflicts.push({ key, actions });
      }
    }

    return conflicts;
  }

  /**
   * Initialize the manager and start listening for keyboard events
   */
  init(): void {
    if (this.isInitialized) return;
    if (typeof document !== "undefined") {
      document.addEventListener("keydown", this.boundHandler);
      this.isInitialized = true;
    }
  }

  /**
   * Destroy the manager and remove listeners
   */
  destroy(): void {
    if (typeof document !== "undefined") {
      document.removeEventListener("keydown", this.boundHandler);
    }
    this.isInitialized = false;
    this.shortcuts.clear();
  }

  /**
   * Handle keydown events
   */
  private handleKeydown(e: KeyboardEvent): void {
    // Skip if user is typing in an input
    const target = e.target as HTMLElement;
    if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) {
      return;
    }

    const modifiers = {
      ctrl: e.ctrlKey,
      meta: e.metaKey,
      alt: e.altKey,
      shift: e.shiftKey,
    };

    const shortcutKey = this.getShortcutKey(modifiers, e.key.toLowerCase());
    const registration = this.shortcuts.get(shortcutKey);

    if (registration) {
      e.preventDefault();
      e.stopPropagation();

      try {
        registration.callback();
      } catch (error) {
        console.error(`[KeyboardShortcutManager] Error executing "${registration.action}":`, error);
      }
    }
  }

  /**
   * Get all registered shortcuts
   */
  getRegisteredShortcuts(): Array<{ action: string; shortcut: string }> {
    return Array.from(this.shortcuts.values()).map((reg) => ({
      action: reg.action,
      shortcut: this.getShortcutKey(reg.modifiers, reg.key),
    }));
  }

  /**
   * Display registered shortcuts as a table
   */
  printShortcuts(): void {
    const shortcuts = this.getRegisteredShortcuts();
    if (typeof Bun !== "undefined") {
      console.log(Bun.inspect.table(shortcuts, undefined, { colors: true }));
    } else {
      console.table(shortcuts);
    }
  }
}

// Default instance
export const keyboardShortcuts = new KeyboardShortcutManager();

// Export default shortcuts that avoid common conflicts
export const DEFAULT_SHORTCUTS: ShortcutConfig = {
  "open-search": "ctrl+/",           // Avoids meta+k (browser search)
  "kyc-validate": "ctrl+shift+k",    // Unique
  "kyc-review-queue": "ctrl+shift+q", // Unique
  "refresh-network": "ctrl+shift+n",  // Avoids meta+shift+r (hard refresh)
  "tab-next": "ctrl+]",
  "tab-prev": "ctrl+[",
  "toggle-sidebar": "ctrl+b",
  "quick-save": "ctrl+s",
  "quick-export": "ctrl+e",
};
