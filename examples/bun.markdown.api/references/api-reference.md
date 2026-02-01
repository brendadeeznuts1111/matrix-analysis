# 📚 **Enterprise Bundle v1.3.1 - API Reference**

> **Complete API documentation for BuildArtifact Streaming Matrix**  
> **Generated: 2026-02-02T01:30:00Z** | **Version: v1.3.1**

---

## 🎯 **Overview**

The Enterprise Bundle API provides a comprehensive suite of tools for building, deploying, and managing enterprise-grade Bun.js applications with zero-disk deployment, real-time monitoring, and WebSocket PTY overlay capabilities.

---

## 🏗️ **Core Classes**

### **EnterpriseBundleBuilder**

Main class for building and managing enterprise bundles.

```typescript
class EnterpriseBundleBuilder {
  constructor(version?: string);
  async buildInMemory(mcpCode: string): Promise<BuildResult>;
  async benchmark(artifacts: BuildArtifact[]): Promise<void>;
  async uploadToR2(artifact: BuildArtifact, bucketName?: string): Promise<UploadResult>;
  async createMemoryServer(artifact: BuildArtifact, port?: number): Promise<Server>;
  analyzeBundle(result: any): void;
}
```

#### **Constructor**

```typescript
constructor(version?: string)
```

Creates a new EnterpriseBundleBuilder instance.

**Parameters:**
- `version` (optional): Bundle version string (default: "v1.3.1")

**Returns:** EnterpriseBundleBuilder instance

**Example:**
```typescript
const builder = new EnterpriseBundleBuilder("v1.3.1-custom");
```

#### **buildInMemory()**

```typescript
async buildInMemory(mcpCode: string): Promise<BuildResult>
```

Builds an in-memory bundle from MCP code.

**Parameters:**
- `mcpCode`: MCP server code as string

**Returns:** Promise resolving to BuildResult object

**Example:**
```typescript
const mcpCode = `
export default {
  fetch(req: Request) {
    return new Response('Hello World');
  }
};
`;

const { result, artifacts } = await builder.buildInMemory(mcpCode);
```

#### **benchmark()**

```typescript
async benchmark(artifacts: BuildArtifact[]): Promise<void>
```

Runs performance benchmarks on build artifacts.

**Parameters:**
- `artifacts`: Array of BuildArtifact objects

**Example:**
```typescript
await builder.benchmark(artifacts);
// Output: 📈 arrayBuffer(): 7.20μs ±0.80μs (10000 runs)
```

#### **uploadToR2()**

```typescript
async uploadToR2(artifact: BuildArtifact, bucketName?: string): Promise<UploadResult>
```

Uploads build artifact to Cloudflare R2 storage.

**Parameters:**
- `artifact`: BuildArtifact to upload
- `bucketName` (optional): R2 bucket name (default: "factory-wager-mcp")

**Returns:** Promise resolving to UploadResult object

**Example:**
```typescript
const uploadResult = await builder.uploadToR2(artifact);
console.log(uploadResult.url); // https://bucket.r2.cloudflarestorage.com/key
```

#### **createMemoryServer()**

```typescript
async createMemoryServer(artifact: BuildArtifact, port?: number): Promise<Server>
```

Creates an in-memory server with WebSocket PTY overlay.

**Parameters:**
- `artifact`: BuildArtifact to serve
- `port` (optional): Server port (default: 1382)

**Returns:** Promise resolving to Server object

**Example:**
```typescript
const server = await builder.createMemoryServer(artifact, 3000);
// Server available at http://localhost:3000
```

#### **analyzeBundle()**

```typescript
analyzeBundle(result: any): void
```

Analyzes bundle composition and displays metrics.

**Parameters:**
- `result`: Build result object

**Example:**
```typescript
builder.analyzeBundle(result);
// Output: 📦 Bundle Size: 4510 bytes, Gzip: 1533 bytes (34.0%)
```

---

## 📦 **Interfaces**

### **BuildArtifact**

Extended Blob interface for build artifacts.

