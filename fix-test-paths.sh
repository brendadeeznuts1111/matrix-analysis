#!/bin/bash
# Fix OMEGA test paths - Create symlinks for missing files

echo "🔧 Fixing OMEGA test path issues..."

# Create necessary directories
mkdir -p bin scripts config

# Create symlinks for binaries
echo "Creating binary symlinks..."
ln -sf .claude/bin/omega ./bin/omega 2>/dev/null || true
ln -sf .claude/bin/kimi-shell ./bin/kimi-shell 2>/dev/null || true
ln -sf .claude/bin/tier1380.ts ./bin/tier1380.ts 2>/dev/null || true

# Create symlink for scripts
echo "Creating scripts symlink..."
ln -sf .claude/scripts ./scripts 2>/dev/null || true

# Create symlink for config
echo "Creating config symlink..."
ln -sf .claude/config ./config 2>/dev/null || true

# Create a dummy wrangler.toml if it doesn't exist
if [ ! -f "wrangler.toml" ] && [ ! -f "wrangler.json" ]; then
    echo "Creating dummy wrangler.toml..."
    cat > wrangler.toml << EOF
name = "omega"
compatibility_date = "2024-01-01"
compatibility_flags = ["nodejs_compat"]
EOF
fi

# Verify symlinks
echo -e "\n✅ Verifying symlinks:"
ls -la bin/ | grep -E "omega|kimi|tier1380"
ls -la scripts/ | head -3
ls -la config/ | head -3
[ -f "wrangler.toml" ] && echo "wrangler.toml: ✓" || echo "wrangler.toml: ✗"

echo -e "\n🎯 Path fixes complete! Try running 'bun test' again."
