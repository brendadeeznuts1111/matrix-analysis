#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════════
# FactoryWager Path Configuration Constants
# ═══════════════════════════════════════════════════════════════════════════════

# Get git root directory
export GIT_ROOT=$(git rev-parse --show-toplevel 2>/dev/null || echo "$HOME")

# Get current working directory
export CWD=$(pwd)

# Get relative path from git root
export RELATIVE_PATH=$(realpath --relative-to="$GIT_ROOT" "$CWD" 2>/dev/null || echo "unknown")

# FactoryWager specific paths
export FACTORY_WAGER="$GIT_ROOT/.factory-wager"
export FACTORY_WAGER_LEGACY="$GIT_ROOT/factory-wager"

# Current working directory paths
export CONFIG_DIR="$CWD/config"
export REPORTS_DIR="$CWD/reports"
export TYPES_DIR="$CWD/types"
export AUDIT_DIR="$CWD/audit"
export SCHEMA_DIR="$CWD/schema"
export TASKS_DIR="$CWD/tasks"

# Configuration files
export REPORT_CONFIG="$CWD/config/report-config.toml"
export COLUMN_CONFIG="$CWD/config/column-config.toml"
export VISIBILITY_CONFIG="$CWD/config/column-visibility.toml"

# Type definition files
export REPORT_TYPES="$CWD/types/report-types.ts"
export REPORT_CONFIG_TYPES="$CWD/types/report-config-types.ts"
export COLUMN_TYPES="$CWD/types/column-types.ts"

# Report generators
export MARKDOWN_ENGINE="$CWD/reports/markdown-engine.ts"
export TOML_GENERATOR="$CWD/reports/toml-powered-generator.ts"

# Output directories
export OUTPUT_DIR="$CWD/reports"
export ARCHIVE_DIR="$CWD/archive"

# ═══════════════════════════════════════════════════════════════════════════════
# Utility Functions
# ═══════════════════════════════════════════════════════════════════════════════

# Check if path exists
path_exists() {
    [[ -e "$1" ]]
}

# Check if current directory is FactoryWager directory
is_factory_wager_dir() {
    [[ "$CWD" == "$FACTORY_WAGER" ]]
}

# Check if we're in a git repository
is_git_repo() {
    git rev-parse --git-dir >/dev/null 2>&1
}

# Get relative path from git root
get_relative_from_git_root() {
    local target_path="$1"
    realpath --relative-to="$GIT_ROOT" "$target_path" 2>/dev/null || echo "$target_path"
}

# Resolve path relative to current directory
resolve_from_cwd() {
    local target_path="$1"
    realpath -m "$CWD/$target_path"
}

# Print all path variables
print_paths() {
    echo "=== FactoryWager Path Configuration ==="
    echo "GIT_ROOT: $GIT_ROOT"
    echo "CWD: $CWD"
    echo "RELATIVE_PATH: $RELATIVE_PATH"
    echo ""
    echo "=== Key Directories ==="
    echo "FACTORY_WAGER: $FACTORY_WAGER"
    echo "CONFIG_DIR: $CONFIG_DIR"
    echo "REPORTS_DIR: $REPORTS_DIR"
    echo "TYPES_DIR: $TYPES_DIR"
    echo ""
    echo "=== Configuration Files ==="
    echo "REPORT_CONFIG: $REPORT_CONFIG"
    echo "COLUMN_CONFIG: $COLUMN_CONFIG"
    echo "VISIBILITY_CONFIG: $VISIBILITY_CONFIG"
    echo ""
    echo "=== Status ==="
    echo "Is FactoryWager dir: $(is_factory_wager_dir && echo "YES" || echo "NO")"
    echo "Is git repo: $(is_git_repo && echo "YES" || echo "NO")"
}

# Export all functions for use in other scripts
export -f path_exists is_factory_wager_dir is_git_repo get_relative_from_git_root resolve_from_cwd print_paths

# Auto-print paths when sourced directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    print_paths
fi
