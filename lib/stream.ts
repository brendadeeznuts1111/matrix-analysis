// lib/stream.ts - Stream consumption and creation helpers
// ═══════════════════════════════════════════════════════════════════════════════
// Wraps Bun.readableStreamTo* with consistent naming
// ═══════════════════════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────────────────────────────
// BN-040: Stream Consumers
// ─────────────────────────────────────────────────────────────────────────────
export const toText = (s: ReadableStream): Promise<string> =>
  Bun.readableStreamToText(s);

export const toJson = <T>(s: ReadableStream): Promise<T> =>
  Bun.readableStreamToJSON(s) as Promise<T>;

export const toBytes = (s: ReadableStream): Promise<Uint8Array> =>
  Bun.readableStreamToBytes(s);

export const toBuffer = (s: ReadableStream): Promise<ArrayBuffer> =>
  Bun.readableStreamToArrayBuffer(s);

export const toBlob = (s: ReadableStream): Promise<Blob> =>
  Bun.readableStreamToBlob(s);

export const toArray = <T>(s: ReadableStream): Promise<T[]> =>
  Bun.readableStreamToArray(s) as Promise<T[]>;

// ─────────────────────────────────────────────────────────────────────────────
// BN-041: Stream Creators
// ─────────────────────────────────────────────────────────────────────────────
export const fromIterable = <T>(
  iter: Iterable<T> | AsyncIterable<T>,
): ReadableStream => {
  const isAsync = Symbol.asyncIterator in Object(iter);
  return new ReadableStream({
    async start(controller) {
      if (isAsync) {
        for await (const chunk of iter as AsyncIterable<T>) {
          controller.enqueue(chunk);
        }
      } else {
        for (const chunk of iter as Iterable<T>) {
          controller.enqueue(chunk);
        }
      }
      controller.close();
    },
  });
};

export const fromText = (text: string): ReadableStream =>
  new ReadableStream({
    start(controller) {
      controller.enqueue(new TextEncoder().encode(text));
      controller.close();
    },
  });

// ─────────────────────────────────────────────────────────────────────────────
// BN-042: Promise Introspection
// ─────────────────────────────────────────────────────────────────────────────
export const peek = <T>(p: Promise<T>): T | Promise<T> =>
  Bun.peek(p);

export const status = (p: Promise<unknown>): "fulfilled" | "rejected" | "pending" =>
  Bun.peek.status(p);

// ─────────────────────────────────────────────────────────────────────────────
// BN-043: Compression (Zstandard + Gzip)
// ─────────────────────────────────────────────────────────────────────────────
export const zstdCompress = async (
  data: string | Uint8Array | ArrayBuffer
): Promise<Uint8Array | null> => {
  try {
    return await Bun.zstdCompress(data);
  } catch {
    return null;
  }
};

export const zstdDecompress = async (
  data: Uint8Array | ArrayBuffer
): Promise<Uint8Array | null> => {
  try {
    return await Bun.zstdDecompress(data);
  } catch {
    return null;
  }
};

export const zstdCompressSync = (
  data: string | Uint8Array | ArrayBuffer
): Uint8Array | null => {
  try {
    return Bun.zstdCompressSync(data);
  } catch {
    return null;
  }
};

export const zstdDecompressSync = (
  data: Uint8Array | ArrayBuffer
): Uint8Array | null => {
  try {
    return Bun.zstdDecompressSync(data);
  } catch {
    return null;
  }
};

export const gzip = (data: string | Uint8Array | ArrayBuffer): Uint8Array | null => {
  try {
    return Bun.gzipSync(data);
  } catch {
    return null;
  }
};

export const gunzip = (data: Uint8Array | ArrayBuffer): Uint8Array | null => {
  try {
    return Bun.gunzipSync(data);
  } catch {
    return null;
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// BN-097: Deflate/Inflate (raw zlib)
// ─────────────────────────────────────────────────────────────────────────────
export const deflate = (data: string | Uint8Array | ArrayBuffer): Uint8Array | null => {
  try {
    return Bun.deflateSync(data);
  } catch {
    return null;
  }
};

export const inflate = (data: Uint8Array | ArrayBuffer): Uint8Array | null => {
  try {
    return Bun.inflateSync(data);
  } catch {
    return null;
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// BN-098: Buffer Utilities
// ─────────────────────────────────────────────────────────────────────────────
export const concatBuffers = (
  buffers: (ArrayBuffer | Uint8Array)[]
): ArrayBuffer =>
  Bun.concatArrayBuffers(buffers);

// ─────────────────────────────────────────────────────────────────────────────
// BN-040b: Stream to FormData
// ─────────────────────────────────────────────────────────────────────────────
export const toFormData = (
  s: ReadableStream,
  boundary: string
): Promise<FormData> =>
  Bun.readableStreamToFormData(s, boundary);
