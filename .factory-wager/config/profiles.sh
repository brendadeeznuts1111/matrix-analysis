#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════════
# FactoryWager Profile System - Terminal & Bun.terminal Integration
# ═══════════════════════════════════════════════════════════════════════════════

# Source paths configuration
source "$(dirname "${BASH_SOURCE[0]}")/paths.sh"

# Profile configuration directory
export PROFILES_DIR="$CONFIG_DIR"
export PROFILES_CONFIG="$PROFILES_DIR/profiles.json"
export ACTIVE_PROFILE_FILE="$PROFILES_DIR/.active_profile"

# Default profiles data
declare -A DEFAULT_PROFILES
DEFAULT_PROFILES[development]='{
  "name": "development",
  "description": "Development environment with debugging enabled",
  "environment": "development",
  "terminal": {
    "shell": "zsh",
    "theme": "dark",
    "prompt": "⚡ FactoryWager Dev \\w\\$ ",
    "aliases": {
      "fw": "bun run .factory-wager/cli.ts",
      "fw-report": "bun run .factory-wager/reports/markdown-engine.ts",
      "fw-toml": "bun run .factory-wager/reports/toml-powered-generator.ts",
      "fw-audit": "bun run .factory-wager/audit-cli.sh",
      "fw-config": "cd .factory-wager && ls config/",
      "fw-types": "cd .factory-wager && ls types/",
      "fw-status": "git status && echo \"📊 Repository Status\"",
      "fw-clean": "git clean -fd && echo \"🧹 Cleaned working tree\""
    },
    "env_vars": {
      "NODE_ENV": "development",
      "DEBUG": "factory-wager:*",
      "FW_MODE": "development",
      "FW_LOG_LEVEL": "debug"
    }
  },
  "factoryWager": {
    "mode": "development",
    "reporting": {
      "format": "html",
      "output_dir": "./reports",
      "auto_generate": true
    },
    "features": {
      "markdown_engine": true,
      "toml_config": true,
      "audit_system": true,
      "archive_system": true
    }
  }
}'

DEFAULT_PROFILES[production]='{
  "name": "production",
  "description": "Production environment optimized for performance",
  "environment": "production",
  "terminal": {
    "shell": "bash",
    "theme": "dark",
    "prompt": "🏭 FactoryWager Prod \\w\\$ ",
    "aliases": {
      "fw": "bun run .factory-wager/cli.ts --prod",
      "fw-report": "bun run .factory-wager/reports/markdown-engine.ts --format=html --theme=dark",
      "fw-deploy": "bun run .factory-wager/archive-factory-wager.sh",
      "fw-status": "git status && echo \"📊 Production Status\"",
      "fw-health": "bun run .factory-wager/audit-cli.sh --health-check"
    },
    "env_vars": {
      "NODE_ENV": "production",
      "FW_MODE": "production",
      "FW_LOG_LEVEL": "info",
      "FW_PERFORMANCE": "enabled"
    }
  },
  "factoryWager": {
    "mode": "production",
    "reporting": {
      "format": "html",
      "output_dir": "./dist/reports",
      "auto_generate": false
    },
    "features": {
      "markdown_engine": true,
      "toml_config": true,
      "audit_system": true,
      "archive_system": true
    }
  }
}'

DEFAULT_PROFILES[audit]='{
  "name": "audit",
  "description": "Audit mode for compliance and security analysis",
  "environment": "testing",
  "terminal": {
    "shell": "bash",
    "theme": "light",
    "prompt": "🔍 FactoryWager Audit \\w\\$ ",
    "aliases": {
      "fw": "bun run .factory-wager/cli.ts --audit",
      "fw-audit": "bun run .factory-wager/audit-cli.sh --verbose",
      "fw-report": "bun run .factory-wager/reports/markdown-engine.ts --use-case=incident_report",
      "fw-validate": "bun run .factory-wager/audit-validator.ts",
      "fw-rotate": "bun run .factory-wager/audit-rotator.ts"
    },
    "env_vars": {
      "NODE_ENV": "testing",
      "FW_MODE": "audit",
      "FW_LOG_LEVEL": "verbose",
      "FW_AUDIT_MODE": "enabled",
      "FW_COMPLIANCE": "strict"
    }
  },
  "factoryWager": {
    "mode": "audit",
    "reporting": {
      "format": "markdown",
      "output_dir": "./audit/reports",
      "auto_generate": true
    },
    "features": {
      "markdown_engine": true,
      "toml_config": true,
      "audit_system": true,
      "archive_system": true
    }
  }
}'

