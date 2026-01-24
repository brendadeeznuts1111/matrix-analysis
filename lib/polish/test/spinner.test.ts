// lib/polish/test/spinner.test.ts - Loading Spinner Tests
// ═══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect, beforeEach, afterEach, mock } from "bun:test";
import {
  LoadingSpinner,
  withSpinner,
  SPINNER_FRAMES,
} from "../visual/spinner.ts";

describe("LoadingSpinner", () => {
  let spinner: LoadingSpinner;

  beforeEach(() => {
    spinner = new LoadingSpinner();
  });

  afterEach(() => {
    spinner.stop();
  });

  describe("construction", () => {
    it("should create spinner with default options", () => {
      expect(spinner).toBeInstanceOf(LoadingSpinner);
    });

    it("should accept custom frame style", () => {
      const customSpinner = new LoadingSpinner({ style: "line" });
      expect(customSpinner).toBeInstanceOf(LoadingSpinner);
      customSpinner.stop();
    });

    it("should accept custom interval", () => {
      const customSpinner = new LoadingSpinner({ interval: 50 });
      expect(customSpinner).toBeInstanceOf(LoadingSpinner);
      customSpinner.stop();
    });
  });

  describe("start/stop", () => {
    it("should start without errors", () => {
      expect(() => spinner.start("Loading...")).not.toThrow();
    });

    it("should stop without errors", () => {
      spinner.start("Loading...");
      expect(() => spinner.stop()).not.toThrow();
    });

    it("should handle multiple starts", () => {
      spinner.start("First");
      expect(() => spinner.start("Second")).not.toThrow();
    });

    it("should handle stop without start", () => {
      expect(() => spinner.stop()).not.toThrow();
    });
  });

  describe("succeed/fail", () => {
    it("should show success state", () => {
      spinner.start("Processing...");
      expect(() => spinner.succeed("Done!")).not.toThrow();
    });

    it("should show failure state", () => {
      spinner.start("Processing...");
      expect(() => spinner.fail("Failed!")).not.toThrow();
    });

    it("should use default messages", () => {
      spinner.start("Processing...");
      expect(() => spinner.succeed()).not.toThrow();
    });
  });

  describe("update", () => {
    it("should update message while running", () => {
      spinner.start("Initial");
      expect(() => spinner.update("Updated")).not.toThrow();
      spinner.stop();
    });
  });
});

describe("SPINNER_FRAMES", () => {
  it("should have dots style", () => {
    expect(SPINNER_FRAMES.dots).toBeArray();
    expect(SPINNER_FRAMES.dots.length).toBeGreaterThan(0);
  });

  it("should have line style", () => {
    expect(SPINNER_FRAMES.line).toBeArray();
  });

  it("should have arrow style", () => {
    expect(SPINNER_FRAMES.arrow).toBeArray();
  });

  it("should have bounce style", () => {
    expect(SPINNER_FRAMES.bounce).toBeArray();
  });
});

describe("withSpinner", () => {
  it("should run operation and return result", async () => {
    const result = await withSpinner("Test", async () => {
      return 42;
    });
    expect(result).toBe(42);
  });

  it("should handle async operations", async () => {
    const result = await withSpinner("Async test", async () => {
      await Bun.sleep(10);
      return "done";
    });
    expect(result).toBe("done");
  });

  it("should handle errors gracefully", async () => {
    const result = await withSpinner("Error test", async () => {
      throw new Error("Test error");
    });
    expect(result).toBeNull();
  });
});
