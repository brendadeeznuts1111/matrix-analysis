# 🚀 **Enterprise Bundle v1.3.1 - CLI Flags Reference**

> **Complete command-line interface documentation**  
> **Generated: 2026-02-02T01:35:00Z** | **Version: v1.3.1**

---

## 🎯 **Overview**

The Enterprise Bundle CLI provides a comprehensive command-line interface for building, testing, deploying, and managing enterprise-grade Bun.js applications with zero-disk deployment capabilities.

---

## 📋 **Commands**

### **build**

Builds enterprise bundle with optional deployment steps.

```bash
bun enterprise-cli.ts build [OPTIONS]
```

**Description:**
- Compiles MCP code into optimized bundle
- Runs optional tests, benchmarks, and analysis
- Can upload to R2 and start development server

**Examples:**
```bash
# Basic build
bun enterprise-cli.ts build

# Build with custom version
bun enterprise-cli.ts build --version v1.3.1-custom

# Build and start server
bun enterprise-cli.ts build --server --port 3000

# Full pipeline
bun enterprise-cli.ts build --test --benchmark --analyze --upload --server
```

### **serve**

Starts development server with default bundle.

```bash
bun enterprise-cli.ts serve [OPTIONS]
```

**Description:**
- Creates and starts in-memory server
- Serves default MCP implementation
- Provides WebSocket PTY overlay

**Examples:**
```bash
# Start on default port (1382)
bun enterprise-cli.ts serve

# Start on custom port
bun enterprise-cli.ts serve --port 3000

# Start with custom version
bun enterprise-cli.ts serve --version v1.3.1-staging
```

### **test**

Runs comprehensive test suite.

```bash
bun enterprise-cli.ts test
```

**Description:**
- Executes unit and integration tests
- Validates bundle creation and functionality
- Checks performance targets

**Examples:**
```bash
# Run all tests
bun enterprise-cli.ts test

# Run tests with verbose output
bun enterprise-cli.ts test --verbose
```

### **benchmark**

Runs performance benchmarks.

```bash
bun enterprise-cli.ts benchmark
```

**Description:**
- Executes performance benchmarks
- Measures build and runtime metrics
- Compares against targets

**Examples:**
```bash
# Run benchmarks
bun enterprise-cli.ts benchmark

# Run with detailed output
bun enterprise-cli.ts benchmark --verbose
```

### **analyze**

Analyzes bundle composition and metrics.

```bash
bun enterprise-cli.ts analyze [OPTIONS]
```

**Description:**
- Builds bundle and analyzes composition
- Shows size, compression, and optimization metrics
- Identifies optimization opportunities

**Examples:**
```bash
# Analyze default bundle
bun enterprise-cli.ts analyze

# Analyze custom code
bun enterprise-cli.ts analyze --input ./custom-mcp.ts
```

### **upload**

Uploads bundle to R2 storage.

```bash
bun enterprise-cli.ts upload [OPTIONS]
```

**Description:**
- Builds and uploads bundle to Cloudflare R2
- Generates upload URLs and ETags
- Handles authentication and retry logic

**Examples:**
```bash
# Upload to default bucket
bun enterprise-cli.ts upload

# Upload to custom bucket
bun enterprise-cli.ts upload --bucket my-custom-bucket

# Upload with custom key prefix
bun enterprise-cli.ts upload --prefix production/v1.3.1
```

### **status**

Displays system status and health information.

```bash
bun enterprise-cli.ts status [OPTIONS]
```

**Description:**
- Shows system metrics and health checks
- Displays bundle and performance status
- Provides environment information

**Examples:**
```bash
# Show status table
bun enterprise-cli.ts status

# Show status as JSON
bun enterprise-cli.ts status --format json

# Show status once
bun enterprise-cli.ts status --once
```

### **version**

Displays version information.

```bash
bun enterprise-cli.ts version
```

**Description:**
- Shows Enterprise Bundle version
- Displays runtime and system information
- Lists available features

**Example:**
```bash
bun enterprise-cli.ts version
# Output: 🚀 Enterprise Bundle v1.3.1
```

### **help**

Displays help information.

```bash
bun enterprise-cli.ts help [COMMAND]
```

**Description:**
- Shows general help or command-specific help
- Displays usage examples and options
- Lists all available commands

**Examples:**
```bash
# Show general help
bun enterprise-cli.ts help

# Show build command help
bun enterprise-cli.ts help build

# Show serve command help
bun enterprise-cli.ts help serve
```

---

## ⚙️ **Options**

### **Global Options**

These options can be used with any command:

#### **--version, -v**

Set bundle version.

```bash
bun enterprise-cli.ts build --version v1.3.1-custom
```

**Values:** Any semantic version string
**Default:** `v1.3.1`

#### **--verbose**

Enable verbose logging output.

```bash
bun enterprise-cli.ts build --verbose
```

**Description:** Shows detailed build process information
**Default:** Disabled

#### **--help, -h**

Show help information.

