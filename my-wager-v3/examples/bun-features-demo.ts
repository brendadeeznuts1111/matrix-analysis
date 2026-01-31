#!/usr/bin/env bun
// examples/bun-features-demo.ts
// Demonstrating Bun.env, Bun.main, and Bun.sleep

console.log("Bun Features Demo");
console.log("==================");

// 1. Bun.env - Environment variables
console.log("\n1. Bun.env (Environment Variables):");
console.log(`NODE_ENV: ${Bun.env.NODE_ENV || 'undefined'}`);
console.log(`PATH exists: ${Bun.env.PATH ? 'Yes' : 'No'}`);
console.log(`HOME: ${Bun.env.HOME || 'undefined'}`);
console.log(`Custom env (TEST_VAR): ${Bun.env.TEST_VAR || 'undefined'}`);

// Set a custom environment variable
Bun.env.OMEGA_PHASE = "3.25";
console.log(`Set OMEGA_PHASE: ${Bun.env.OMEGA_PHASE}`);

// 2. Bun.main - Entry point detection
console.log("\n2. Bun.main (Entry Point):");
console.log(`Bun.main: ${Bun.main}`);
console.log(`import.meta.path: ${import.meta.path}`);
console.log(`Is main module: ${import.meta.path === Bun.main ? 'Yes' : 'No'}`);

// Demonstrate module detection
if (import.meta.path === Bun.main) {
  console.log("✅ This script is being directly executed");
  
  // Start a "server" only if run directly
  console.log("Starting demo server...");
  
  // 3. Bun.sleep - Async delays
  console.log("\n3. Bun.sleep (Async Delays):");
  
  console.log("Immediate message");
  await Bun.sleep(1000); // Sleep for 1 second
  console.log("Message after 1 second");
  
  await Bun.sleep(500); // Sleep for 500ms
  console.log("Message after 500ms more");
  
  // Sleep until specific time
  const futureTime = new Date(Date.now() + 750);
  console.log("Sleeping until specific time...");
  await Bun.sleep(futureTime);
  console.log("Woke up at specific time!");
  
  // Demonstrate Bun.sleep in a loop
  console.log("\nCountdown with Bun.sleep:");
  for (let i = 3; i > 0; i--) {
    console.log(`${i}...`);
    await Bun.sleep(500);
  }
  console.log("🚀 Lift off!");
  
} else {
  console.log("❌ This file was imported, not executed directly");
}

// Export functions to demonstrate import behavior
export function demoFunction() {
  return "This function can be imported";
}

// Show Bun.sleep with Date object
console.log("\n4. Advanced Bun.sleep Usage:");
const now = new Date();
const twoSecondsLater = new Date(now.getTime() + 2000);

console.log(`Current time: ${now.toISOString()}`);
console.log(`Sleeping until: ${twoSecondsLater.toISOString()}`);

// Only run the sleep demo if main module
if (import.meta.path === Bun.main) {
  await Bun.sleep(twoSecondsLater);
  console.log(`Woke up at: ${new Date().toISOString()}`);
  
  console.log("\n✅ All Bun features demonstrated successfully!");
}