```typescript
interface BuildArtifact extends Blob {
  readonly kind: 'entry-point' | 'chunk' | 'asset' | 'sourcemap' | 'bytecode';
  readonly path: string;
  readonly loader: 'file' | 'js' | 'ts' | 'json' | 'wasm' | 'napi';
  readonly hash: string | null;
  readonly sourcemap: BuildArtifact | null;
  readonly size: number;
  readonly type: string;
  
  // Blob methods
  text(): Promise<string>;
  arrayBuffer(): Promise<ArrayBuffer>;
  stream(): ReadableStream<Uint8Array>;
  json(): Promise<any>;
  formData(): Promise<FormData>;
  bytes(): Promise<Uint8Array>;
  slice(start?: number, end?: number): Blob;
}
```

#### **Properties**

- `kind`: Type of artifact (entry-point, chunk, asset, sourcemap, bytecode)
- `path`: File path within bundle
- `loader`: Loader type for the artifact
- `hash`: Content hash (SHA-256)
- `sourcemap`: Associated sourcemap artifact
- `size`: Artifact size in bytes
- `type`: MIME type

#### **Methods**

All standard Blob methods plus:
- `bytes()`: Returns content as Uint8Array
- `json()`: Parses content as JSON
- `formData()`: Returns content as FormData

### **MCPBuildConfig**

Configuration interface for MCP builds.

```typescript
interface MCPBuildConfig {
  readonly entrypoints: string[];
  readonly target: 'bun';
  readonly minify: true;
  readonly bytecode: true;
  readonly env: 'PUBLIC_*';
  readonly metafile: true;
}
```

### **BuildResult**

Result object from build operations.

```typescript
interface BuildResult {
  result: {
    outputs: BuildArtifact[];
    logs: any[];
    metafile: any;
  };
  artifacts: BuildArtifact[];
}
```

### **UploadResult**

Result object from R2 upload operations.

```typescript
interface UploadResult {
  url: string;
  etag: string;
}
```

---

## 🌐 **API Endpoints**

### **Health Check**

```http
GET /api/health
```

Returns server health status and bundle information.

**Response:**
```json
{
  "status": "healthy",
  "version": "v1.3.1",
  "bundleSize": 4510,
  "timestamp": "2026-02-02T01:30:00.000Z"
}
```

### **Registry Information**

```http
GET /api/registry
```

Returns registry information and available endpoints.

**Response:**
```json
{
  "version": "v1.3.1",
  "endpoints": [
    "/api/health",
    "/api/registry",
    "/api/metrics"
  ],
  "timestamp": "2026-02-02T01:30:00.000Z"
}
```

### **System Metrics**

```http
GET /api/metrics
```

Returns real-time system metrics and performance data.

**Response:**
```json
{
  "requests": 847,
  "errors": 2,
  "uptime": 67.891,
  "memory": {
    "rss": 20971520,
    "heapTotal": 655360,
    "heapUsed": 262144,
    "external": 8192
  }
}
```

---

## 🔌 **WebSocket API**

### **Connection**

```javascript
const ws = new WebSocket('ws://localhost:1382');
```

### **Message Format**

All WebSocket messages use JSON format:

```typescript
interface WebSocketMessage {
  type: string;
  data?: any;
  timestamp: string;
}
```

### **Events**

#### **Session Created**

Sent when WebSocket connection is established.

```json
{
  "type": "session_created",
  "sessionId": "session-1643761800000",
  "timestamp": "2026-02-02T01:30:00.000Z"
}
```

#### **PTY Output**

Sent in response to commands or system output.

```json
{
  "type": "output",
  "data": "MCP v1.3.1 PTY: Command output",
  "timestamp": "2026-02-02T01:30:00.000Z"
}
```

#### **Commands**

Send commands to the PTY overlay:

```javascript
// Help command
ws.send(JSON.stringify({ command: 'help' }));

// Status command
ws.send(JSON.stringify({ command: 'status' }));

// Custom command
ws.send(JSON.stringify({ command: 'custom-data' }));
```

---

## 🚀 **CLI Commands**

### **Build Command**

```bash
bun enterprise-cli.ts build [OPTIONS]
```

Builds enterprise bundle with optional server startup.

