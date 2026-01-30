#!/usr/bin/env bun
/**
 * Bun Compile-Time Feature Flags Demo
 * Demonstrates compile-time feature detection and conditional compilation
 */

// ═══════════════════════════════════════════════════════════════════════════════
// COMPILE-TIME FEATURE DETECTION
// ═══════════════════════════════════════════════════════════════════════════════

// These are evaluated at compile time, not runtime
const hasTerminalAPI = @hasFeature("terminal");
const hasS3Support = @hasFeature("s3");
const hasCrypto = @hasFeature("crypto");
const hasHTTP2 = @hasFeature("http2");
const hasWebGPU = @hasFeature("webgpu");

// Conditional compilation based on features
const features = {
  terminal: hasTerminalAPI ? "✅ Available" : "❌ Not available",
  s3: hasS3Support ? "✅ Available" : "❌ Not available",
  crypto: hasCrypto ? "✅ Available" : "❌ Not available",
  http2: hasHTTP2 ? "✅ Available" : "❌ Not available",
  webgpu: hasWebGPU ? "✅ Available" : "❌ Not available",
};

// ═══════════════════════════════════════════════════════════════════════════════
// COMPILE-TIME CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════

// These are evaluated at compile time and inlined
const COMPILE_TIME = {
  timestamp: @timestamp(),
  target: @target(),
  platform: @platform(),
  arch: @arch(),
  os: @os(),
  nodeVersion: @nodeVersion(),
  bunVersion: @bunVersion(),
  isRelease: @isRelease(),
  isDebug: @isDebug(),
  isTesting: @isTesting(),
};

// ═══════════════════════════════════════════════════════════════════════════════
// CONDITIONAL COMPILATION EXAMPLES
// ═══════════════════════════════════════════════════════════════════════════════

// Example 1: Feature-specific code paths
const featureSpecificCode = () => {
  // This code is only included if terminal feature is available
  @if (hasTerminalAPI) {
    console.log("Terminal API is available!");
    // Terminal-specific code here
  }
  
  // This code is only included if S3 feature is available
  @if (hasS3Support) {
    console.log("S3 support is available!");
    // S3-specific code here
  }
  
  // Fallback code for features not available
  @if (!hasTerminalAPI) {
    console.log("Terminal API not available, using fallback");
    // Fallback implementation
  }
};

// Example 2: Platform-specific optimizations
const platformOptimizations = () => {
  @if (@target() === "x86_64") {
    console.log("Running on x86_64 - using x86_64 optimizations");
    // x86_64 specific optimizations
  }
  
  @if (@target() === "arm64") {
    console.log("Running on arm64 - using ARM64 optimizations");
    // ARM64 specific optimizations (like the ccmp chains from the briefing)
  }
  
  @if (@platform() === "darwin") {
    console.log("Running on macOS - using macOS optimizations");
    // macOS specific optimizations
  }
};