DEFAULT_PROFILES[demo]='{
  "name": "demo",
  "description": "Demo mode for presentations and showcases",
  "environment": "development",
  "terminal": {
    "shell": "zsh",
    "theme": "auto",
    "prompt": "🎪 FactoryWager Demo \\w\\$ ",
    "aliases": {
      "fw": "bun run .factory-wager/cli.ts --demo",
      "fw-demo": "bun run .factory-wager/reports/markdown-engine.ts demo",
      "fw-showcase": "bun run .factory-wager/factory-wager-complete-bun-api.ts",
      "fw-colors": "bun run .factory-wager/factory-wager-terminal-reports.ts"
    },
    "env_vars": {
      "NODE_ENV": "development",
      "FW_MODE": "demo",
      "FW_LOG_LEVEL": "info",
      "FW_DEMO_MODE": "enabled"
    }
  },
  "factoryWager": {
    "mode": "demo",
    "reporting": {
      "format": "html",
      "output_dir": "./demo/reports",
      "auto_generate": true
    },
    "features": {
      "markdown_engine": true,
      "toml_config": true,
      "audit_system": false,
      "archive_system": false
    }
  }
}'

# ═══════════════════════════════════════════════════════════════════════════════
# Profile Management Functions
# ═══════════════════════════════════════════════════════════════════════════════

# Get active profile name
get_active_profile() {
    if [[ -f "$ACTIVE_PROFILE_FILE" ]]; then
        cat "$ACTIVE_PROFILE_FILE"
    else
        echo ""
    fi
}

# Set active profile
set_active_profile() {
    local profile_name="$1"
    if [[ -z "$profile_name" ]]; then
        echo "❌ Profile name required"
        return 1
    fi
    
    # Check if profile exists
    if ! profile_exists "$profile_name"; then
        echo "❌ Profile '$profile_name' not found"
        return 1
    fi
    
    echo "$profile_name" > "$ACTIVE_PROFILE_FILE"
    echo "✅ Active profile set to: $profile_name"
}

# Check if profile exists
profile_exists() {
    local profile_name="$1"
    
    # Check default profiles
    if [[ -n "${DEFAULT_PROFILES[$profile_name]}" ]]; then
        return 0
    fi
    
    # Check custom profiles file
    if [[ -f "$PROFILES_CONFIG" ]]; then
        local profile_check=$(jq -r ".\"$profile_name\"" "$PROFILES_CONFIG" 2>/dev/null)
        [[ "$profile_check" != "null" ]]
    else
        return 1
    fi
}

# Get profile data
get_profile() {
    local profile_name="$1"
    
    # Check default profiles first
    if [[ -n "${DEFAULT_PROFILES[$profile_name]}" ]]; then
        echo "${DEFAULT_PROFILES[$profile_name]}"
        return 0
    fi
    
    # Check custom profiles
    if [[ -f "$PROFILES_CONFIG" ]]; then
        jq -r ".\"$profile_name\"" "$PROFILES_CONFIG" 2>/dev/null
    else
        echo "null"
    fi
}

# List all available profiles
list_profiles() {
    echo "📋 Available FactoryWager Profiles:"
    echo ""
    
    local active_profile
    active_profile=$(get_active_profile)
    
    # List default profiles
    for profile_name in "${!DEFAULT_PROFILES[@]}"; do
        local profile_data="${DEFAULT_PROFILES[$profile_name]}"
        local description=$(echo "$profile_data" | jq -r '.description')
        local environment=$(echo "$profile_data" | jq -r '.environment')
        local mode=$(echo "$profile_data" | jq -r '.factoryWager.mode')
        
        if [[ "$profile_name" == "$active_profile" ]]; then
            echo "$profile_name [ACTIVE]"
        else
            echo "$profile_name"
        fi
        echo "  $description"
        echo "  Environment: $environment"
        echo "  Mode: $mode"
        echo ""
    done
    
    # List custom profiles if config file exists
    if [[ -f "$PROFILES_CONFIG" ]]; then
        local custom_profiles
        custom_profiles=$(jq -r 'keys[]' "$PROFILES_CONFIG" 2>/dev/null)
        
        for profile_name in $custom_profiles; do
            if [[ -z "${DEFAULT_PROFILES[$profile_name]}" ]]; then
                local profile_data
                profile_data=$(jq -r ".\"$profile_name\"" "$PROFILES_CONFIG" 2>/dev/null)
                local description=$(echo "$profile_data" | jq -r '.description')
                local environment=$(echo "$profile_data" | jq -r '.environment')
                local mode=$(echo "$profile_data" | jq -r '.factoryWager.mode')
                
                if [[ "$profile_name" == "$active_profile" ]]; then
                    echo "$profile_name [ACTIVE]"
                else
                    echo "$profile_name"
                fi
                echo "  $description"
                echo "  Environment: $environment"
                echo "  Mode: $mode"
                echo ""
            fi
        done
    fi
}