**Options:**
- `--version, -v`: Set bundle version
- `--port, -p`: Server port (default: 1382)
- `--benchmark`: Run benchmarks after build
- `--analyze`: Analyze bundle after build
- `--upload`: Upload to R2 after build
- `--server`: Start server after build
- `--test`: Run tests before build

**Examples:**
```bash
# Basic build
bun enterprise-cli.ts build

# Build with server
bun enterprise-cli.ts build --server --port 3000

# Full pipeline
bun enterprise-cli.ts build --benchmark --analyze --upload --server
```

### **Serve Command**

```bash
bun enterprise-cli.ts serve [OPTIONS]
```

Starts development server with default bundle.

**Options:**
- `--port, -p`: Server port (default: 1382)
- `--version, -v`: Bundle version

**Example:**
```bash
bun enterprise-cli.ts serve --port 3000
```

### **Test Command**

```bash
bun enterprise-cli.ts test
```

Runs comprehensive test suite.

### **Benchmark Command**

```bash
bun enterprise-cli.ts benchmark
```

Runs performance benchmarks.

### **Status Command**

```bash
bun enterprise-cli.ts status
```

Displays system status and health information.

---

## 📊 **Performance Metrics**

### **Build Performance**

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| **Build Time** | <15ms | `performance.now()` |
| **Bundle Size** | <4.6KB | Build output analysis |
| **Artifact Count** | 1-10 | Build artifact enumeration |
| **Memory Usage** | <100MB | `process.memoryUsage()` |

### **Runtime Performance**

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| **API Response** | <10ms | HTTP request timing |
| **WebSocket Latency** | <2ms | WebSocket message timing |
| **Concurrent Requests** | 1000+ | Load testing |
| **Memory Efficiency** | <50MB | Runtime monitoring |

### **Benchmark Operations**

```typescript
// Built-in benchmarks
await builder.benchmark(artifacts);
// Output:
// 📈 arrayBuffer(): 7.20μs ±0.80μs (10000 runs)
// 📈 text(): 4.90μs ±0.60μs (10000 runs)
// 📈 stream(): 1.80μs/KB ±0.20μs (10000 runs)
```

---

## 🔧 **Configuration**

### **Environment Variables**

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `PUBLIC_API_URL` | API base URL | `http://localhost:1382` | No |
| `PUBLIC_VERSION` | Bundle version | `v1.3.1` | No |
| `R2_API_KEY` | R2 storage API key | - | Yes (for upload) |
| `R2_BUCKET` | R2 bucket name | `factory-wager-mcp` | No |
| `SESSION_SECRET` | Session secret key | `dev-secret` | No |
| `NODE_ENV` | Environment | `development` | No |

### **Build Configuration**

```typescript
const config: MCPBuildConfig = {
  entrypoints: ['./registry-mcp.ts'],
  target: 'bun',
  minify: true,
  bytecode: true,
  env: 'PUBLIC_*',
  metafile: true
};
```

---

## 🧪 **Testing API**

### **Unit Tests**

```bash
bun test tests/enterprise-bundle.test.ts
```

### **Integration Tests**

```typescript
// Example integration test
describe('Integration Tests', () => {
  it('should handle complete workflow', async () => {
    const builder = new EnterpriseBundleBuilder();
    const { result, artifacts } = await builder.buildInMemory(mcpCode);
    
    // Test all operations
    builder.analyzeBundle(result);
    await builder.benchmark(artifacts);
    const uploadResult = await builder.uploadToR2(artifacts[0]);
    const server = await builder.createMemoryServer(artifacts[0]);
    
    // Verify server
    const response = await fetch('http://localhost:1382/api/health');
    expect(response.status).toBe(200);
    
    server.stop();
  });
});
```

### **Performance Tests**

```bash
bun run benchmarks/performance.bench.ts
```

---

## 🔍 **Error Handling**

### **Build Errors**

```typescript
try {
  const { result, artifacts } = await builder.buildInMemory(mcpCode);
} catch (error) {
  if (error.message.includes('Build failed')) {
    console.error('Build error:', error.message);
    process.exit(2);
  }
}
```

### **Upload Errors**

```typescript
try {
  const uploadResult = await builder.uploadToR2(artifact);
} catch (error) {
  console.error('Upload failed:', error.message);
  process.exit(5);
}
```

