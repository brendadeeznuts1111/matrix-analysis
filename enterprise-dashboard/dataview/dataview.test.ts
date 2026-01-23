/**
 * DataView Conversion Test Suite
 * Tests for Uint8Array → DataView conversion and binary parsing
 */

import { describe, it, expect, beforeAll } from "bun:test";
import { toDataView, fromSubarray, BinaryDataComparison } from "./binary-conversion";
import { BinaryDataView } from "./data-view";
import { BinarySafety, SafeDataView, safeResult, MAX_FILE_SIZE } from "./binary-safety";

describe("Uint8Array → DataView Conversion", () => {
  describe("toDataView()", () => {
    it("successfully converts Uint8Array", () => {
      const bytes = new Uint8Array([1, 2, 3, 4, 5]);
      const view = toDataView(bytes);

      expect(view).toBeInstanceOf(DataView);
      expect(view.byteLength).toBe(5);
      expect(view.getUint8(0)).toBe(1);
      expect(view.getUint8(4)).toBe(5);
    });

    it("preserves subarray offset and length", () => {
      const bytes = new Uint8Array([0, 1, 2, 3, 4, 5, 6]);
      const sub = bytes.subarray(2, 5); // [2, 3, 4]
      const view = toDataView(sub);

      expect(view.byteLength).toBe(3);
      expect(view.getUint8(0)).toBe(2);
      expect(view.getUint8(1)).toBe(3);
      expect(view.getUint8(2)).toBe(4);
      expect(view.byteOffset).toBe(2);
    });

    it("throws TypeError on invalid input", () => {
      expect(() => toDataView(null as any)).toThrow(TypeError);
      expect(() => toDataView(undefined as any)).toThrow(TypeError);
      expect(() => toDataView("string" as any)).toThrow(TypeError);
      expect(() => toDataView(123 as any)).toThrow(TypeError);
      expect(() => toDataView([] as any)).toThrow(TypeError);
    });

    it("throws RangeError on empty Uint8Array", () => {
      expect(() => toDataView(new Uint8Array())).toThrow(RangeError);
      expect(() => toDataView(new Uint8Array(0))).toThrow(RangeError);
    });

    it("handles large arrays", () => {
      const size = 1024 * 1024; // 1MB
      const bytes = new Uint8Array(size);
      const view = toDataView(bytes);

      expect(view.byteLength).toBe(size);
    });
  });

  describe("fromSubarray()", () => {
    it("creates DataView from subarray range", () => {
      const bytes = new Uint8Array([10, 20, 30, 40, 50, 60, 70, 80]);
      const view = fromSubarray(bytes, 2, 6);

      expect(view.byteLength).toBe(4);
      expect(view.getUint8(0)).toBe(30);
      expect(view.getUint8(3)).toBe(60);
    });

    it("handles edge cases", () => {
      const bytes = new Uint8Array([1, 2, 3, 4, 5]);

      // Start of array
      const viewStart = fromSubarray(bytes, 0, 2);
      expect(viewStart.byteLength).toBe(2);
      expect(viewStart.getUint8(0)).toBe(1);

      // End of array
      const viewEnd = fromSubarray(bytes, 3, 5);
      expect(viewEnd.byteLength).toBe(2);
      expect(viewEnd.getUint8(0)).toBe(4);
    });
  });

  describe("BinaryDataComparison", () => {
    it("reads sequentially with Uint8Array", () => {
      const bytes = new Uint8Array([1, 2, 3, 4, 5]);
      const sum = BinaryDataComparison.readWithUint8Array(bytes);
      expect(sum).toBe(15);
    });

    it("reads with DataView", () => {
      // Need 12 bytes: loop reads at offsets 0, 4 (stops before 8 since 8+4=12 > length)
      const bytes = new Uint8Array(12);
      const view = new DataView(bytes.buffer);
      view.setUint32(0, 100, false);
      view.setUint32(4, 200, false);
      // Offset 8 won't be read since loop condition is i < length - 4

      const sum = BinaryDataComparison.readWithDataView(bytes);
      expect(sum).toBe(300);
    });

    it("benchmarks both approaches", () => {
      const result = BinaryDataComparison.benchmark(1024 * 100); // 100KB

      expect(result.uint8ArrayMs).toBeGreaterThan(0);
      expect(result.dataViewMs).toBeGreaterThan(0);
      expect(typeof result.overhead).toBe("number");
    });
  });
});

