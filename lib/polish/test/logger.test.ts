// lib/polish/test/logger.test.ts - Logger Tests
// ═══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect, beforeEach } from "bun:test";
import { Logger, logger } from "../core/logger.ts";

describe("Logger", () => {
  let testLogger: Logger;

  beforeEach(() => {
    testLogger = new Logger({ prefix: "TEST" });
  });

  describe("construction", () => {
    it("should create with default options", () => {
      const log = new Logger();
      expect(log).toBeInstanceOf(Logger);
    });

    it("should accept custom prefix", () => {
      const log = new Logger({ prefix: "CUSTOM" });
      expect(log).toBeInstanceOf(Logger);
    });

    it("should accept showTimestamp option", () => {
      const log = new Logger({ showTimestamp: true });
      expect(log).toBeInstanceOf(Logger);
    });

    it("should accept debug option", () => {
      const log = new Logger({ debug: true });
      expect(log).toBeInstanceOf(Logger);
    });
  });

  describe("log methods", () => {
    it("should have info method", () => {
      expect(typeof testLogger.info).toBe("function");
    });

    it("should have success method", () => {
      expect(typeof testLogger.success).toBe("function");
    });

    it("should have warning method", () => {
      expect(typeof testLogger.warning).toBe("function");
    });

    it("should have error method", () => {
      expect(typeof testLogger.error).toBe("function");
    });

    it("should have critical method", () => {
      expect(typeof testLogger.critical).toBe("function");
    });

    it("should have debug method", () => {
      expect(typeof testLogger.debug).toBe("function");
    });

    it("should not throw when calling log methods", () => {
      expect(() => testLogger.info("test info")).not.toThrow();
      expect(() => testLogger.success("test success")).not.toThrow();
      expect(() => testLogger.warning("test warning")).not.toThrow();
      expect(() => testLogger.error("test error")).not.toThrow();
      expect(() => testLogger.critical("test critical")).not.toThrow();
      expect(() => testLogger.debug("test debug")).not.toThrow();
    });
  });

  describe("withContext", () => {
    it("should have withContext method", () => {
      expect(typeof testLogger.withContext).toBe("function");
    });

    it("should accept level, message, and context", () => {
      expect(() =>
        testLogger.withContext("info", "Test message", { key: "value" })
      ).not.toThrow();
    });
  });

  describe("box formatting", () => {
    it("should have box method", () => {
      expect(typeof testLogger.box).toBe("function");
    });

    it("should not throw when creating box", () => {
      expect(() => testLogger.box("Content")).not.toThrow();
    });

    it("should accept title parameter", () => {
      expect(() => testLogger.box("Content", "Title")).not.toThrow();
    });
  });
});

describe("logger singleton", () => {
  it("should be a Logger instance", () => {
    expect(logger).toBeInstanceOf(Logger);
  });

  it("should have all log methods", () => {
    expect(typeof logger.info).toBe("function");
    expect(typeof logger.success).toBe("function");
    expect(typeof logger.warning).toBe("function");
    expect(typeof logger.error).toBe("function");
    expect(typeof logger.debug).toBe("function");
    expect(typeof logger.critical).toBe("function");
  });

  it("should have box method", () => {
    expect(typeof logger.box).toBe("function");
  });

  it("should have withContext method", () => {
    expect(typeof logger.withContext).toBe("function");
  });
});