// Example 3: Version-specific features
const versionSpecificFeatures = () => {
  @if (@bunVersion() >= "1.3.7") {
    console.log("Bun v1.3.7+ features available!");
    // Use new Bun v1.3.7+ features
  }
  
  @if (@bunVersion() >= "1.4.0") {
    console.log("Bun v1.4.0+ features available!");
    // Use new Bun v1.4.0+ features
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// RUNTIME FEATURE DETECTION (for comparison)
// ═══════════════════════════════════════════════════════════════════════════════

// These are evaluated at runtime
const runtimeFeatureDetection = async () => {
  console.log("\n=== RUNTIME FEATURE DETECTION ===\n");
  
  try {
    // Check if terminal API is available at runtime
    if (typeof Bun.Terminal === "function") {
      console.log("✅ Terminal API available at runtime");
    } else {
      console.log("❌ Terminal API not available at runtime");
    }
  } catch (error) {
    console.log("❌ Terminal API check failed:", error.message);
  }
  
  try {
    // Check if S3 is available at runtime
    if (typeof Bun.S3 === "function") {
      console.log("✅ S3 available at runtime");
    } else {
      console.log("❌ S3 not available at runtime");
    }
  } catch (error) {
    console.log("❌ S3 check failed:", error.message);
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// COMPILE-TIME OPTIMIZATION EXAMPLES
// ═══════════════════════════════════════════════════════════════════════════════

// Example 4: Zero-cost abstractions
const zeroCostAbstractions = () => {
  // This function is only included if crypto is available
  @if (hasCrypto) {
    const hashData = (data: string) => {
      const hash = Bun.hash.create("sha256");
      hash.update(data);
      return hash.digest();
    };
    
    console.log("Crypto hash:", hashData("hello world").toString("hex"));
  }
  
  // This function is only included if HTTP2 is available
  @if (hasHTTP2) {
    console.log("HTTP/2 features available");
    // HTTP/2 specific code
  }
};

// Example 5: Tree-shaking optimization
const treeShakableModule = () => {
  // Only include this function if webgpu is available
  @if (hasWebGPU) {
    const webGPUSample = () => {
      console.log("WebGPU sample code");
      // WebGPU specific code
    };
    webGPUSample();
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN EXECUTION
// ═══════════════════════════════════════════════════════════════════════════════

const main = async () => {
  console.log(`
╔══════════════════════════════════════════════════════════════════════════════╗
║                    BUN COMPILE-TIME FEATURE FLAGS DEMO                      ║
╚══════════════════════════════════════════════════════════════════════════════╝

Platform: ${process.platform}
Target: ${process.arch}
Bun Version: ${process.version}
`);

  console.log("\n=== COMPILE-TIME FEATURE DETECTION ===\n");
  console.log("Features:");
  for (const [feature, status] of Object.entries(features)) {
    console.log(`  ${feature}: ${status}`);
  }

  console.log("\n=== COMPILE-TIME CONSTANTS ===\n");
  console.log("Constants:");
  for (const [key, value] of Object.entries(COMPILE_TIME)) {
    console.log(`  ${key}: ${value}`);
  }

  console.log("\n=== CONDITIONAL COMPILATION EXAMPLES ===\n");
  featureSpecificCode();
  platformOptimizations();
  versionSpecificFeatures();

  console.log("\n=== COMPILE-TIME OPTIMIZATION EXAMPLES ===\n");
  zeroCostAbstractions();
  treeShakableModule();

  await runtimeFeatureDetection();

  console.log(`
╔══════════════════════════════════════════════════════════════════════════════╗
║                         DEMO COMPLETE                                        ║
╠══════════════════════════════════════════════════════════════════════════════╣
║ Features Demonstrated:                                                       ║
║   ✓ @hasFeature() - Compile-time feature detection                           ║
║   ✓ @if() - Conditional compilation                                          ║
║   ✓ @timestamp() - Compile-time timestamp                                    ║
║   ✓ @target() - Target architecture detection                               ║
║   ✓ @platform() - Platform detection                                         ║
║   ✓ @arch() - Architecture detection                                         ║
║   ✓ @os() - OS detection                                                     ║
║   ✓ @nodeVersion() - Node.js version detection                              ║
║   ✓ @bunVersion() - Bun version detection                                    ║
║   ✓ @isRelease() - Release build detection                                   ║
║   ✓ @isDebug() - Debug build detection                                       ║
║   ✓ @isTesting() - Testing build detection                                   ║
╠══════════════════════════════════════════════════════════════════════════════╣
║ Benefits:                                                                    ║
║   • Zero runtime overhead - features determined at compile time              ║
║   • Smaller binary size - unused code eliminated                             ║
║   • Better performance - no runtime feature checks                           ║
║   • Tree-shakable - dead code elimination                                    ║
║   • Platform-specific optimizations                                          ║
╚══════════════════════════════════════════════════════════════════════════════╝
`);
};

main().catch(console.error);
