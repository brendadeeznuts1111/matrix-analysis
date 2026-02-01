import { FactoryWagerSecureCookieManager } from '../factory-wager/security/secure-cookie-manager'; // fixed relative path

const REGIONS = [
  'us-east',
  'eu-west',
  'ap-southeast',
  'sa-east',
  'af-south'
] as const;

type Region = typeof REGIONS[number];

async function simulateRegion(region: Region) {
  console.log(`\n┌─── Simulating region: ${region.toUpperCase()} ───┐`);

  const keyPair = await crypto.subtle.generateKey(
    { name: 'RSA-PSS', modulusLength: 4096, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' },
    true,
    ['sign', 'verify']
  );

  const manager = new FactoryWagerSecureCookieManager({
    signingKey: keyPair.privateKey,
    threatCheck: true,
    csrfBinding: true,
    partitionByRegion: true
  });

  const fakeReq = new Request('https://registry.factory-wager.internal/api/v2/health', {
    headers: new Headers({
      'X-Forwarded-For': `203.0.113.${Math.floor(Math.random()*255)}.${region}` 
    })
  });

  const sessionCookie = await manager.createSessionCookie(
    crypto.randomUUID(),
    fakeReq,
    { region, tier: 'production' }
  );

  console.log(`Cookie domain:    ${sessionCookie.domain}`);
  console.log(`Partitioned:      ${sessionCookie.partitioned}`);
  console.log(`Secure / HttpOnly: ${sessionCookie.secure} / ${sessionCookie.httpOnly}`);
  console.log(`SameSite:         ${sessionCookie.sameSite}`);
  console.log(`CSRF ref present: ${sessionCookie.value.includes('__csrf_ref')}`);

  // Simulate verification round-trip
  const verification = await manager.verifySessionCookie(sessionCookie, fakeReq);
  console.log(`Verification:     ${verification.valid ? 'PASS' : 'FAIL'}`);

  console.log(`└───────────────────────────────────────┘\n`);
}

async function runAllRegions() {
  console.log("FACTORYWAGER 5-REGION COOKIE SIMULATION v1.3.8");
  console.log("----------------------------------------");

  for (const region of REGIONS) {
    await simulateRegion(region);
  }

  console.log("Simulation complete. All regions validated.");
}

runAllRegions().catch(err => {
  console.error("Simulation failed:", err);
  process.exit(1);
});
