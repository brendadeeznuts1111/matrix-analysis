/**
 * DataView Analysis Functions
 * Binary format parsing using DataView
 */

import { toDataView } from "./binary-conversion";

/**
 * BinaryDataView - Structured binary data analyzer
 */
export class BinaryDataView {
  private view: DataView;
  private offset: number = 0;

  constructor(bytes: Uint8Array) {
    this.view = toDataView(bytes);
  }

  /**
   * Get underlying DataView
   */
  getView(): DataView {
    return this.view;
  }

  /**
   * Get byte length
   */
  get byteLength(): number {
    return this.view.byteLength;
  }

  /**
   * Read file signature (first 4 bytes) using DataView
   */
  readSignature(): string {
    // DataView.getUint32 with endianness
    const signature = this.view.getUint32(0, false); // big-endian
    return signature.toString(16).padStart(8, "0").toUpperCase();
  }

  /**
   * Read first N bytes as hex string
   */
  readHex(length: number, offset: number = 0): string {
    const bytes: string[] = [];
    for (let i = 0; i < length && offset + i < this.view.byteLength; i++) {
      bytes.push(this.view.getUint8(offset + i).toString(16).padStart(2, "0"));
    }
    return bytes.join(" ").toUpperCase();
  }

  /**
   * Read PNG dimensions using DataView
   */
  readPngDimensions(): { width: number; height: number } | null {
    // Verify PNG signature: 89 50 4E 47 0D 0A 1A 0A
    if (this.view.byteLength < 24) return null;

    const sig = this.view.getUint32(0, false);
    if (sig !== 0x89504E47) return null;

    // PNG: IHDR at position 8+4+4=16, width/height are 4-byte big-endian ints
    const width = this.view.getUint32(16, false);
    const height = this.view.getUint32(20, false);

    return { width, height };
  }

  /**
   * Read JPEG dimensions (simplified - searches for SOF0 marker)
   */
  readJpegDimensions(): { width: number; height: number } | null {
    // JPEG signature: FFD8FF
    if (this.view.byteLength < 4) return null;
    if (this.view.getUint16(0, false) !== 0xFFD8) return null;

    // Search for SOF0 (Start of Frame) marker: FFC0
    for (let i = 2; i < this.view.byteLength - 9; i++) {
      if (this.view.getUint8(i) === 0xFF) {
        const marker = this.view.getUint8(i + 1);
        // SOF markers: C0-C3, C5-C7, C9-CB, CD-CF
        if (marker >= 0xC0 && marker <= 0xCF && marker !== 0xC4 && marker !== 0xC8 && marker !== 0xCC) {
          // Height at offset+5, width at offset+7 (2 bytes each, big-endian)
          const height = this.view.getUint16(i + 5, false);
          const width = this.view.getUint16(i + 7, false);
          return { width, height };
        }
      }
    }

    return null;
  }

  /**
   * Read ELF header using DataView
   */
  readElfHeader(): {
    magic: string;
    bitness: 32 | 64;
    endianness: "LE" | "BE";
    osAbi: number;
  } | null {
    if (this.view.byteLength < 16) return null;

    // ELF magic: 0x7F 0x45 0x4C 0x46
    const magic = Array.from({ length: 4 }, (_, i) =>
      this.view.getUint8(i).toString(16).padStart(2, "0")
    ).join(" ");

    if (magic !== "7f 45 4c 46") return null;

    // Bitness at offset 4: 1 = 32-bit, 2 = 64-bit
    const bitness = this.view.getUint8(4) === 2 ? 64 : 32;

    // Endianness at offset 5: 1 = LE, 2 = BE
    const endianness = this.view.getUint8(5) === 1 ? "LE" : "BE";

    // OS/ABI at offset 7
    const osAbi = this.view.getUint8(7);

    return { magic, bitness, endianness, osAbi };
  }

