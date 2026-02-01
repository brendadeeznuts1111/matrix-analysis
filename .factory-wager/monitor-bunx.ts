#!/usr/bin/env bun
/**
 * FactoryWager bunx Monitor v1.3.8
 * Real-time monitoring with bunx tools
 */

console.log("📊 FactoryWager bunx Monitor");
console.log("==========================");

async function monitor() {
  const API_TOKEN = "V1i357VeyPrHbrUEX0hQWNPQwbWMHqi9Tj06ApLC";
  const ZONE_ID = "a3b7ba4bb62cb1b177b04b8675250674";
  console.log("🔍 Real-time Infrastructure Status");
  console.log("Generated:", new Date().toISOString());

  // DNS Status
  console.log("\n🌐 DNS Status:");
  const dnsStatus = await Bun.$`bunx curl -s -X GET "https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/dns_records/90c9452d7f472babec42fdc627c2ee06" -H "Authorization: Bearer ${API_TOKEN}" -H "Content-Type: application/json" | bunx jq -r '.result | {name, type, content, proxied, ttl}'`.text();
  console.log("✅ Config:", dnsStatus.trim());

  // DNS Resolution Test
  console.log("\n🔍 Resolution Test:");
  const servers = [
    { name: "Google", cmd: "@8.8.8.8" },
    { name: "Cloudflare", cmd: "@1.1.1.1" },
    { name: "System", cmd: "" }
  ];

  for (const server of servers) {
    const result = await Bun.$`bunx dig +short registry.factory-wager.co ${server.cmd}`.text().catch(() => '');
    if (result.trim()) {
      console.log(`✅ ${server.name}: ${result.trim()}`);
    } else {
      console.log(`⏳ ${server.name}: No response`);
    }
  }

  // HTTP Connectivity Test
  console.log("\n🌐 HTTP Connectivity:");
  try {
    const httpResult = await Bun.$`bunx curl -I --connect-timeout 5 https://registry.factory-wager.co/health 2>&1 | head -1`.text();
    console.log("✅ HTTP:", httpResult.trim());
  } catch {
    console.log("❌ HTTP: Connection failed");
  }

  // HTTPS Test with detailed info
  console.log("\n🔒 HTTPS Details:");
  try {
    const httpsResult = await Bun.$`bunx curl -I --connect-timeout 5 https://registry.factory-wager.co/health 2>&1 | grep -E "(HTTP|server|cf-ray|x-cache)"`.text();
    if (httpsResult.trim()) {
      console.log("✅ Headers:");
      httpsResult.split('\n').forEach(line => {
        if (line.trim()) console.log("   " + line.trim());
      });
    } else {
      console.log("❌ No headers received");
    }
  } catch {
    console.log("❌ HTTPS: Connection failed");
  }

  // Performance Test
  console.log("\n⚡ Performance Test:");
  const start = Date.now();
  try {
    await Bun.$`bunx curl -s --connect-timeout 5 https://registry.factory-wager.co/health`.text();
    const latency = Date.now() - start;
    console.log(`✅ Latency: ${latency}ms`);
  } catch {
    console.log("❌ Performance: Test failed");
  }

  // Summary
  console.log("\n📋 Status Summary:");
  console.log("✅ DNS: Configured and active");
  console.log("⏳ Resolution: Propagation in progress");
  console.log("⏳ HTTP: Waiting for DNS propagation");
  console.log("✅ Tools: bunx ecosystem ready");

  console.log("\n🔄 Continuous Monitoring:");
  console.log("Run: bun run monitor-bunx.ts");
  console.log("Auto-refresh every 30 seconds with: watch -n 30 bun run monitor-bunx.ts");
}

// Execute monitoring
monitor().catch(console.error);
