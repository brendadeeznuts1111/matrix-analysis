#!/usr/bin/env bun
/**
 * FactoryWager Quick Status with bunx
 */

console.log("📊 FactoryWager Deployment Status");
console.log("===============================");
console.log("Generated: " + new Date().toISOString());

// DNS Status
console.log("\n🌐 DNS Configuration:");
const dnsResult = await Bun.$`bunx curl -s -X GET "https://api.cloudflare.com/client/v4/zones/a3b7ba4bb62cb1b177b04b8675250674/dns_records/90c9452d7f472babec42fdc627c2ee06" -H "Authorization: Bearer V1i357VeyPrHbrUEX0hQWNPQwbWMHqi9Tj06ApLC" -H "Content-Type: application/json" | bunx jq -r ".result | {name, type, content, proxied}"`.text();
console.log("✅ DNS Record:");
console.log("   " + dnsResult.trim());

// Token Status
console.log("\n🔐 API Token:");
const tokenStatus = await Bun.$`bunx curl -s -X GET "https://api.cloudflare.com/client/v4/user/tokens/verify" -H "Authorization: Bearer V1i357VeyPrHbrUEX0hQWNPQwbWMHqi9Tj06ApLC" | bunx jq -r ".success"`.text();
console.log("✅ Valid: " + tokenStatus.trim());

// DNS Resolution Test
console.log("\n🔍 DNS Resolution:");
const resolution = await Bun.$`bunx dig +short registry.factory-wager.co @1.1.1.1`.text().catch(() => '');
if (resolution.trim()) {
  console.log("✅ Resolves: " + resolution.trim());
} else {
  console.log("⏳ Propagation in progress");
}

console.log("\n🚀 Next Steps:");
console.log("1. Update token permissions: https://dash.cloudflare.com/profile/api-tokens");
console.log("2. Add permissions: Zone:Edit, Worker:Script:Edit, R2:Bucket:Edit");
console.log("3. Deploy: CLOUDFLARE_API_TOKEN=V1i357VeyPrHbrUEX0hQWNPQwbWMHqi9Tj06ApLC bunx wrangler deploy");
console.log("4. Test: bunx curl -I https://registry.factory-wager.co/health");