# Apply profile to current environment
apply_profile() {
    local profile_name="$1"
    
    if [[ -z "$profile_name" ]]; then
        profile_name=$(get_active_profile)
    fi
    
    if [[ -z "$profile_name" ]]; then
        echo "❌ No active profile to apply"
        return 1
    fi
    
    if ! profile_exists "$profile_name"; then
        echo "❌ Profile '$profile_name' not found"
        return 1
    fi
    
    local profile_data
    profile_data=$(get_profile "$profile_name")
    
    if [[ "$profile_data" == "null" ]]; then
        echo "❌ Failed to load profile '$profile_name'"
        return 1
    fi
    
    echo "🔧 Applying profile: $profile_name"
    
    # Apply environment variables
    local env_vars
    env_vars=$(echo "$profile_data" | jq -r '.terminal.env_vars | to_entries[] | "export \(.key)=\"\(.value)\""')
    
    if [[ -n "$env_vars" ]]; then
        echo "📝 Setting environment variables..."
        while IFS= read -r line; do
            eval "$line"
        done <<< "$env_vars"
    fi
    
    # Apply aliases
    local aliases
    aliases=$(echo "$profile_data" | jq -r '.terminal.aliases | to_entries[] | "alias \(.key)=\"\(.value)\""')
    
    if [[ -n "$aliases" ]]; then
        echo "🔗 Setting aliases..."
        while IFS= read -r line; do
            eval "$line"
        done <<< "$aliases"
    fi
    
    # Set FactoryWager specific variables
    local mode=$(echo "$profile_data" | jq -r '.factoryWager.mode')
    local report_format=$(echo "$profile_data" | jq -r '.factoryWager.reporting.format')
    local output_dir=$(echo "$profile_data" | jq -r '.factoryWager.reporting.output_dir')
    
    export FW_PROFILE="$profile_name"
    export FW_MODE="$mode"
    export FW_REPORT_FORMAT="$report_format"
    export FW_OUTPUT_DIR="$output_dir"
    
    echo "✅ Profile '$profile_name' applied successfully"
    echo "📊 Mode: $mode"
    echo "🎨 Report Format: $report_format"
    echo "📁 Output Directory: $output_dir"
}

# Generate shell configuration for profile
generate_shell_config() {
    local profile_name="$1"
    
    if [[ -z "$profile_name" ]]; then
        profile_name=$(get_active_profile)
    fi
    
    if [[ -z "$profile_name" ]]; then
        echo "# No active profile set"
        return 1
    fi
    
    if ! profile_exists "$profile_name"; then
        echo "# Profile '$profile_name' not found"
        return 1
    fi
    
    local profile_data
    profile_data=$(get_profile "$profile_name")
    
    if [[ "$profile_data" == "null" ]]; then
        echo "# Failed to load profile '$profile_name'"
        return 1
    fi
    
    echo "# FactoryWager Profile: $profile_name"
    local description
    description=$(echo "$profile_data" | jq -r '.description')
    echo "# $description"
    echo ""
    
    # Environment variables
    echo "# Environment Variables"
    local env_vars
    env_vars=$(echo "$profile_data" | jq -r '.terminal.env_vars | to_entries[] | "export \(.key)=\"\(.value)\""')
    if [[ -n "$env_vars" ]]; then
        echo "$env_vars"
    fi
    echo ""
    
    # Aliases
    echo "# Aliases"
    local aliases
    aliases=$(echo "$profile_data" | jq -r '.terminal.aliases | to_entries[] | "alias \(.key)=\"\(.value)\""')
    if [[ -n "$aliases" ]]; then
        echo "$aliases"
    fi
    echo ""
    
    # FactoryWager specific
    echo "# FactoryWager Configuration"
    local mode=$(echo "$profile_data" | jq -r '.factoryWager.mode')
    local report_format=$(echo "$profile_data" | jq -r '.factoryWager.reporting.format')
    local output_dir=$(echo "$profile_data" | jq -r '.factoryWager.reporting.output_dir')
    
    echo "export FW_PROFILE=\"$profile_name\""
    echo "export FW_MODE=\"$mode\""
    echo "export FW_REPORT_FORMAT=\"$report_format\""
    echo "export FW_OUTPUT_DIR=\"$output_dir\""
}

