/**
 * Binary Conversion Utilities
 * Uint8Array → DataView conversion with safety checks
 */

/**
 * Safely convert Uint8Array to DataView with bounds checking
 * Handles subarrays correctly by preserving offset/length
 */
export function toDataView(bytes: Uint8Array): DataView {
  // Validate input
  if (!(bytes instanceof Uint8Array)) {
    throw new TypeError("Input must be a Uint8Array");
  }

  if (bytes.length === 0) {
    throw new RangeError("Cannot create DataView from empty Uint8Array");
  }

  // Core conversion: DataView(buffer, offset, length)
  return new DataView(
    bytes.buffer,      // Underlying ArrayBuffer
    bytes.byteOffset,  // View offset (for subarrays)
    bytes.byteLength   // View length
  );
}

/**
 * Create DataView from subarray (preserves offset)
 */
export function fromSubarray(bytes: Uint8Array, start: number, end: number): DataView {
  // Create subarray
  const sub = bytes.subarray(start, end);

  // DataView will automatically use subarray's offset/length
  return toDataView(sub);
}

/**
 * Performance comparison utilities
 */
export const BinaryDataComparison = {
  /**
   * Uint8Array: Best for sequential byte access
   */
  readWithUint8Array(bytes: Uint8Array): number {
    let sum = 0;
    // Fast sequential access
    for (let i = 0; i < bytes.length; i++) {
      sum += bytes[i];
    }
    return sum;
  },

  /**
   * DataView: Best for random/multi-byte reads
   */
  readWithDataView(bytes: Uint8Array): number {
    const view = toDataView(bytes);
    let sum = 0;
    // Random access with different types
    for (let i = 0; i < bytes.length - 4; i += 4) {
      sum += view.getUint32(i, false); // Big-endian
    }
    return sum;
  },

  /**
   * Benchmark both approaches
   */
  benchmark(size: number = 1024 * 1024): {
    uint8ArrayMs: number;
    dataViewMs: number;
    overhead: number;
  } {
    const bytes = new Uint8Array(size);
    for (let i = 0; i < size; i++) {
      bytes[i] = Math.floor(Math.random() * 256);
    }

    // Uint8Array
    const start1 = performance.now();
    this.readWithUint8Array(bytes);
    const uint8ArrayMs = performance.now() - start1;

    // DataView
    const start2 = performance.now();
    this.readWithDataView(bytes);
    const dataViewMs = performance.now() - start2;

    const overhead = (dataViewMs / uint8ArrayMs - 1) * 100;

    return { uint8ArrayMs, dataViewMs, overhead };
  },
};
