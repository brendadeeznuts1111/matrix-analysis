// lib/polish/test/system-polish.test.ts - SystemPolish Integration Tests
// ═══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect, beforeEach } from "bun:test";
import { SystemPolish, polish } from "../system/polish.ts";
import {
  loadConfig,
  saveConfig,
  applyPreset,
  resetConfig,
  CONFIG_PRESETS,
  type ConfigPreset,
} from "../system/config.ts";

describe("SystemPolish", () => {
  let system: SystemPolish;

  beforeEach(() => {
    system = new SystemPolish();
  });

  describe("construction", () => {
    it("should create instance without errors", () => {
      expect(system).toBeInstanceOf(SystemPolish);
    });

    it("should have spinner", () => {
      expect(system.spinner).toBeDefined();
    });

    it("should have progress", () => {
      expect(system.progress).toBeDefined();
    });

    it("should have errors handler", () => {
      expect(system.errors).toBeDefined();
    });

    it("should have feedback manager", () => {
      expect(system.feedback).toBeDefined();
    });

    it("should have micro-interactions", () => {
      expect(system.interactions).toBeDefined();
    });
  });

  describe("withSpinner()", () => {
    it("should run operation and return result", async () => {
      const result = await system.withSpinner("Test", async () => 123);
      expect(result).toBe(123);
    });

    it("should return null on error", async () => {
      const result = await system.withSpinner("Fail", async () => {
        throw new Error("Test error");
      });
      expect(result).toBeNull();
    });
  });

  describe("withProgress()", () => {
    it("should process items and return success", async () => {
      const items = ["a", "b", "c"];
      const processed: string[] = [];

      const result = await system.withProgress(items, async (item) => {
        processed.push(item);
      });

      expect(result).toBe(true);
      expect(processed).toEqual(["a", "b", "c"]);
    });

    it("should return false on error", async () => {
      const items = [1, 2, 3];

      const result = await system.withProgress(items, async (item) => {
        if (item === 2) throw new Error("fail");
      });

      expect(result).toBe(false);
    });
  });

  describe("safe()", () => {
    it("should return result on success", () => {
      const result = system.safe(() => 42, 0);
      expect(result).toBe(42);
    });

    it("should return fallback on error", () => {
      const result = system.safe(
        () => {
          throw new Error("oops");
        },
        -1
      );
      expect(result).toBe(-1);
    });
  });

  describe("safeAsync()", () => {
    it("should return result on success", async () => {
      const result = await system.safeAsync(async () => "async result", "default");
      expect(result).toBe("async result");
    });

    it("should return fallback on error", async () => {
      const result = await system.safeAsync(
        async () => {
          throw new Error("async error");
        },
        "fallback"
      );
      expect(result).toBe("fallback");
    });
  });
});

describe("polish shortcut", () => {
  it("should be an object with convenience methods", () => {
    expect(typeof polish).toBe("object");
    expect(typeof polish.init).toBe("function");
    expect(typeof polish.withSpinner).toBe("function");
  });

  it("should expose spinner", () => {
    expect(polish.spinner).toBeDefined();
  });

  it("should expose errors", () => {
    expect(polish.errors).toBeDefined();
  });

  it("should expose feedback", () => {
    expect(polish.feedback).toBeDefined();
  });

  it("should expose interactions", () => {
    expect(polish.interactions).toBeDefined();
  });
});

describe("CONFIG_PRESETS", () => {
  it("should have full preset", () => {
    expect(CONFIG_PRESETS.full).toBeDefined();
    expect(CONFIG_PRESETS.full.audio.enabled).toBe(true);
    expect(CONFIG_PRESETS.full.haptic.enabled).toBe(true);
    expect(CONFIG_PRESETS.full.visual.animations).toBe(true);
  });

  it("should have minimal preset", () => {
    expect(CONFIG_PRESETS.minimal).toBeDefined();
    expect(CONFIG_PRESETS.minimal.audio.enabled).toBe(false);
    expect(CONFIG_PRESETS.minimal.haptic.enabled).toBe(false);
  });

  it("should have silent preset", () => {
    expect(CONFIG_PRESETS.silent).toBeDefined();
    expect(CONFIG_PRESETS.silent.audio.enabled).toBe(false);
    expect(CONFIG_PRESETS.silent.haptic.enabled).toBe(false);
  });

  it("should have accessible preset with reduced motion", () => {
    expect(CONFIG_PRESETS.accessible).toBeDefined();
    expect(CONFIG_PRESETS.accessible.visual.animations).toBe(false);
    expect(CONFIG_PRESETS.accessible.audio.enabled).toBe(true);
  });

  it("should have demo preset", () => {
    expect(CONFIG_PRESETS.demo).toBeDefined();
    expect(CONFIG_PRESETS.demo.debug).toBe(true);
    expect(CONFIG_PRESETS.demo.easterEggs.enabled).toBe(true);
  });
});

describe("applyPreset", () => {
  it("should return config for valid preset", () => {
    const config = applyPreset("full");
    expect(config).toBeDefined();
    expect(config.audio.enabled).toBe(true);
  });

  it("should apply minimal preset correctly", () => {
    const config = applyPreset("minimal");
    expect(config).toBeDefined();
    expect(config.audio.enabled).toBe(false);
    expect(config.haptic.enabled).toBe(false);
  });
});

describe("loadConfig", () => {
  it("should return config with expected structure", async () => {
    await resetConfig(); // Reset to defaults first
    const config = await loadConfig();
    expect(config).toBeDefined();
    expect(config.audio).toBeDefined();
    expect(typeof config.audio.enabled).toBe("boolean");
    expect(typeof config.audio.volume).toBe("number");
  });
});

describe("saveConfig", () => {
  it("should save config without error", async () => {
    const config = { audio: { enabled: false, volume: 0 } };
    await expect(saveConfig(config)).resolves.toBeUndefined();
  });
});
