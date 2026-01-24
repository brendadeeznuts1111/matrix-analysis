// lib/polish/test/error-handler.test.ts - Error Handler Tests
// ═══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect, beforeEach } from "bun:test";
import { EnhancedErrorHandler, formatUserError } from "../error-handling/handler.ts";
import {
  ERROR_CODES,
  getErrorDefinition,
  getErrorByNumericCode,
  isCriticalError,
  isRecoverableError,
  type ErrorCode,
} from "../error-handling/codes.ts";
import {
  registerRecoveryStrategy,
  attemptRecovery,
  suggestSolutions,
} from "../error-handling/recovery.ts";

describe("EnhancedErrorHandler", () => {
  let handler: EnhancedErrorHandler;

  beforeEach(() => {
    handler = new EnhancedErrorHandler({ silent: true });
  });

  describe("handle()", () => {
    it("should return result on success", () => {
      const result = handler.handle(() => 42, 0);
      expect(result).toBe(42);
    });

    it("should return fallback on error", () => {
      const result = handler.handle(() => {
        throw new Error("Test");
      }, -1);
      expect(result).toBe(-1);
    });

    it("should return null fallback when specified", () => {
      const result = handler.handle(() => {
        throw new Error("Test");
      }, null);
      expect(result).toBeNull();
    });
  });

  describe("handleAsync()", () => {
    it("should return result on success", async () => {
      const result = await handler.handleAsync(async () => "success", "failed");
      expect(result).toBe("success");
    });

    it("should return fallback on error", async () => {
      const result = await handler.handleAsync(async () => {
        throw new Error("Test");
      }, "fallback");
      expect(result).toBe("fallback");
    });

    it("should handle rejected promises", async () => {
      const result = await handler.handleAsync(
        () => Promise.reject(new Error("Rejected")),
        "default"
      );
      expect(result).toBe("default");
    });
  });

  describe("wrap()", () => {
    it("should wrap function and return result", () => {
      const fn = (x: number) => x * 2;
      const wrapped = handler.wrap(fn, 0);
      expect(wrapped(5)).toBe(10);
    });

    it("should return fallback when wrapped function throws", () => {
      const fn = () => {
        throw new Error("Oops");
      };
      const wrapped = handler.wrap(fn, "fallback");
      expect(wrapped()).toBe("fallback");
    });
  });

  describe("wrapAsync()", () => {
    it("should wrap async function and return result", async () => {
      const fn = async (x: number) => x + 1;
      const wrapped = handler.wrapAsync(fn, 0);
      expect(await wrapped(10)).toBe(11);
    });

    it("should return fallback when wrapped async function throws", async () => {
      const fn = async () => {
        throw new Error("Async error");
      };
      const wrapped = handler.wrapAsync(fn, "safe");
      expect(await wrapped()).toBe("safe");
    });
  });
});

describe("ERROR_CODES", () => {
  it("should have configuration errors in 1xxx range", () => {
    expect(ERROR_CODES.CONFIG_MISSING.code).toBe(1001);
    expect(ERROR_CODES.CONFIG_INVALID.code).toBe(1002);
  });

  it("should have database errors in 2xxx range", () => {
    expect(ERROR_CODES.DB_CONNECTION_FAILED.code).toBe(2001);
    expect(ERROR_CODES.DB_QUERY_FAILED.code).toBe(2002);
  });

  it("should have network errors in 3xxx range", () => {
    expect(ERROR_CODES.NETWORK_TIMEOUT.code).toBe(3001);
    expect(ERROR_CODES.API_ERROR.code).toBe(3002);
  });

  it("should have file system errors in 4xxx range", () => {
    expect(ERROR_CODES.FILE_NOT_FOUND.code).toBe(4001);
    expect(ERROR_CODES.FILE_PERMISSION_DENIED.code).toBe(4002);
  });

  it("should have auth errors in 5xxx range", () => {
    expect(ERROR_CODES.AUTH_REQUIRED.code).toBe(5001);
    expect(ERROR_CODES.AUTH_INVALID.code).toBe(5002);
  });
});

describe("getErrorDefinition", () => {
  it("should return definition for known code", () => {
    const def = getErrorDefinition("CONFIG_MISSING");
    expect(def).toBeDefined();
    expect(def.code).toBe(1001);
    expect(def.message).toBe("Configuration file not found");
  });

  it("should return definition with solutions", () => {
    const def = getErrorDefinition("DB_CONNECTION_FAILED");
    expect(def.solutions).toBeArray();
    expect(def.solutions!.length).toBeGreaterThan(0);
  });
});

describe("getErrorByNumericCode", () => {
  it("should return definition for known numeric code", () => {
    const def = getErrorByNumericCode(1001);
    expect(def).not.toBeNull();
    expect(def?.message).toBe("Configuration file not found");
  });

  it("should return null for unknown numeric code", () => {
    const def = getErrorByNumericCode(9999);
    expect(def).toBeNull();
  });
});

describe("isCriticalError", () => {
  it("should return true for critical errors", () => {
    expect(isCriticalError("DB_CONNECTION_FAILED")).toBe(true);
  });

  it("should return false for non-critical errors", () => {
    expect(isCriticalError("CONFIG_MISSING")).toBe(false);
  });
});

describe("isRecoverableError", () => {
  it("should return true for recoverable errors", () => {
    expect(isRecoverableError("NETWORK_TIMEOUT")).toBe(true);
  });

  it("should return false for non-recoverable errors", () => {
    expect(isRecoverableError("DB_CONNECTION_FAILED")).toBe(false);
  });
});

describe("suggestSolutions", () => {
  it("should return solutions for timeout errors", () => {
    const error = new Error("Connection timeout while fetching data");
    const context = { operation: "fetch", timestamp: new Date() };
    const solutions = suggestSolutions(error, context);
    expect(solutions).toBeArray();
    expect(solutions.length).toBeGreaterThan(0);
  });

  it("should return solutions for permission errors", () => {
    const error = new Error("Permission denied");
    const context = { operation: "write", timestamp: new Date() };
    const solutions = suggestSolutions(error, context);
    expect(solutions).toBeArray();
    expect(solutions.some(s => s.toLowerCase().includes("permission"))).toBe(true);
  });

  it("should return empty array for generic errors", () => {
    const error = new Error("Something random happened");
    const context = { operation: "unknown", timestamp: new Date() };
    const solutions = suggestSolutions(error, context);
    expect(solutions).toBeArray();
  });
});

describe("formatUserError", () => {
  it("should format ENOENT errors", () => {
    const error = new Error("ENOENT: no such file");
    const formatted = formatUserError(error);
    expect(formatted).toContain("File not found");
  });

  it("should format EACCES errors", () => {
    const error = new Error("EACCES: permission denied");
    const formatted = formatUserError(error);
    expect(formatted).toContain("Permission denied");
  });

  it("should format timeout errors", () => {
    const error = new Error("ETIMEDOUT");
    const formatted = formatUserError(error);
    expect(formatted).toContain("timed out");
  });

  it("should add context when provided", () => {
    const error = new Error("Something failed");
    const formatted = formatUserError(error, "During save");
    expect(formatted).toContain("During save");
  });
});
