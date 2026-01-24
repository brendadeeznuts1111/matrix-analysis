// lib/polish/test/runtime.test.ts - Runtime Detection Tests
// ═══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "bun:test";
import { Runtime, ANSI, colors } from "../core/runtime.ts";

describe("Runtime", () => {
  describe("environment detection", () => {
    it("should detect Bun environment", () => {
      expect(Runtime.isBun).toBe(true);
    });

    it("should not detect browser in CLI", () => {
      expect(Runtime.isBrowser).toBe(false);
    });

    it("should detect TTY support", () => {
      expect(typeof Runtime.supportsTTY).toBe("boolean");
    });

    it("should not support haptic in CLI", () => {
      expect(Runtime.supportsHaptic).toBe(false);
    });

    it("should not support audio in CLI", () => {
      expect(Runtime.supportsAudio).toBe(false);
    });
  });

  describe("environment getter", () => {
    it("should return 'bun' in Bun runtime", () => {
      expect(Runtime.environment).toBe("bun");
    });
  });

  describe("convenience methods", () => {
    it("should have isCLI method", () => {
      expect(Runtime.isCLI()).toBe(true);
    });

    it("should have canAnimate method", () => {
      expect(typeof Runtime.canAnimate()).toBe("boolean");
    });

    it("should have getTerminalWidth method", () => {
      const width = Runtime.getTerminalWidth();
      expect(width).toBeGreaterThan(0);
    });

    it("should have stringWidth method", () => {
      const width = Runtime.stringWidth("hello");
      expect(width).toBe(5);
    });
  });

  describe("sleep method", () => {
    it("should sleep for specified duration", async () => {
      const start = Date.now();
      await Runtime.sleep(50);
      const elapsed = Date.now() - start;
      expect(elapsed).toBeGreaterThanOrEqual(45);
    });
  });
});

describe("ANSI", () => {
  it("should have reset code", () => {
    expect(ANSI.reset).toBe("\x1b[0m");
  });

  it("should have color codes", () => {
    expect(ANSI.red).toContain("\x1b[");
    expect(ANSI.green).toContain("\x1b[");
    expect(ANSI.blue).toContain("\x1b[");
  });

  it("should have style codes", () => {
    expect(ANSI.bold).toBe("\x1b[1m");
    expect(ANSI.dim).toBe("\x1b[2m");
    expect(ANSI.italic).toBe("\x1b[3m");
  });

  it("should have cursor control codes", () => {
    expect(ANSI.hideCursor).toBe("\x1b[?25l");
    expect(ANSI.showCursor).toBe("\x1b[?25h");
    expect(ANSI.clearLine).toBe("\x1b[2K");
  });

  it("should create cursor movement functions", () => {
    expect(ANSI.cursorUp(3)).toBe("\x1b[3A");
    expect(ANSI.cursorDown(2)).toBe("\x1b[2B");
    expect(ANSI.cursorForward(5)).toBe("\x1b[5C");
    expect(ANSI.cursorBack(1)).toBe("\x1b[1D");
  });

  it("should have color helper function", () => {
    const colored = ANSI.color("test", ANSI.red);
    expect(typeof colored).toBe("string");
  });
});

describe("colors", () => {
  it("should have success color", () => {
    const text = colors.success("ok");
    expect(typeof text).toBe("string");
  });

  it("should have error color", () => {
    const text = colors.error("fail");
    expect(typeof text).toBe("string");
  });

  it("should have warning color", () => {
    const text = colors.warning("warn");
    expect(typeof text).toBe("string");
  });

  it("should have info color", () => {
    const text = colors.info("info");
    expect(typeof text).toBe("string");
  });
});