# Switch to a profile (set and apply)
switch_profile() {
    local profile_name="$1"
    
    if [[ -z "$profile_name" ]]; then
        echo "❌ Profile name required"
        echo "Available profiles:"
        list_profiles
        return 1
    fi
    
    set_active_profile "$profile_name"
    apply_profile "$profile_name"
}

# Export profile configuration
export_profile() {
    local profile_name="$1"
    local output_file="$2"
    
    if [[ -z "$profile_name" || -z "$output_file" ]]; then
        echo "❌ Usage: export_profile <profile_name> <output_file>"
        return 1
    fi
    
    if ! profile_exists "$profile_name"; then
        echo "❌ Profile '$profile_name' not found"
        return 1
    fi
    
    local profile_data
    profile_data=$(get_profile "$profile_name")
    
    local shell_config
    shell_config=$(generate_shell_config "$profile_name")
    
    local export_config
    export_config=$(cat << EOF
{
  "profile": $profile_data,
  "shell_config": $(echo "$shell_config" | jq -R . | jq -s .),
  "generated_at": "$(date -Iseconds)",
  "generated_by": "FactoryWager Profile System"
}
EOF
)
    
    echo "$export_config" | jq '.' > "$output_file"
    echo "✅ Profile '$profile_name' exported to $output_file"
}

# Initialize profile system
init_profiles() {
    echo "🚀 Initializing FactoryWager Profile System"
    
    # Create config directory if it doesn't exist
    if [[ ! -d "$PROFILES_DIR" ]]; then
        mkdir -p "$PROFILES_DIR"
    fi
    
    # Create profiles config file if it doesn't exist
    if [[ ! -f "$PROFILES_CONFIG" ]]; then
        echo "{}" > "$PROFILES_CONFIG"
    fi
    
    list_profiles
}

# ═══════════════════════════════════════════════════════════════════════════════
# CLI Interface
# ═══════════════════════════════════════════════════════════════════════════════

# Main CLI function
fw_profile() {
    local command="$1"
    shift
    
    case "$command" in
        "list"|"ls")
            list_profiles
            ;;
        "switch"|"sw")
            switch_profile "$@"
            ;;
        "apply"|"ap")
            apply_profile "$@"
            ;;
        "set"|"st")
            set_active_profile "$@"
            ;;
        "get"|"gt")
            get_active_profile
            ;;
        "generate"|"gen")
            generate_shell_config "$@"
            ;;
        "export"|"ex")
            export_profile "$@"
            ;;
        "init"|"")
            init_profiles
            ;;
        "help"|"--help"|"-h")
            echo "FactoryWager Profile System CLI"
            echo ""
            echo "Usage: fw_profile [command] [options]"
            echo ""
            echo "Commands:"
            echo "  list, ls          List all available profiles"
            echo "  switch, sw <name> Switch to a profile"
            echo "  apply, ap [name]  Apply profile to current environment"
            echo "  set, st <name>    Set active profile without applying"
            echo "  get, gt           Get current active profile name"
            echo "  generate, gen [name] Generate shell configuration"
            echo "  export, ex <name> <file> Export profile to file"
            echo "  init              Initialize profile system"
            echo "  help              Show this help message"
            echo ""
            echo "Examples:"
            echo "  fw_profile init                    # Initialize system"
            echo "  fw_profile list                    # List profiles"
            echo "  fw_profile switch development       # Switch to dev profile"
            echo "  fw_profile generate                 # Generate shell config"
            ;;
        *)
            echo "❌ Unknown command: $command"
            echo "Use 'fw_profile help' for usage information"
            return 1
            ;;
    esac
}

# Export all functions for use in other scripts
export -f get_active_profile set_active_profile profile_exists get_profile list_profiles
export -f apply_profile generate_shell_config switch_profile export_profile init_profiles fw_profile

# Auto-initialize when sourced directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    fw_profile "$@"
fi
