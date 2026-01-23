/**
 * Binary Safety Utilities
 * Error handling and validation for binary data operations
 */

import { toDataView } from "./binary-conversion";

/**
 * Maximum file size limit (100MB)
 */
export const MAX_FILE_SIZE = 100 * 1024 * 1024;

/**
 * Handle corrupted/malformed binary data
 */
export class BinarySafety {
  /**
   * Validate Uint8Array before conversion
   */
  static validate(bytes: unknown): bytes is Uint8Array {
    if (!(bytes instanceof Uint8Array)) {
      throw new TypeError(`Expected Uint8Array, got ${typeof bytes}`);
    }

    if (bytes.byteLength === 0) {
      throw new RangeError("Cannot convert empty Uint8Array to DataView");
    }

    if (bytes.byteLength > MAX_FILE_SIZE) {
      throw new RangeError(`Uint8Array exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit`);
    }

    return true;
  }

  /**
   * Check if bytes are valid without throwing
   */
  static isValid(bytes: unknown): bytes is Uint8Array {
    try {
      return this.validate(bytes);
    } catch {
      return false;
    }
  }

  /**
   * Safe read with bounds checking
   */
  static safeRead(view: DataView, offset: number, size: number): Uint8Array | null {
    if (offset < 0 || offset + size > view.byteLength) {
      return null;
    }

    return new Uint8Array(view.buffer, view.byteOffset + offset, size);
  }

  /**
   * Safe getUint8 with bounds checking
   */
  static safeGetUint8(view: DataView, offset: number): number | null {
    if (offset < 0 || offset >= view.byteLength) {
      return null;
    }
    return view.getUint8(offset);
  }

  /**
   * Safe getUint16 with bounds checking
   */
  static safeGetUint16(view: DataView, offset: number, littleEndian = false): number | null {
    if (offset < 0 || offset + 2 > view.byteLength) {
      return null;
    }
    return view.getUint16(offset, littleEndian);
  }

  /**
   * Safe getUint32 with bounds checking
   */
  static safeGetUint32(view: DataView, offset: number, littleEndian = false): number | null {
    if (offset < 0 || offset + 4 > view.byteLength) {
      return null;
    }
    return view.getUint32(offset, littleEndian);
  }

  /**
   * Safe getFloat32 with bounds checking
   */
  static safeGetFloat32(view: DataView, offset: number, littleEndian = false): number | null {
    if (offset < 0 || offset + 4 > view.byteLength) {
      return null;
    }
    return view.getFloat32(offset, littleEndian);
  }

  /**
   * Safe getFloat64 with bounds checking
   */
  static safeGetFloat64(view: DataView, offset: number, littleEndian = false): number | null {
    if (offset < 0 || offset + 8 > view.byteLength) {
      return null;
    }
    return view.getFloat64(offset, littleEndian);
  }

  /**
   * Handle truncated files
   */
  static handleTruncatedFile(bytes: Uint8Array, expectedSize: number): DataView | null {
    if (bytes.byteLength < expectedSize) {
      return null;
    }

    return toDataView(bytes);
  }

  /**
   * Detect system endianness
   */
  static getSystemEndianness(): "LE" | "BE" {
    const buffer = new ArrayBuffer(2);
    new DataView(buffer).setUint16(0, 1, true); // Write as little-endian
    return new Uint8Array(buffer)[0] === 1 ? "LE" : "BE";
  }

  /**
   * Check if data appears to be little-endian based on expected value
   */
  static detectEndianness(view: DataView, offset: number, expectedLE: number): "LE" | "BE" | "unknown" {
    if (offset + 4 > view.byteLength) return "unknown";

    const asLE = view.getUint32(offset, true);
    const asBE = view.getUint32(offset, false);

    if (asLE === expectedLE) return "LE";
    if (asBE === expectedLE) return "BE";
    return "unknown";
  }

  /**
   * Create a safe DataView wrapper with automatic bounds checking
   */
  static createSafeView(bytes: Uint8Array): SafeDataView {
    return new SafeDataView(bytes);
  }
}

/**
 * SafeDataView - DataView wrapper with automatic bounds checking
 */
export class SafeDataView {
  private view: DataView;

  constructor(bytes: Uint8Array) {
    BinarySafety.validate(bytes);
    this.view = toDataView(bytes);
  }

  get byteLength(): number {
    return this.view.byteLength;
  }

  getUint8(offset: number): number | null {
    return BinarySafety.safeGetUint8(this.view, offset);
  }

  getUint16(offset: number, littleEndian = false): number | null {
    return BinarySafety.safeGetUint16(this.view, offset, littleEndian);
  }

  getUint32(offset: number, littleEndian = false): number | null {
    return BinarySafety.safeGetUint32(this.view, offset, littleEndian);
  }

  getFloat32(offset: number, littleEndian = false): number | null {
    return BinarySafety.safeGetFloat32(this.view, offset, littleEndian);
  }

  getFloat64(offset: number, littleEndian = false): number | null {
    return BinarySafety.safeGetFloat64(this.view, offset, littleEndian);
  }

  getBytes(offset: number, length: number): Uint8Array | null {
    return BinarySafety.safeRead(this.view, offset, length);
  }

  getString(offset: number, length: number): string | null {
    const bytes = this.getBytes(offset, length);
    if (!bytes) return null;
    return new TextDecoder().decode(bytes);
  }

  /**
   * Get underlying DataView (for advanced operations)
   */
  getView(): DataView {
    return this.view;
  }
}

/**
 * Result type for safe operations
 */
export type SafeReadResult<T> =
  | { success: true; value: T }
  | { success: false; error: string };

/**
 * Create safe read result
 */
export function safeResult<T>(fn: () => T): SafeReadResult<T> {
  try {
    return { success: true, value: fn() };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}