```bash
bun enterprise-cli.ts --help
bun enterprise-cli.ts build --help
```

---

### **Build-Specific Options**

#### **--port, -p**

Set server port.

```bash
bun enterprise-cli.ts build --port 3000
```

**Values:** 1-65535
**Default:** `1382`

#### **--output, -o**

Set output directory.

```bash
bun enterprise-cli.ts build --output ./dist
```

**Values:** Valid directory path
**Default:** `./dist`

#### **--format, -f**

Set output format.

```bash
bun enterprise-cli.ts status --format json
```

**Values:** `table`, `json`, `markdown`
**Default:** `table`

#### **--test**

Run tests before build.

```bash
bun enterprise-cli.ts build --test
```

**Description:** Executes test suite before building
**Default:** Disabled

#### **--benchmark**

Run benchmarks after build.

```bash
bun enterprise-cli.ts build --benchmark
```

**Description:** Executes performance benchmarks after successful build
**Default:** Disabled

#### **--analyze**

Analyze bundle after build.

```bash
bun enterprise-cli.ts build --analyze
```

**Description:** Shows detailed bundle analysis after build
**Default:** Disabled

#### **--upload**

Upload to R2 after build.

```bash
bun enterprise-cli.ts build --upload
```

**Description:** Uploads bundle to Cloudflare R2 after successful build
**Default:** Disabled

#### **--server**

Start server after build.

```bash
bun enterprise-cli.ts build --server
```

**Description:** Starts in-memory server after successful build
**Default:** Disabled

---

### **Status-Specific Options**

#### **--interval, -i**

Set monitoring interval.

```bash
bun enterprise-cli.ts status --interval 10000
```

**Values:** Milliseconds (>= 1000)
**Default:** `30000` (30 seconds)

#### **--once, -o**

Run status check once and exit.

```bash
bun enterprise-cli.ts status --once
```

**Description:** Disables continuous monitoring
**Default:** Disabled (continuous monitoring)

#### **--json, -j**

Output status as JSON.

```bash
bun enterprise-cli.ts status --json
```

**Description:** Formats output as JSON instead of table
**Default:** Table format

---

### **Upload-Specific Options**

#### **--bucket**

Set R2 bucket name.

```bash
bun enterprise-cli.ts upload --bucket my-custom-bucket
```

**Values:** Valid R2 bucket name
**Default:** `factory-wager-mcp`

#### **--prefix**

Set upload key prefix.

```bash
bun enterprise-cli.ts upload --prefix production/v1.3.1
```

**Values:** Valid S3 key prefix
**Default:** `mcp/{version}/`

#### **--region**

Set R2 region.

```bash
bun enterprise-cli.ts upload --region auto
```

**Values:** `auto` or AWS region string
**Default:** `auto`

---

## 🌍 **Environment Variables**

### **Required for Upload**

| Variable | Description | Example |
|----------|-------------|---------|
| `R2_API_KEY` | R2 API access key | `abc123def456...` |
| `R2_ACCOUNT_ID` | Cloudflare account ID | `1234567890abcdef` |

### **Optional Configuration**

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `PUBLIC_API_URL` | API base URL | `http://localhost:1382` | `https://api.example.com` |
| `PUBLIC_VERSION` | Bundle version | `v1.3.1` | `v1.3.1-production` |
| `R2_BUCKET` | Default R2 bucket | `factory-wager-mcp` | `my-app-bucket` |
| `R2_ENDPOINT` | R2 endpoint URL | Auto-detected | `https://abc.r2.cloudflarestorage.com` |
| `SESSION_SECRET` | Session secret key | `dev-secret` | `super-secret-key` |
| `NODE_ENV` | Environment | `development` | `production` |
| `LOG_LEVEL` | Logging level | `info` | `debug` |

### **CLI Behavior**

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `CLI_DEFAULT_PORT` | Default server port | `1382` | `3000` |
| `CLI_OUTPUT_FORMAT` | Default output format | `table` | `json` |
| `STATUS_INTERVAL` | Status monitoring interval | `30000` | `10000` |

---

## 📝 **Usage Examples**

### **Development Workflow**

```bash
# 1. Run tests
bun enterprise-cli.ts test

# 2. Build with analysis
bun enterprise-cli.ts build --analyze --verbose

# 3. Start development server
bun enterprise-cli.ts serve --port 3000

# 4. Monitor status
bun enterprise-cli.ts status --interval 5000
```

### **Production Deployment**

```bash
# 1. Full pipeline
bun enterprise-cli.ts build \
  --version v1.3.1-production \
  --test \
  --benchmark \
  --analyze \
  --upload \
  --server

# 2. Upload to production bucket
bun enterprise-cli.ts upload \
  --bucket production-bucket \
  --prefix releases/v1.3.1

# 3. Check production status
bun enterprise-cli.ts status --format json
```

### **Performance Testing**

