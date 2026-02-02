// lib/sink.ts - ArrayBufferSink for streaming buffer construction
// =============================================================================
// Bun.ArrayBufferSink — fast incremental buffer building
// =============================================================================

// -----------------------------------------------------------------------------
// BN-110: Buffer Sink
// -----------------------------------------------------------------------------
export interface SinkOptions {
  asUint8Array?: boolean;
  highWaterMark?: number;
  stream?: boolean;
}

export const createSink = (options?: SinkOptions): Bun.ArrayBufferSink => {
  const sink = new Bun.ArrayBufferSink();
  sink.start({
    asUint8Array: options?.asUint8Array ?? true,
    highWaterMark: options?.highWaterMark,
    stream: options?.stream ?? false,
  });
  return sink;
};

// Build a Uint8Array from multiple writes
export const buildBuffer = (
  chunks: (string | Uint8Array | ArrayBuffer)[]
): Uint8Array => {
  const sink = new Bun.ArrayBufferSink();
  sink.start({ asUint8Array: true });
  for (const chunk of chunks) {
    sink.write(chunk);
  }
  return sink.end() as Uint8Array;
};

// Build a string from multiple writes
export const buildString = (
  chunks: (string | Uint8Array | ArrayBuffer)[]
): string => {
  const buf = buildBuffer(chunks);
  return new TextDecoder().decode(buf);
};
