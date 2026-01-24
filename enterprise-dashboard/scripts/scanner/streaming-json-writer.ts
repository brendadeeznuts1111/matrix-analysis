/**
 * Streaming JSON Writer
 * Efficiently writes large JSON structures incrementally without loading everything into memory
 */

import { file } from "bun";
import type { FileSink } from "bun";

export class StreamingJSONWriter {
  private writer: FileSink;
  private itemCount = 0;
  private isFirstItem = true;
  private isClosed = false;

  constructor(outputPath: string) {
    this.writer = Bun.file(outputPath).writer();
  }

  /**
   * Write the opening of a JSON object or array
   */
  async writeHeader(header: string): Promise<void> {
    if (this.isClosed) {
      throw new Error("Writer is already closed");
    }
    await this.writer.write(header);
  }

  /**
   * Write a JSON item (object or value) to the stream
   * Automatically handles comma placement
   */
  async writeItem(item: unknown): Promise<void> {
    if (this.isClosed) {
      throw new Error("Writer is already closed");
    }

    if (!this.isFirstItem) {
      await this.writer.write(",");
    }

    const json = JSON.stringify(item);
    await this.writer.write(json);
    
    this.isFirstItem = false;
    this.itemCount++;
  }

  /**
   * Write raw JSON string (use with caution)
   */
  async writeRaw(json: string): Promise<void> {
    if (this.isClosed) {
      throw new Error("Writer is already closed");
    }
    await this.writer.write(json);
  }

  /**
   * Write the closing of a JSON structure
   */
  async writeFooter(footer: string): Promise<void> {
    if (this.isClosed) {
      throw new Error("Writer is already closed");
    }
    await this.writer.write(footer);
    await this.writer.end();
    this.isClosed = true;
  }

  /**
   * Close the writer and return statistics
   */
  async close(): Promise<{ itemCount: number }> {
    if (!this.isClosed) {
      await this.writer.end();
      this.isClosed = true;
    }
    return { itemCount: this.itemCount };
  }

  /**
   * Get current item count
   */
  getItemCount(): number {
    return this.itemCount;
  }
}

/**
 * Helper function to write a JSON array stream
 */
export async function writeJSONArray<T>(
  outputPath: string,
  items: AsyncIterable<T> | Iterable<T>,
  options?: {
    version?: string;
    metadata?: Record<string, unknown>;
    transform?: (item: T) => unknown;
  }
): Promise<{ itemCount: number; path: string }> {
  const writer = new StreamingJSONWriter(outputPath);

  // Write opening bracket
  await writer.writeHeader("[");

  // Stream items
  for await (const item of items) {
    const transformed = options?.transform ? options.transform(item) : item;
    await writer.writeItem(transformed);
  }

  // Write closing bracket
  await writer.writeFooter("]");

  const stats = await writer.close();
  return { ...stats, path: outputPath };
}

/**
 * Helper function to write a JSON object with a runs array (SARIF-like format)
 */
export async function writeJSONRuns<T>(
  outputPath: string,
  runs: AsyncIterable<T> | Iterable<T>,
  options?: {
    version?: string;
    metadata?: Record<string, unknown>;
    transform?: (item: T) => unknown;
  }
): Promise<{ itemCount: number; path: string }> {
  const writer = new StreamingJSONWriter(outputPath);

  // Build header object
  const headerObj: Record<string, unknown> = {
    version: options?.version || "2.1.0",
    ...options?.metadata,
  };
  
  // Write opening with version and metadata, then start runs array
  const headerJson = JSON.stringify(headerObj);
  await writer.writeHeader(headerJson.slice(0, -1) + ',"runs":['); // Remove closing } and add runs array

  // Stream runs
  for await (const run of runs) {
    const transformed = options?.transform ? options.transform(run) : run;
    await writer.writeItem(transformed);
  }

  // Write closing brackets
  await writer.writeFooter("]}");

  const stats = await writer.close();
  return { ...stats, path: outputPath };
}

/**
 * Example usage
 */
if (import.meta.main) {
  // Example 1: Simple array streaming
  console.log("📝 Example 1: Streaming JSON array");
  
  async function* generateNumbers() {
    for (let i = 0; i < 10; i++) {
      yield { id: i, value: i * 2 };
      await new Promise(resolve => setTimeout(resolve, 10)); // Simulate async
    }
  }

  const result1 = await writeJSONArray("./example-array.json", generateNumbers());
  console.log(`✅ Wrote ${result1.itemCount} items to ${result1.path}`);

  // Example 2: SARIF-like format
  console.log("\n📝 Example 2: SARIF-like format");
  
  async function* generateIssues() {
    for (let i = 0; i < 5; i++) {
      yield {
        tool: { name: "scanner" },
        results: [
          { ruleId: `rule-${i}`, message: { text: `Issue ${i}` } }
        ]
      };
      await new Promise(resolve => setTimeout(resolve, 10));
    }
  }

  const result2 = await writeJSONRuns("./example-runs.json", generateIssues(), {
    version: "2.1.0",
    metadata: { schema: "https://json.schemastore.org/sarif-2.1.0.json" }
  });
  console.log(`✅ Wrote ${result2.itemCount} runs to ${result2.path}`);

  // Example 3: Manual control
  console.log("\n📝 Example 3: Manual streaming control");
  
  const writer = new StreamingJSONWriter("./example-manual.json");
  await writer.writeHeader(`{"version": "1.0.0", "items": [`);
  
  for (let i = 0; i < 3; i++) {
    await writer.writeItem({ id: i, name: `Item ${i}` });
  }
  
  await writer.writeFooter("]}");
  const stats = await writer.close();
  console.log(`✅ Wrote ${stats.itemCount} items manually`);
}
