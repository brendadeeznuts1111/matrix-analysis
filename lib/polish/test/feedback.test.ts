// lib/polish/test/feedback.test.ts - Feedback System Tests
// ═══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect, beforeEach } from "bun:test";
import {
  FeedbackManager,
  feedback,
} from "../feedback/manager.ts";
import {
  hapticManager,
  triggerHaptic,
  setHapticEnabled,
  isHapticSupported,
} from "../feedback/haptic.ts";
import { audioManager } from "../feedback/audio.ts";
import { flashCLI } from "../feedback/visual.ts";

describe("FeedbackManager", () => {
  let manager: FeedbackManager;

  beforeEach(() => {
    manager = new FeedbackManager();
  });

  describe("configuration", () => {
    it("should allow setting audio enabled without error", () => {
      expect(() => manager.setAudioEnabled(false)).not.toThrow();
      expect(() => manager.setAudioEnabled(true)).not.toThrow();
    });

    it("should allow setting haptic enabled without error", () => {
      expect(() => manager.setHapticEnabled(false)).not.toThrow();
      expect(() => manager.setHapticEnabled(true)).not.toThrow();
    });

    it("should allow setting visual enabled without error", () => {
      expect(() => manager.setVisualEnabled(false)).not.toThrow();
      expect(() => manager.setVisualEnabled(true)).not.toThrow();
    });
  });

  describe("feedback methods", () => {
    it("should trigger success feedback without error", async () => {
      await expect(manager.success()).resolves.toBeUndefined();
    });

    it("should trigger error feedback without error", async () => {
      await expect(manager.error()).resolves.toBeUndefined();
    });

    it("should trigger warning feedback without error", async () => {
      await expect(manager.warning()).resolves.toBeUndefined();
    });

    it("should trigger info feedback without error", async () => {
      await expect(manager.info()).resolves.toBeUndefined();
    });

    it("should trigger click feedback without error", async () => {
      await expect(manager.click()).resolves.toBeUndefined();
    });
  });
});

describe("feedback shortcut", () => {
  it("should expose success method", () => {
    expect(typeof feedback.success).toBe("function");
  });

  it("should expose error method", () => {
    expect(typeof feedback.error).toBe("function");
  });

  it("should expose warning method", () => {
    expect(typeof feedback.warning).toBe("function");
  });

  it("should expose info method", () => {
    expect(typeof feedback.info).toBe("function");
  });

  it("should expose click method", () => {
    expect(typeof feedback.click).toBe("function");
  });
});

describe("hapticManager", () => {
  it("should have trigger method", () => {
    expect(typeof hapticManager.trigger).toBe("function");
  });

  it("should not throw when triggering in CLI", () => {
    // Haptic is not supported in CLI, should silently no-op
    expect(() => hapticManager.trigger("light")).not.toThrow();
  });

  it("should have isSupported method", () => {
    expect(typeof hapticManager.isSupported).toBe("function");
  });

  it("should not be supported in CLI", () => {
    expect(hapticManager.isSupported()).toBe(false);
  });
});

describe("haptic convenience functions", () => {
  it("should have triggerHaptic function", () => {
    expect(typeof triggerHaptic).toBe("function");
    expect(triggerHaptic("light")).toBe(false); // Not supported in CLI
  });

  it("should have setHapticEnabled function", () => {
    expect(typeof setHapticEnabled).toBe("function");
    expect(() => setHapticEnabled(false)).not.toThrow();
  });

  it("should have isHapticSupported function", () => {
    expect(typeof isHapticSupported).toBe("function");
    expect(isHapticSupported()).toBe(false);
  });
});

describe("audioManager", () => {
  it("should have play method", () => {
    expect(typeof audioManager.play).toBe("function");
  });

  it("should not throw when playing in CLI", async () => {
    // Audio is not supported in CLI, should silently no-op
    await expect(audioManager.play("success")).resolves.toBeUndefined();
  });
});

describe("flashCLI", () => {
  it("should not throw", () => {
    expect(() => flashCLI("success")).not.toThrow();
  });

  it("should accept different types", () => {
    expect(() => flashCLI("error")).not.toThrow();
    expect(() => flashCLI("warning")).not.toThrow();
    expect(() => flashCLI("info")).not.toThrow();
  });
});
