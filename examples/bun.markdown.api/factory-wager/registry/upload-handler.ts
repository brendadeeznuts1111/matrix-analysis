// factory-wager/registry/upload-handler.ts
import { StreamingCRCValidator, IntegrityReport } from '../security/streaming-validator';

export interface UploadResult {
  path: string;
  integrity: {
    crc32: number;
    size: number;
  };
  throughput: number;
  strategy: string;
  latencyMs: number;
}

export interface UploadMetadata {
  packageName: string;
  version: string;
  author: string;
  expectedCrc32?: number;
  contentType: string;
}

export class RegistryUploadHandler {
  private validator = new StreamingCRCValidator();
  private uploadDir = '/tmp/registry/uploads';

  constructor() {
    // Ensure upload directory exists
    Bun.write(`${this.uploadDir}/.gitkeep`, '');
  }

  /**
   * Handle incoming tarball upload from CI/CD pipeline
   */
  async handleUpload(
    stream: ReadableStream,
    metadata: UploadMetadata,
    contentLength: number
  ): Promise<UploadResult> {
    const start = Bun.nanoseconds();
    const tempPath = `${this.uploadDir}/${metadata.packageName}-${metadata.version}-${Date.now()}.tgz`;

    console.log(`📦 Starting upload: ${metadata.packageName}@${metadata.version}`);
    console.log(`📊 Content length: ${(contentLength / 1024 / 1024).toFixed(2)}MB`);

    try {
      // 1. Stream to disk efficiently
      await this.streamToDisk(stream, tempPath, contentLength);

      // 2. Validate immediately after write
      const report = await this.validator.validateStream(tempPath, metadata.expectedCrc32);

      if (report.status === 'invalid') {
        await this.cleanup(tempPath);
        throw new Error(`❌ CRC32 Mismatch: Upload corrupted in transit. Expected: 0x${metadata.expectedCrc32?.toString(16).padStart(8, '0')}, Got: 0x${report.calculatedCrc.toString(16).padStart(8, '0')}`);
      }

      // 3. Move to permanent location
      const finalPath = `${this.uploadDir}/${metadata.packageName}-${metadata.version}.tgz`;
      const tempFile = Bun.file(tempPath);
      await Bun.write(finalPath, await tempFile.arrayBuffer());
      await this.cleanup(tempPath);

      const end = Bun.nanoseconds();
      const totalLatency = (end - start) / 1e6;

      console.log(`✅ Upload completed successfully`);
      console.log(`🚀 Throughput: ${report.throughputMbps.toFixed(0)}MB/s`);
      console.log(`💾 Memory usage: ${report.memoryUsageMb.toFixed(0)}MB`);
      console.log(`⚡ Total latency: ${totalLatency.toFixed(0)}ms`);

      return {
        path: finalPath,
        integrity: {
          crc32: report.calculatedCrc,
          size: contentLength
        },
        throughput: report.throughputMbps,
        strategy: report.strategy,
        latencyMs: totalLatency
      };

    } catch (error) {
      await this.cleanup(tempPath);
      throw error;
    }
  }

  /**
   * Handle multiple concurrent uploads
   */
  async handleBatchUploads(
    uploads: Array<{
      stream: ReadableStream;
      metadata: UploadMetadata;
      contentLength: number;
    }>
  ): Promise<UploadResult[]> {
    console.log(`🔄 Processing batch upload: ${uploads.length} packages`);

    // Process uploads in parallel with concurrency limit
    const concurrency = Math.min(uploads.length, 5);
    const results: UploadResult[] = [];

    for (let i = 0; i < uploads.length; i += concurrency) {
      const batch = uploads.slice(i, i + concurrency);
      const batchPromises = batch.map(async ({ stream, metadata, contentLength }) => {
        try {
          return await this.handleUpload(stream, metadata, contentLength);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          console.error(`❌ Upload failed for ${metadata.packageName}@${metadata.version}:`, errorMessage);
          throw error;
        }
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
    }

    return results;
  }

  /**
   * Pre-validate upload before streaming
   */
  async preValidateUpload(
    metadata: UploadMetadata,
    sampleChunk?: Uint8Array
  ): Promise<{ valid: boolean; reason?: string }> {
    // Check package name format
    if (!/^[a-z0-9-]+$/.test(metadata.packageName)) {
      return { valid: false, reason: 'Invalid package name format' };
    }

    // Check version format
    if (!/^\d+\.\d+\.\d+/.test(metadata.version)) {
      return { valid: false, reason: 'Invalid version format' };
    }

    // Validate content type
    const allowedTypes = ['application/gzip', 'application/x-gzip', 'application/tar+gzip'];
    if (!allowedTypes.includes(metadata.contentType)) {
      return { valid: false, reason: 'Invalid content type' };
    }

    // If sample chunk provided, do quick CRC32 validation
    if (sampleChunk && metadata.expectedCrc32) {
      const sampleCrc = Bun.hash.crc32(sampleChunk);
      // This is just a sanity check - full validation happens after upload
      console.log(`🔍 Sample CRC32: 0x${sampleCrc.toString(16).padStart(8, '0')}`);
    }

    return { valid: true };
  }

  /**
   * Stream data to disk efficiently
   */
  private async streamToDisk(
    stream: ReadableStream,
    filePath: string,
    expectedSize: number
  ): Promise<void> {
    const file = Bun.file(filePath);
    const writer = file.writer();
    
    try {
      const reader = stream.getReader();
      let receivedBytes = 0;
      
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          if (receivedBytes !== expectedSize) {
            throw new Error(`Size mismatch: expected ${expectedSize}, received ${receivedBytes}`);
          }
          break;
        }
        
        await writer.write(value);
        receivedBytes += value.length;
        
        // Progress logging for large files
        if (expectedSize > 100 * 1024 * 1024) { // > 100MB
          const progress = (receivedBytes / expectedSize * 100).toFixed(1);
          process.stdout.write(`\r📊 Progress: ${progress}%`);
        }
      }
      
      if (expectedSize > 100 * 1024 * 1024) {
        console.log(); // New line after progress
      }
      
      writer.end();
      
    } catch (error) {
      writer.end();
      throw error;
    }
  }

  /**
   * Cleanup temporary files
   */
  private async cleanup(filePath: string): Promise<void> {
    try {
      await Bun.file(filePath).delete();
    } catch {
      // Ignore cleanup errors
    }
  }

  /**
   * Get upload statistics
   */
  getUploadStats(): {
    uploadDir: string;
    availableSpace: string;
    activeUploads: number;
  } {
    return {
      uploadDir: this.uploadDir,
      availableSpace: 'N/A', // Would implement disk space check
      activeUploads: 0 // Would implement active upload tracking
    };
  }

  /**
   * Verify uploaded package integrity
   */
  async verifyUpload(packagePath: string, expectedCrc32: number): Promise<IntegrityReport> {
    console.log(`🔍 Verifying upload integrity: ${packagePath}`);
    
    const report = await this.validator.validateStream(packagePath, expectedCrc32);
    
    if (report.status === 'valid') {
      console.log(`✅ Upload integrity verified`);
      console.log(`📊 Throughput: ${report.throughputMbps.toFixed(0)}MB/s`);
      console.log(`💾 Memory usage: ${report.memoryUsageMb.toFixed(0)}MB`);
    } else {
      console.error(`❌ Upload integrity check failed`);
    }
    
    return report;
  }
}
