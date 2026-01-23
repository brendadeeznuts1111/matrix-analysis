// Gate tests behind RUN_TESTS env variable
if (!process.env.RUN_TESTS) {
  console.error("⚠️  Tests require RUN_TESTS=1 environment variable");
  console.error("   Run: RUN_TESTS=1 bun test");
  process.exit(0);
}