```bash
# 1. Run benchmarks
bun enterprise-cli.ts benchmark --verbose

# 2. Build with performance analysis
bun enterprise-cli.ts build --benchmark --analyze

# 3. Monitor system performance
bun enterprise-cli.ts status --interval 1000
```

### **CI/CD Integration**

```bash
#!/bin/bash
# ci-deploy.sh

set -e

echo "🧪 Running tests..."
bun enterprise-cli.ts test

echo "🔨 Building bundle..."
bun enterprise-cli.ts build \
  --version $CI_VERSION \
  --test \
  --benchmark \
  --analyze

echo "☁️ Uploading to R2..."
bun enterprise-cli.ts upload \
  --bucket $R2_BUCKET \
  --prefix $CI_VERSION

echo "📊 Checking status..."
bun enterprise-cli.ts status --once --format json

echo "🎉 Deployment complete!"
```

---

## 🔧 **Configuration Files**

### **.enterprise-bundle.json**

```json
{
  "version": "v1.3.1",
  "port": 1382,
  "output": "./dist",
  "format": "table",
  "r2": {
    "bucket": "factory-wager-mcp",
    "prefix": "mcp/",
    "region": "auto"
  },
  "build": {
    "test": true,
    "benchmark": false,
    "analyze": true,
    "upload": false,
    "server": false
  },
  "monitoring": {
    "interval": 30000,
    "continuous": true
  }
}
```

### **package.json scripts**

```json
{
  "scripts": {
    "build": "bun enterprise-cli.ts build",
    "build:prod": "bun enterprise-cli.ts build --test --benchmark --analyze --upload",
    "serve": "bun enterprise-cli.ts serve",
    "test": "bun enterprise-cli.ts test",
    "benchmark": "bun enterprise-cli.ts benchmark",
    "status": "bun enterprise-cli.ts status",
    "deploy": "bun enterprise-cli.ts build --version $npm_package_version --upload"
  }
}
```

---

## 📊 **Exit Codes**

| Code | Meaning | Description |
|------|---------|-------------|
| `0` | Success | Command completed successfully |
| `1` | General Error | Command failed with general error |
| `2` | Build Failed | Build process failed |
| `3` | Test Failed | Tests did not pass |
| `4` | Benchmark Failed | Benchmarks did not meet targets |
| `5` | Upload Failed | R2 upload failed |
| `6` | Server Failed | Server could not start |
| `7` | Configuration Error | Invalid configuration or options |

---

## 🚨 **Error Handling**

### **Common Errors**

#### **Build Errors**
```bash
❌ Build failed: Syntax error in MCP code
```
**Solution:** Check MCP code syntax and fix errors

#### **Upload Errors**
```bash
❌ Upload failed: Invalid R2 credentials
```
**Solution:** Verify R2_API_KEY and R2_ACCOUNT_ID environment variables

#### **Port Conflicts**
```bash
❌ Server failed: Port 1382 already in use
```
**Solution:** Use different port with `--port` option

#### **Memory Errors**
```bash
❌ Build failed: Out of memory
```
**Solution:** Increase available memory or optimize bundle size

### **Debug Mode**

Enable debug logging for troubleshooting:

```bash
LOG_LEVEL=debug bun enterprise-cli.ts build --verbose
```

### **Verbose Output**

Get detailed information about any command:

```bash
bun enterprise-cli.ts build --verbose
bun enterprise-cli.ts status --verbose
bun enterprise-cli.ts upload --verbose
```

---

## 🎯 **Best Practices**

### **Development**

```bash
# Use verbose output for development
bun enterprise-cli.ts build --verbose --analyze

# Start with low port for development
bun enterprise-cli.ts serve --port 3000

# Monitor frequently during development
bun enterprise-cli.ts status --interval 5000
```

### **Production**

```bash
# Always test before production build
bun enterprise-cli.ts build --test --benchmark --analyze

# Use specific version for production
bun enterprise-cli.ts build --version v1.3.1-production

# Upload to production bucket
bun enterprise-cli.ts upload --bucket production-bucket
```

### **CI/CD**

```bash
# Use environment variables for configuration
export R2_BUCKET=$CI_BUCKET
export PUBLIC_VERSION=$CI_VERSION

# Run full pipeline in CI
bun enterprise-cli.ts build --test --benchmark --analyze --upload
```

---

## 🔗 **Related Documentation**

- **API Reference**: `./references/api-reference.md`
- **Testing Guide**: `./tests/README.md`
- **Deployment Guide**: `./docs/deployment.md`
- **Performance Guide**: `./benchmarks/README.md`

---

## 📞 **Support**

For CLI issues:

```bash
# Get help for specific command
bun enterprise-cli.ts build --help

# Check system status
bun enterprise-cli.ts status --verbose

# Run diagnostics
bun enterprise-cli.ts test --verbose
```

---

**🎯 TIER-1380: ACTIVE ▵⟂⥂**

**Enterprise Bundle v1.3.1 - Complete CLI Reference**

---

*Generated: 2026-02-02T01:35:00Z | Version: v1.3.1 | Status: Production Ready*
