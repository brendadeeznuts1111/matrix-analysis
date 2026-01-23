# Contributing to Enterprise Dashboard

Thank you for your interest in contributing! This document provides guidelines and instructions for contributing.

## Code of Conduct

Be respectful, inclusive, and constructive in all interactions.

## Getting Started

### Prerequisites

- [Bun 1.3.6+](https://bun.sh/docs/installation)
- macOS (for Keychain integration)
- Git

### Setup

```bash
# Clone the repository
git clone https://github.com/brendadeeznuts1111/enterprise-dashboard.git
cd enterprise-dashboard

# Install dependencies
bun install

# Set up secrets (optional, for registry features)
export NPM_TOKEN="your-token"
bun run secrets

# Run tests
bun test

# Run dashboard
bun run dashboard
```

## Development Workflow

### Branch Naming

```
feature/<description>   # New features
fix/<description>       # Bug fixes
docs/<description>      # Documentation
refactor/<description>  # Code refactoring
```

### Commit Messages

Follow conventional commits format:

```
<type>(<scope>): <description>

Co-Authored-By: Your Name <email@example.com>
```

**Types:** `feat`, `fix`, `docs`, `refactor`, `test`, `perf`, `chore`

**Examples:**
```
feat(dashboard): add package size display
fix(registry): handle 401 errors gracefully
docs(readme): update installation steps
```

### Code Style

- Semicolons required
- Double quotes for strings
- Variables/functions: `camelCase`
- Constants: `UPPER_SNAKE_CASE`
- Types/Classes: `PascalCase`

### Testing

```bash
# Run all tests
bun test

# Run specific test file
bun test src/dashboard/index.test.ts

# Run with coverage
bun test --coverage
```

Use `bun:test` with `it()` (not `test()`):

```typescript
import { describe, it, expect } from "bun:test";

describe("feature", () => {
  it("should work correctly", () => {
    expect(result).toBe(expected);
  });
});
```

## Pull Request Process

1. **Create a branch** from `main`
2. **Make changes** with clear, focused commits
3. **Run tests** and ensure they pass
4. **Update documentation** if needed
5. **Submit PR** with description of changes

### PR Template

```markdown
## Summary
Brief description of changes

## Changes
- Change 1
- Change 2

## Test Plan
- [ ] Tests pass locally
- [ ] New tests added (if applicable)
- [ ] Documentation updated (if applicable)
```

### Review Process

- PRs require at least one approval
- CI checks must pass
- External PRs run with `--ignore-scripts` for security

## Security

### Reporting Vulnerabilities

See [SECURITY.md](./SECURITY.md) for security policy and reporting instructions.

### Supply Chain Security

This project uses Bun's security features:

- `trustedDependencies` - Explicit allowlist for lifecycle scripts
- `minimumReleaseAge` - 3-day delay for new package versions
- `linker: isolated` - Prevent phantom dependencies

When adding dependencies:

```bash
# Add with supply chain protection
bun run pm add <package> --min-age 3d

# If package needs postinstall scripts, add to trustedDependencies
```

## Workspaces

This is a monorepo with workspaces:

| Workspace | Package |
|-----------|---------|
| `dataview/` | `@enterprise/dataview` |
| `s3-project/` | `@enterprise/s3-project` |
| `string-width/` | `@enterprise/string-width` |

```bash
# Work in specific workspace
bun run pm install -f @enterprise/dataview
bun run pm add zod -f @enterprise/dataview
```

## Questions?

- Open an issue for bugs or feature requests
- Check existing issues before creating new ones

Thank you for contributing!
