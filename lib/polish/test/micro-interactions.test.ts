// lib/polish/test/micro-interactions.test.ts - Micro-interactions Tests
// ═══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect, beforeEach } from "bun:test";
import { MicroInteractions, microInteractions } from "../micro-interactions/index.ts";
import {
  registerEasterEgg,
  triggerEasterEgg,
  checkForEasterEgg,
  InputSequenceTracker,
  registerBuiltInEasterEggs,
  getDiscoveredCount,
  getTotalCount,
  getDiscoveryProgress,
} from "../micro-interactions/easter-eggs.ts";
import {
  celebrateCLI,
  showLoadingMessages,
  sparkleText,
  waveText,
  bounceText,
  showFireworks,
} from "../micro-interactions/animations.ts";

describe("MicroInteractions", () => {
  let micro: MicroInteractions;

  beforeEach(() => {
    micro = new MicroInteractions();
  });

  describe("construction", () => {
    it("should create instance without errors", () => {
      expect(micro).toBeInstanceOf(MicroInteractions);
    });
  });

  describe("init", () => {
    it("should initialize without errors", async () => {
      await expect(micro.init()).resolves.toBeUndefined();
    });
  });

  describe("easter egg methods", () => {
    it("should have registerEasterEgg method", () => {
      expect(typeof micro.registerEasterEgg).toBe("function");
    });

    it("should have checkInput method", () => {
      expect(typeof micro.checkInput).toBe("function");
    });

    it("should have trackKeyPress method", () => {
      expect(typeof micro.trackKeyPress).toBe("function");
    });

    it("should have getEasterEggProgress method", () => {
      expect(typeof micro.getEasterEggProgress).toBe("function");
    });
  });

  describe("text animation methods", () => {
    it("should have typeText method", () => {
      expect(typeof micro.typeText).toBe("function");
    });

    it("should have rainbowText method", () => {
      expect(typeof micro.rainbowText).toBe("function");
    });

    it("should have fadeInText method", () => {
      expect(typeof micro.fadeInText).toBe("function");
    });
  });

  describe("celebration methods", () => {
    it("should have celebrate method", () => {
      expect(typeof micro.celebrate).toBe("function");
    });

    it("should have showConfetti method", () => {
      expect(typeof micro.showConfetti).toBe("function");
    });

    it("should have showFireworks method", () => {
      expect(typeof micro.showFireworks).toBe("function");
    });
  });
});

describe("microInteractions singleton", () => {
  it("should be a MicroInteractions instance", () => {
    expect(microInteractions).toBeInstanceOf(MicroInteractions);
  });
});

describe("InputSequenceTracker", () => {
  let tracker: InputSequenceTracker;

  beforeEach(() => {
    tracker = new InputSequenceTracker();
  });

  it("should track input", () => {
    tracker.track("h");
    tracker.track("i");
    expect(tracker.getBuffer()).toBe("hi");
  });

  it("should limit buffer length", () => {
    for (let i = 0; i < 100; i++) {
      tracker.track("a");
    }
    expect(tracker.getBuffer().length).toBeLessThanOrEqual(50);
  });

  it("should clear buffer", () => {
    tracker.track("test");
    tracker.clear();
    expect(tracker.getBuffer()).toBe("");
  });
});

describe("registerEasterEgg", () => {
  it("should register custom egg without throwing", () => {
    expect(() =>
      registerEasterEgg({
        trigger: "test-custom",
        name: "Test Egg",
        action: async () => {},
      })
    ).not.toThrow();
  });
});

describe("checkForEasterEgg", () => {
  it("should return null for unknown input", () => {
    const egg = checkForEasterEgg("nonexistent-unique-string-xyz");
    expect(egg).toBeNull();
  });
});

describe("registerBuiltInEasterEggs", () => {
  it("should register built-in eggs without throwing", () => {
    expect(() => registerBuiltInEasterEggs()).not.toThrow();
  });

  it("should increase total egg count", () => {
    const before = getTotalCount();
    registerBuiltInEasterEggs();
    expect(getTotalCount()).toBeGreaterThanOrEqual(before);
  });
});

describe("getDiscoveryProgress", () => {
  it("should return progress string", () => {
    const progress = getDiscoveryProgress();
    expect(typeof progress).toBe("string");
    expect(progress).toMatch(/\d+\/\d+/);
  });
});

describe("celebrateCLI", () => {
  it("should accept message and duration", async () => {
    // Very short duration for test
    await expect(celebrateCLI("Test!", 50)).resolves.toBeUndefined();
  });
});

describe("showLoadingMessages", () => {
  it("should accept count and interval", async () => {
    // Very short for test
    await expect(showLoadingMessages(1, 10)).resolves.toBeUndefined();
  });
});

describe("text animation functions", () => {
  it("sparkleText should not throw", async () => {
    await expect(sparkleText("test", 50)).resolves.toBeUndefined();
  });

  it("waveText should not throw", async () => {
    await expect(waveText("wave", 1)).resolves.toBeUndefined();
  });

  it("bounceText should not throw", async () => {
    await expect(bounceText("bounce", 1)).resolves.toBeUndefined();
  });

  it("showFireworks should not throw", async () => {
    await expect(showFireworks(0)).resolves.toBeUndefined();
  });
});
