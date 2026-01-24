# Security Guide - Enterprise Dashboard

## 🔐 Bun Lifecycle Script Security

This project uses Bun's **default-secure** lifecycle script model to prevent supply-chain attacks. Only explicitly trusted packages can execute code during installation.

### How It Works

By default, Bun **blocks all lifecycle scripts** (`postinstall`, `preinstall`, etc.). This prevents malicious packages from running arbitrary code on your system.

### Trusted Dependencies in This Project

```json
// package.json
{
  "trustedDependencies": [
    "node-sass"            // Compiles Sass to native binary - in default trusted list
  ]
}
```

**Current Status**: Run `bun scripts/verify-trusted-deps.ts` to audit.

| Package | Source | Status |
|---------|--------|--------|
| node-sass | npm | Trusted (default list) |
| lodash | npm ^4.17.21 | Safe (npm registry) |

**⚠️ Important**: After adding a package to `trustedDependencies`, you **must reinstall it**:
```bash
bun remove pkg-name && bun add pkg-name
```

### Security Best Practices

#### 1. Review Before Trusting

Before adding a package to `trustedDependencies`, verify:
- ✅ It's from a reputable source (npm official registry)
- ✅ It has a legitimate need for native compilation
- ✅ You trust the maintainers
- ✅ It's not a file:/git:/github: dependency (these must ALWAYS be explicitly trusted)

#### 2. Default Trusted Packages

Bun automatically trusts the **top 500 most-used packages** with lifecycle scripts (like `esbuild`, `node-sass`, `sharp`). Full list: https://github.com/oven-sh/bun/blob/main/src/install/default-trusted-dependencies.txt

**Critical Exception**: This default list **does NOT apply** to:
- `file:./local-packages/tool`
- `github:user/repo`
- `git+https://...`
- Any non-npm source

These **must be explicitly added** to `trustedDependencies` even if the package name matches a trusted one.

#### 3. CI/CD Security

For maximum security in CI pipelines or when reviewing external code:

```bash
# Completely disable all lifecycle scripts
bun install --ignore-scripts
```

This overrides even `trustedDependencies`.

#### GitHub Actions Example

```yaml
# .github/workflows/ci.yml
name: CI

on:
  pull_request:
    types: [opened, synchronize]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v2

      # External PRs: block all lifecycle scripts
      - name: Install (external PR)
        if: github.event.pull_request.head.repo.fork == true
        run: bun install --ignore-scripts

      # Internal PRs: use trustedDependencies
      - name: Install (internal PR)
        if: github.event.pull_request.head.repo.fork == false
        run: bun install

      - run: bun test
      - run: bun run typecheck
```

### Common Issues

#### Package not working after install?

1. Check if it needs lifecycle scripts:
```bash
cat node_modules/package-name/package.json | grep -A 5 '"scripts"'
```

2. Add to `trustedDependencies` in `package.json`

3. Reinstall:
```bash
bun remove package-name && bun add package-name
```

#### "postinstall" error?

This means a package tried to run a lifecycle script but was blocked. Either:
- Add it to `trustedDependencies` (if you trust it)
- Or the package may be incompatible with Bun's security model

### 🏢 Enterprise-Specific Configuration

```json
{
  "trustedDependencies": [
    // Native compilation tools
    "node-sass",
    "sharp",
    "sqlite3",

    // Code generation
    "prisma",
    "@prisma/client",

    // Internal tools (always verify these!)
    "@yourcompany/build-tool",
    "@yourcompany/native-module"
  ]
}
```

### 🪟 Windows Native Module Support (Bun 1.3.6+)

Native modules now work reliably on Windows:

- **Hot reload** - Native modules reload without `napi_register_module_v1` errors
- **Worker threads** - Safe module sharing between main thread and workers
- **V8 type APIs** - `IsMap()`, `IsArray()`, `IsBigInt()` work correctly

```bash
# Windows CI is now reliable
bun test --watch  # Native modules work with HMR
```

**Minimum version:** Ensure `bun-version: ">=1.3.6"` in CI workflows.

### 🔍 Verifying Installation

To verify a package installed correctly with its scripts:

```bash
# Check Bun's install log
bun install 2>&1 | grep "postinstall"

# Should show: [package-name] postinstall successfully
```

### ✅ Security Checklist

- [ ] All packages in `trustedDependencies` are vetted
- [ ] No `file:` dependencies without explicit trust
- [ ] No `git:` dependencies without explicit trust
- [ ] CI uses `--ignore-scripts` for external PRs
- [ ] README documents why each package is trusted
- [ ] Review `trustedDependencies` quarterly

### 🛠️ Audit Script

Run the trusted dependencies audit:

```bash
bun run scripts/verify-trusted-deps.ts
```

### 🔑 Production Credentials with Bun Secrets

Use the OS keychain for sensitive credentials instead of environment files:

```typescript
// Store secret in OS keychain (macOS Keychain, Windows Credential Manager, etc.)
await Bun.secrets.set({
  service: "matrix-analysis",
  name: "npm-token",
  value: process.env.NPM_TOKEN!,
});

// Retrieve secret at runtime
const token = await Bun.secrets.get({
  service: "matrix-analysis",
  name: "npm-token",
});

// Delete when rotating credentials
await Bun.secrets.delete({
  service: "matrix-analysis",
  name: "npm-token",
});
```

**Benefits over .env files:**
- Encrypted at rest by OS
- Not accidentally committed to git
- Survives process restarts
- Access controlled by OS user permissions

**Setup script for production:**

```bash
# scripts/setup-secrets.ts
#!/usr/bin/env bun

const secrets = [
  { name: "npm-token", env: "NPM_TOKEN" },
  { name: "registry-password", env: "NPM_PASSWORD" },
];

for (const { name, env } of secrets) {
  const value = process.env[env];
  if (value) {
    await Bun.secrets.set({ service: "matrix-analysis", name, value });
    console.log(`Stored ${name} in keychain`);
  }
}
```

### ❓ Questions?

See the [Bun lifecycle scripts documentation](https://bun.sh/docs/install/lifecycle).