describe("BinaryDataView Analyzer", () => {
  describe("readSignature()", () => {
    it("reads 4-byte signature as hex", () => {
      const bytes = new Uint8Array([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A]);
      const view = new BinaryDataView(bytes);

      expect(view.readSignature()).toBe("89504E47");
    });

    it("handles different signatures", () => {
      const pdf = new Uint8Array([0x25, 0x50, 0x44, 0x46]);
      expect(new BinaryDataView(pdf).readSignature()).toBe("25504446");

      const zip = new Uint8Array([0x50, 0x4B, 0x03, 0x04]);
      expect(new BinaryDataView(zip).readSignature()).toBe("504B0304");
    });
  });

  describe("readHex()", () => {
    it("reads bytes as hex string", () => {
      const bytes = new Uint8Array([0xAB, 0xCD, 0xEF, 0x12]);
      const view = new BinaryDataView(bytes);

      expect(view.readHex(4)).toBe("AB CD EF 12");
      expect(view.readHex(2)).toBe("AB CD");
      expect(view.readHex(2, 2)).toBe("EF 12");
    });
  });

  describe("readPngDimensions()", () => {
    it("reads PNG width and height", () => {
      // PNG header with IHDR chunk containing 256x256 dimensions
      const pngBytes = new Uint8Array([
        0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
        0x00, 0x00, 0x00, 0x0D, // IHDR length
        0x49, 0x48, 0x44, 0x52, // "IHDR"
        0x00, 0x00, 0x01, 0x00, // Width: 256 (big-endian)
        0x00, 0x00, 0x00, 0x80, // Height: 128 (big-endian)
        0x08, 0x06, 0x00, 0x00, 0x00, // Bit depth, color type, etc.
      ]);

      const view = new BinaryDataView(pngBytes);
      const dims = view.readPngDimensions();

      expect(dims).not.toBeNull();
      expect(dims!.width).toBe(256);
      expect(dims!.height).toBe(128);
    });

    it("returns null for non-PNG", () => {
      const notPng = new Uint8Array([0xFF, 0xD8, 0xFF, 0xE0]); // JPEG
      const view = new BinaryDataView(notPng);

      expect(view.readPngDimensions()).toBeNull();
    });

    it("returns null for truncated PNG", () => {
      const truncated = new Uint8Array([0x89, 0x50, 0x4E, 0x47]);
      const view = new BinaryDataView(truncated);

      expect(view.readPngDimensions()).toBeNull();
    });
  });

  describe("readElfHeader()", () => {
    it("reads ELF header correctly", () => {
      const elfBytes = new Uint8Array([
        0x7F, 0x45, 0x4C, 0x46, // ELF magic
        0x02, // 64-bit
        0x01, // Little-endian
        0x01, // ELF version
        0x00, // System V ABI
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, // Padding
      ]);

      const view = new BinaryDataView(elfBytes);
      const header = view.readElfHeader();

      expect(header).not.toBeNull();
      expect(header!.magic).toBe("7f 45 4c 46");
      expect(header!.bitness).toBe(64);
      expect(header!.endianness).toBe("LE");
      expect(header!.osAbi).toBe(0);
    });

    it("returns null for non-ELF", () => {
      const notElf = new Uint8Array([0x4D, 0x5A, 0x90, 0x00]); // PE/MZ
      const view = new BinaryDataView(notElf);

      expect(view.readElfHeader()).toBeNull();
    });
  });

  describe("readId3Tag()", () => {
    it("reads ID3v2 tag header", () => {
      const id3Bytes = new Uint8Array([
        0x49, 0x44, 0x33, // "ID3"
        0x04, // Version major: 4
        0x00, // Version minor: 0
        0x00, // Flags
        0x00, 0x00, 0x02, 0x10, // Size: 272 (syncsafe)
      ]);

      const view = new BinaryDataView(id3Bytes);
      const tag = view.readId3Tag();

      expect(tag).not.toBeNull();
      expect(tag!.version.major).toBe(4);
      expect(tag!.version.minor).toBe(0);
      expect(tag!.flags).toBe(0);
      expect(tag!.size).toBe(272);
    });

    it("returns null for non-ID3", () => {
      const notId3 = new Uint8Array([0xFF, 0xFB, 0x90, 0x00]); // MP3 frame
      const view = new BinaryDataView(notId3);

      expect(view.readId3Tag()).toBeNull();
    });
  });

  describe("readZipLocalHeader()", () => {
    it("reads ZIP local file header", () => {
      const filename = "test.txt";
      const zipBytes = new Uint8Array([
        0x50, 0x4B, 0x03, 0x04, // Local file header signature
        0x14, 0x00, // Version needed: 20
        0x00, 0x00, // General purpose flags
        0x08, 0x00, // Compression method: deflate
        0x00, 0x00, // Last mod file time
        0x00, 0x00, // Last mod file date
        0x12, 0x34, 0x56, 0x78, // CRC-32
        0x64, 0x00, 0x00, 0x00, // Compressed size: 100
        0xC8, 0x00, 0x00, 0x00, // Uncompressed size: 200
        0x08, 0x00, // Filename length: 8
        0x00, 0x00, // Extra field length: 0
        ...new TextEncoder().encode(filename),
      ]);

      const view = new BinaryDataView(zipBytes);
      const header = view.readZipLocalHeader();

      expect(header).not.toBeNull();
      expect(header!.signature).toBe(0x04034B50);
      expect(header!.version).toBe(20);
      expect(header!.compression).toBe(8); // deflate
      expect(header!.crc32).toBe(0x78563412);
      expect(header!.compressedSize).toBe(100);
      expect(header!.uncompressedSize).toBe(200);
      expect(header!.filename).toBe(filename);
    });

    it("returns null for non-ZIP", () => {
      const notZip = new Uint8Array([0x52, 0x61, 0x72, 0x21]); // RAR
      const view = new BinaryDataView(notZip);

      expect(view.readZipLocalHeader()).toBeNull();
    });
  });

  describe("detectFormat()", () => {
    it("detects PNG", () => {
      const png = new Uint8Array([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
      expect(new BinaryDataView(png).detectFormat()).toBe("PNG");
    });

    it("detects JPEG", () => {
      const jpeg = new Uint8Array([0xFF, 0xD8, 0xFF, 0xE0]);
      expect(new BinaryDataView(jpeg).detectFormat()).toBe("JPEG");
    });

    it("detects GIF", () => {
      const gif = new Uint8Array([0x47, 0x49, 0x46, 0x38, 0x39, 0x61]);
      expect(new BinaryDataView(gif).detectFormat()).toBe("GIF");
    });

    it("detects ZIP", () => {
      const zip = new Uint8Array([0x50, 0x4B, 0x03, 0x04]);
      expect(new BinaryDataView(zip).detectFormat()).toBe("ZIP");
    });

    it("detects PDF", () => {
      const pdf = new Uint8Array([0x25, 0x50, 0x44, 0x46]);
      expect(new BinaryDataView(pdf).detectFormat()).toBe("PDF");
    });

    it("detects GZIP", () => {
      const gzip = new Uint8Array([0x1F, 0x8B, 0x08, 0x00]);
      expect(new BinaryDataView(gzip).detectFormat()).toBe("GZIP");
    });

    it("detects ELF", () => {
      const elf = new Uint8Array([0x7F, 0x45, 0x4C, 0x46]);
      expect(new BinaryDataView(elf).detectFormat()).toBe("ELF");
    });

    it("detects MP3 with ID3", () => {
      const mp3 = new Uint8Array([0x49, 0x44, 0x33, 0x04]);
      expect(new BinaryDataView(mp3).detectFormat()).toBe("MP3 (ID3v2)");
    });

    it("returns Unknown for unrecognized", () => {
      const unknown = new Uint8Array([0x00, 0x00, 0x00, 0x00]);
      expect(new BinaryDataView(unknown).detectFormat()).toBe("Unknown");
    });
  });
});

describe("BinarySafety", () => {
  describe("validate()", () => {
    it("validates correct Uint8Array", () => {
      const bytes = new Uint8Array([1, 2, 3]);
      expect(BinarySafety.validate(bytes)).toBe(true);
    });

    it("throws on non-Uint8Array", () => {
      expect(() => BinarySafety.validate(null)).toThrow(TypeError);
      expect(() => BinarySafety.validate([])).toThrow(TypeError);
      expect(() => BinarySafety.validate("string")).toThrow(TypeError);
    });

    it("throws on empty Uint8Array", () => {
      expect(() => BinarySafety.validate(new Uint8Array())).toThrow(RangeError);
    });
  });

  describe("isValid()", () => {
    it("returns true for valid input", () => {
      expect(BinarySafety.isValid(new Uint8Array([1, 2, 3]))).toBe(true);
    });

    it("returns false for invalid input", () => {
      expect(BinarySafety.isValid(null)).toBe(false);
      expect(BinarySafety.isValid(new Uint8Array())).toBe(false);
      expect(BinarySafety.isValid("string")).toBe(false);
    });
  });

  describe("safeRead()", () => {
    it("reads bytes within bounds", () => {
      const view = toDataView(new Uint8Array([1, 2, 3, 4, 5]));
      const result = BinarySafety.safeRead(view, 1, 3);

      expect(result).not.toBeNull();
      expect(result!.length).toBe(3);
      expect(result![0]).toBe(2);
      expect(result![2]).toBe(4);
    });

    it("returns null for out-of-bounds read", () => {
      const view = toDataView(new Uint8Array([1, 2, 3]));

      expect(BinarySafety.safeRead(view, -1, 2)).toBeNull();
      expect(BinarySafety.safeRead(view, 2, 3)).toBeNull();
      expect(BinarySafety.safeRead(view, 5, 1)).toBeNull();
    });
  });

  describe("safeGetUint* methods", () => {
    let view: DataView;

    beforeAll(() => {
      const bytes = new Uint8Array([0x12, 0x34, 0x56, 0x78, 0x9A, 0xBC, 0xDE, 0xF0]);
      view = toDataView(bytes);
    });

    it("safeGetUint8 returns value within bounds", () => {
      expect(BinarySafety.safeGetUint8(view, 0)).toBe(0x12);
      expect(BinarySafety.safeGetUint8(view, 7)).toBe(0xF0);
    });

    it("safeGetUint8 returns null out of bounds", () => {
      expect(BinarySafety.safeGetUint8(view, -1)).toBeNull();
      expect(BinarySafety.safeGetUint8(view, 8)).toBeNull();
    });

    it("safeGetUint16 returns value within bounds", () => {
      expect(BinarySafety.safeGetUint16(view, 0, false)).toBe(0x1234);
      expect(BinarySafety.safeGetUint16(view, 0, true)).toBe(0x3412);
    });

    it("safeGetUint16 returns null out of bounds", () => {
      expect(BinarySafety.safeGetUint16(view, 7)).toBeNull();
      expect(BinarySafety.safeGetUint16(view, -1)).toBeNull();
    });

    it("safeGetUint32 returns value within bounds", () => {
      expect(BinarySafety.safeGetUint32(view, 0, false)).toBe(0x12345678);
      expect(BinarySafety.safeGetUint32(view, 0, true)).toBe(0x78563412);
    });

    it("safeGetUint32 returns null out of bounds", () => {
      expect(BinarySafety.safeGetUint32(view, 5)).toBeNull();
      expect(BinarySafety.safeGetUint32(view, -1)).toBeNull();
    });
  });

  describe("handleTruncatedFile()", () => {
    it("returns DataView when size is sufficient", () => {
      const bytes = new Uint8Array([1, 2, 3, 4, 5]);
      const view = BinarySafety.handleTruncatedFile(bytes, 5);

      expect(view).not.toBeNull();
      expect(view!.byteLength).toBe(5);
    });

    it("returns null when file is truncated", () => {
      const bytes = new Uint8Array([1, 2, 3]);
      const view = BinarySafety.handleTruncatedFile(bytes, 10);

      expect(view).toBeNull();
    });
  });

  describe("getSystemEndianness()", () => {
    it("returns LE or BE", () => {
      const endianness = BinarySafety.getSystemEndianness();
      expect(["LE", "BE"]).toContain(endianness);
    });
  });

  describe("detectEndianness()", () => {
    it("detects little-endian", () => {
      const bytes = new Uint8Array([0x78, 0x56, 0x34, 0x12]); // 0x12345678 in LE
      const view = toDataView(bytes);

      expect(BinarySafety.detectEndianness(view, 0, 0x12345678)).toBe("LE");
    });

    it("detects big-endian", () => {
      const bytes = new Uint8Array([0x12, 0x34, 0x56, 0x78]); // 0x12345678 in BE
      const view = toDataView(bytes);

      expect(BinarySafety.detectEndianness(view, 0, 0x12345678)).toBe("BE");
    });

    it("returns unknown when neither matches", () => {
      const bytes = new Uint8Array([0x00, 0x00, 0x00, 0x00]);
      const view = toDataView(bytes);

      expect(BinarySafety.detectEndianness(view, 0, 0x12345678)).toBe("unknown");
    });
  });
});

describe("SafeDataView", () => {
  it("creates safe wrapper", () => {
    const bytes = new Uint8Array([0x12, 0x34, 0x56, 0x78]);
    const safe = BinarySafety.createSafeView(bytes);

    expect(safe.byteLength).toBe(4);
  });

  it("returns null for out-of-bounds reads", () => {
    const bytes = new Uint8Array([0x12, 0x34, 0x56, 0x78]);
    const safe = new SafeDataView(bytes);

    expect(safe.getUint8(0)).toBe(0x12);
    expect(safe.getUint8(10)).toBeNull();

    expect(safe.getUint16(0)).toBe(0x1234);
    expect(safe.getUint16(4)).toBeNull();

    expect(safe.getUint32(0)).toBe(0x12345678);
    expect(safe.getUint32(1)).toBeNull();
  });

  it("reads bytes and strings safely", () => {
    const text = "Hello";
    const bytes = new TextEncoder().encode(text);
    const safe = new SafeDataView(bytes);

    const result = safe.getBytes(0, 5);
    expect(result).not.toBeNull();
    expect(new TextDecoder().decode(result!)).toBe(text);

    expect(safe.getString(0, 5)).toBe(text);
    expect(safe.getString(0, 100)).toBeNull();
  });
});

describe("safeResult()", () => {
  it("returns success for valid operation", () => {
    const result = safeResult(() => 42);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value).toBe(42);
    }
  });

  it("returns failure for throwing operation", () => {
    const result = safeResult(() => {
      throw new Error("Test error");
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("Test error");
    }
  });
});

describe("Performance", () => {
  it("conversion is fast (< 1ms for 1MB)", () => {
    const bytes = new Uint8Array(1024 * 1024);

    const start = performance.now();
    const view = toDataView(bytes);
    const duration = performance.now() - start;

    expect(duration).toBeLessThan(1);
    expect(view.byteLength).toBe(1024 * 1024);
  });

  it("DataView operations work correctly", () => {
    const bytes = new Uint8Array(8);
    const view = toDataView(bytes);

    view.setUint32(0, 0x12345678, false);
    expect(view.getUint32(0, false)).toBe(0x12345678);

    view.setFloat64(0, Math.PI, true);
    expect(view.getFloat64(0, true)).toBeCloseTo(Math.PI);
  });
});

describe("Integration with Bun APIs", () => {
  it("works with Bun.file().bytes()", async () => {
    // Create temp file
    const content = new Uint8Array([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
    const tempPath = `/tmp/test-${Date.now()}.bin`;
    await Bun.write(tempPath, content);

    // Read and convert
    const bytes = await Bun.file(tempPath).bytes();
    const view = new BinaryDataView(bytes);

    expect(view.readSignature()).toBe("89504E47");
    expect(view.detectFormat()).toBe("PNG");

    // Cleanup
    await Bun.$`rm -f ${tempPath}`.quiet();
  });

  it("works with Bun.gzipSync/gunzipSync", () => {
    const original = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]);
    const compressed = Bun.gzipSync(original);
    const view = new BinaryDataView(compressed);

    expect(view.detectFormat()).toBe("GZIP");

    const decompressed = Bun.gunzipSync(compressed);
    expect(Bun.deepEquals(original, decompressed)).toBe(true);
  });

  it("works with Bun.hash.crc32", () => {
    const bytes = new Uint8Array([1, 2, 3, 4, 5]);
    const view = toDataView(bytes);

    // Get bytes back from view
    const recovered = new Uint8Array(view.buffer, view.byteOffset, view.byteLength);

    const hash1 = Bun.hash.crc32(bytes);
    const hash2 = Bun.hash.crc32(recovered);

    expect(hash1).toBe(hash2);
  });
});
