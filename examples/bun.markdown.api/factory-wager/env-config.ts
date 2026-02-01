#!/usr/bin/env bun
/**
 * FactoryWager Environment Configuration
 * Demonstrates public environment variable prefixes
 */

// Create test files
function setupEnvironment() {
  console.log(`🔧 Setting up environment files...`);
  
  // Create .env file with secrets
  Bun.write('.env', `
FACTORYWAGER_SECRET_KEY=supersecret
FACTORYWAGER_DB_PASSWORD=database123
FACTORYWAGER_API_TOKEN=private_token
FACTORYWAGER_INTERNAL_CONFIG=internal_value
`);

  // Create .env.public file with public variables
  Bun.write('.env.public', `
FACTORYWAGER_PUBLIC_API_KEY=abc123
FACTORYWAGER_PUBLIC_URL=https://api.factory-wager.com
FACTORYWAGER_PUBLIC_VERSION=1.3.0
FACTORYWAGER_PUBLIC_MODE=production
`);

  console.log(`✅ Environment files created`);
}

function testEnvironmentLoading() {
  console.log(`\n🧪 Testing Environment Loading`);
  console.log(`══════════════════════════════════════════════════════════════════════════════`);
  
  // Test 1: Default loading (only .env)
  console.log(`\n📊 Test 1: Default loading (.env only)`);
  const result1 = Bun.spawnSync(['bun', '-e', `
    console.log("PUBLIC:", process.env.FACTORYWAGER_PUBLIC_API_KEY);
    console.log("SECRET:", process.env.FACTORYWAGER_SECRET_KEY);
  `]);
  console.log(result1.stdout.toString());
  
  // Test 2: Public only
  console.log(`\n📊 Test 2: Public environment only`);
  const result2 = Bun.spawnSync(['bun', '--env-file=.env.public', '-e', `
    console.log("PUBLIC:", process.env.FACTORYWAGER_PUBLIC_API_KEY);
    console.log("SECRET:", process.env.FACTORYWAGER_SECRET_KEY);
  `]);
  console.log(result2.stdout.toString());
  
  // Test 3: Both files
  console.log(`\n📊 Test 3: Both environment files`);
  const result3 = Bun.spawnSync(['bun', '--env-file=.env', '--env-file=.env.public', '-e', `
    console.log("PUBLIC:", process.env.FACTORYWAGER_PUBLIC_API_KEY);
    console.log("SECRET:", process.env.FACTORYWAGER_SECRET_KEY);
  `]);
  console.log(result3.stdout.toString());
}

function demonstratePublicPrefix() {
  console.log(`\n🎯 Public Environment Variable Prefixes`);
  console.log(`══════════════════════════════════════════════════════════════════════════════`);
  
  console.log(`\n📋 Recommended Public Prefixes:`);
  console.log(`   • PUBLIC_* - Standard public variables`);
  console.log(`   • FACTORYWAGER_PUBLIC_* - FactoryWager public config`);
  console.log(`   • VITE_* - Vite build tool`);
  console.log(`   • NEXT_PUBLIC_* - Next.js framework`);
  console.log(`   • GATSBY_PUBLIC_* - Gatsby framework`);
  
  console.log(`\n🔧 Usage Examples:`);
  console.log(`   • API keys: FACTORYWAGER_PUBLIC_API_KEY`);
  console.log(`   • URLs: FACTORYWAGER_PUBLIC_API_URL`);
  console.log(`   • Version: FACTORYWAGER_PUBLIC_VERSION`);
  console.log(`   • Mode: FACTORYWAGER_PUBLIC_MODE`);
  
  console.log(`\n⚠️  Security Best Practices:`);
  console.log(`   • Keep secrets in .env (never commit)`);
  console.log(`   • Keep public vars in .env.public (safe to commit)`);
  console.log(`   • Use consistent naming conventions`);
  console.log(`   • Separate concerns clearly`);
}

function buildWithPublicEnv() {
  console.log(`\n🏗️  Building with Public Environment Variables`);
  console.log(`══════════════════════════════════════════════════════════════════════════════`);
  
  // Create a simple app that uses environment variables
  Bun.write('app.ts', `
console.log("🚀 FactoryWager App Starting...");
console.log("Public API Key:", process.env.FACTORYWAGER_PUBLIC_API_KEY);
console.log("Public URL:", process.env.FACTORYWAGER_PUBLIC_URL);
console.log("Version:", process.env.FACTORYWAGER_PUBLIC_VERSION);
console.log("Mode:", process.env.FACTORYWAGER_PUBLIC_MODE);
console.log("🎉 App loaded successfully!");
`);
  
  console.log(`\n📦 Building with public environment variables...`);
  
  const buildResult = Bun.spawnSync([
    'bun', 'build', 
    'app.ts',
    '--env-file=.env.public',
    '--env=FACTORYWAGER_PUBLIC_*',
    '--outfile=app-bundle.js',
    '--compile'
  ]);
  
  if (buildResult.exitCode === 0) {
    console.log(`✅ Build successful!`);
    console.log(`   Bundle: app-bundle.js`);
    
    // Test the compiled bundle
    console.log(`\n🧪 Testing compiled bundle...`);
    const testResult = Bun.spawnSync(['./app-bundle.js']);
    console.log(testResult.stdout.toString());
  } else {
    console.log(`❌ Build failed:`);
    console.log(buildResult.stderr.toString());
  }
}

if (import.meta.main) {
  setupEnvironment();
  testEnvironmentLoading();
  demonstratePublicPrefix();
  buildWithPublicEnv();
  
  console.log(`\n🎉 Environment Configuration Complete!`);
  console.log(`══════════════════════════════════════════════════════════════════════════════`);
}

export { setupEnvironment, testEnvironmentLoading, demonstratePublicPrefix, buildWithPublicEnv };