### **Server Errors**

```typescript
try {
  const server = await builder.createMemoryServer(artifact);
} catch (error) {
  console.error('Server failed:', error.message);
  process.exit(6);
}
```

---

## 📈 **Monitoring**

### **System Status Monitor**

```typescript
import { SystemStatusMonitor } from './status/system-status';

const monitor = new SystemStatusMonitor();

// One-time status check
await monitor.collectMetrics();
await monitor.runHealthChecks();
monitor.displayStatus();

// Continuous monitoring
monitor.startMonitoring(30000); // 30 second interval
```

### **Health Checks**

The system runs the following health checks:

1. **System Health**: Basic system functionality
2. **Memory Health**: Memory usage and thresholds
3. **Network Health**: Network connectivity and latency
4. **Bundle Health**: Build process and size targets
5. **Performance Health**: Performance benchmarks
6. **API Health**: API response times

---

## 🎯 **Best Practices**

### **Build Optimization**

```typescript
// Use version-specific builders
const builder = new EnterpriseBundleBuilder('v1.3.1-production');

// Optimize bundle size
const mcpCode = `
export default {
  fetch(req) {
    return new Response('Optimized response');
  }
};
`;

// Analyze before deployment
const { result, artifacts } = await builder.buildInMemory(mcpCode);
builder.analyzeBundle(result);
```

### **Server Management**

```typescript
// Graceful server shutdown
const server = await builder.createMemoryServer(artifact);

process.on('SIGINT', () => {
  console.log('Shutting down gracefully...');
  server.stop();
  process.exit(0);
});
```

### **Error Recovery**

```typescript
// Retry failed uploads
async function uploadWithRetry(artifact: BuildArtifact, retries = 3): Promise<UploadResult> {
  for (let i = 0; i < retries; i++) {
    try {
      return await builder.uploadToR2(artifact);
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
  throw new Error('Upload failed after retries');
}
```

---

## 📚 **Examples**

### **Complete Workflow**

```typescript
import { EnterpriseBundleBuilder } from './enterprise-bundle-demo';

async function completeWorkflow() {
  const builder = new EnterpriseBundleBuilder('v1.3.1-example');
  
  const mcpCode = `
export default {
  async fetch(req) {
    const url = new URL(req.url);
    
    if (url.pathname === '/api/example') {
      return Response.json({
        message: 'Example endpoint',
        timestamp: new Date().toISOString()
      });
    }
    
    return new Response('Enterprise Bundle Example');
  }
};
`;

  // 1. Build
  const { result, artifacts } = await builder.buildInMemory(mcpCode);
  
  // 2. Analyze
  builder.analyzeBundle(result);
  
  // 3. Benchmark
  await builder.benchmark(artifacts);
  
  // 4. Upload
  const uploadResult = await builder.uploadToR2(artifacts[0]);
  console.log('Uploaded to:', uploadResult.url);
  
  // 5. Serve
  const server = await builder.createMemoryServer(artifacts[0], 3000);
  console.log('Server running on http://localhost:3000');
  
  // 6. Test
  const response = await fetch('http://localhost:3000/api/example');
  const data = await response.json();
  console.log('API Response:', data);
  
  // Cleanup
  server.stop();
}

completeWorkflow().catch(console.error);
```

---

## 🔗 **References**

- **Bun Documentation**: https://bun.sh/docs
- **Cloudflare R2**: https://developers.cloudflare.com/r2/
- **WebSocket API**: https://developer.mozilla.org/en-US/docs/Web/API/WebSocket
- **BuildArtifact Specification**: Internal documentation
- **MCP Protocol**: Model Context Protocol specification

---

## 📞 **Support**

For issues, questions, or contributions:

- **GitHub Issues**: Create an issue in the repository
- **Documentation**: Check this reference and inline comments
- **Examples**: See `examples/` directory for complete implementations
- **CLI Help**: Run `bun enterprise-cli.ts --help`

---

**🎯 TIER-1380: ACTIVE ▵⟂⥂**

**Enterprise Bundle v1.3.1 - Production-Ready API Reference**

---

*Generated: 2026-02-02T01:30:00Z | Version: v1.3.1 | Status: Production Ready*
