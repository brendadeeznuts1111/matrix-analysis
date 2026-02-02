// lib/archive.ts - TAR/archive operations via Bun.Archive
// =============================================================================
// Read tar archives and extract files
// =============================================================================

// -----------------------------------------------------------------------------
// BN-108: Archive Reading
// -----------------------------------------------------------------------------
export interface ArchiveEntry {
  name: string;
  size: number;
  data: string;
}

export const read = async (
  data: Uint8Array | ArrayBuffer
): Promise<Map<string, File> | null> => {
  try {
    const archive = new Bun.Archive(data);
    return await archive.files();
  } catch {
    return null;
  }
};

export const list = async (
  data: Uint8Array | ArrayBuffer
): Promise<string[] | null> => {
  try {
    const archive = new Bun.Archive(data);
    const files = await archive.files();
    return [...files.keys()];
  } catch {
    return null;
  }
};

export const extract = async (
  data: Uint8Array | ArrayBuffer,
  filename: string
): Promise<string | null> => {
  try {
    const archive = new Bun.Archive(data);
    const files = await archive.files();
    const file = files.get(filename);
    if (!file) return null;
    return await file.text();
  } catch {
    return null;
  }
};

export const extractBytes = async (
  data: Uint8Array | ArrayBuffer,
  filename: string
): Promise<Uint8Array | null> => {
  try {
    const archive = new Bun.Archive(data);
    const files = await archive.files();
    const file = files.get(filename);
    if (!file) return null;
    return new Uint8Array(await file.arrayBuffer());
  } catch {
    return null;
  }
};

// Get archive as blob (for re-transmission)
export const toBlob = async (
  data: Uint8Array | ArrayBuffer
): Promise<Blob | null> => {
  try {
    const archive = new Bun.Archive(data);
    return await archive.blob();
  } catch {
    return null;
  }
};