  /**
   * Read MP3 ID3v2 tag header
   */
  readId3Tag(): {
    version: { major: number; minor: number };
    flags: number;
    size: number;
  } | null {
    if (this.view.byteLength < 10) return null;

    // ID3v2 header: "ID3"
    const id = String.fromCharCode(
      this.view.getUint8(0),
      this.view.getUint8(1),
      this.view.getUint8(2)
    );

    if (id !== "ID3") return null;

    const major = this.view.getUint8(3);
    const minor = this.view.getUint8(4);
    const flags = this.view.getUint8(5);

    // Size is syncsafe integer (7 bits per byte)
    const size =
      ((this.view.getUint8(6) & 0x7F) << 21) |
      ((this.view.getUint8(7) & 0x7F) << 14) |
      ((this.view.getUint8(8) & 0x7F) << 7) |
      (this.view.getUint8(9) & 0x7F);

    return { version: { major, minor }, flags, size };
  }

  /**
   * Read ZIP local file header
   */
  readZipLocalHeader(offset: number = 0): {
    signature: number;
    version: number;
    flags: number;
    compression: number;
    crc32: number;
    compressedSize: number;
    uncompressedSize: number;
    filenameLength: number;
    extraLength: number;
    filename: string;
  } | null {
    if (offset + 30 > this.view.byteLength) return null;

    // Local file header signature: 0x04034b50
    const signature = this.view.getUint32(offset, true); // little-endian
    if (signature !== 0x04034b50) return null;

    const version = this.view.getUint16(offset + 4, true);
    const flags = this.view.getUint16(offset + 6, true);
    const compression = this.view.getUint16(offset + 8, true);
    const crc32 = this.view.getUint32(offset + 14, true);
    const compressedSize = this.view.getUint32(offset + 18, true);
    const uncompressedSize = this.view.getUint32(offset + 22, true);
    const filenameLength = this.view.getUint16(offset + 26, true);
    const extraLength = this.view.getUint16(offset + 28, true);

    // Read filename
    let filename = "";
    for (let i = 0; i < filenameLength && offset + 30 + i < this.view.byteLength; i++) {
      filename += String.fromCharCode(this.view.getUint8(offset + 30 + i));
    }

    return {
      signature,
      version,
      flags,
      compression,
      crc32,
      compressedSize,
      uncompressedSize,
      filenameLength,
      extraLength,
      filename,
    };
  }

  /**
   * Detect file format from signature
   */
  detectFormat(): string {
    const sig = this.readSignature();

    // Check common signatures
    if (sig.startsWith("89504E47")) return "PNG";
    if (sig.startsWith("FFD8FF")) return "JPEG";
    if (sig.startsWith("47494638")) return "GIF";
    if (sig.startsWith("52494646")) return "RIFF"; // WAV, AVI, WEBP
    if (sig.startsWith("504B0304")) return "ZIP";
    if (sig.startsWith("504B0506")) return "ZIP (empty)";
    if (sig.startsWith("7F454C46")) return "ELF";
    if (sig.startsWith("CAFEBABE")) return "Java Class / Mach-O Fat";
    if (sig.startsWith("FEEDFACE")) return "Mach-O 32-bit";
    if (sig.startsWith("FEEDFACF")) return "Mach-O 64-bit";
    if (sig.startsWith("25504446")) return "PDF";
    if (sig.startsWith("1F8B08")) return "GZIP";
    if (sig.startsWith("425A68")) return "BZIP2";
    if (sig.startsWith("377ABCAF")) return "7Z";

    // ID3 for MP3
    if (this.view.byteLength >= 3) {
      const id3 = String.fromCharCode(
        this.view.getUint8(0),
        this.view.getUint8(1),
        this.view.getUint8(2)
      );
      if (id3 === "ID3") return "MP3 (ID3v2)";
    }

    // MP3 frame sync
    if (this.view.byteLength >= 2) {
      const frameSync = this.view.getUint16(0, false);
      if ((frameSync & 0xFFE0) === 0xFFE0) return "MP3";
    }

    return "Unknown";
  }
}
