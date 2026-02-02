# Tier-1380 OpenClaw Integration

Complete integration system connecting Telegram topics, local projects, Git repositories, and notification channels.

## 🏗️ Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   GitHub Repo   │────▶│  Webhook Bridge  │────▶│ Telegram Topic  │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                              │
                              ▼
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Local Project  │────▶│ Project Manager  │────▶│ Telegram Topic  │
└─────────────────┘     └──────────────────┘     └─────────────────┘
        │
        ▼
┌──────────────────┐
│  Git Hooks       │
│  (Auto-route)    │
└──────────────────┘
```

## 📁 Structure

```
.kimi/skills/tier1380-openclaw/
├── config/
│   ├── telegram-topics.yaml    # Topic definitions & routing rules
│   └── project-topics.yaml     # Project-to-topic mappings
├── scripts/
│   ├── lib/
│   │   └── bytes.ts            # Byte-safe file utilities
│   ├── topic-manager.ts        # Topic management CLI
│   ├── channel-monitor.ts      # Real-time monitoring
│   ├── project-integration.ts  # Project mapping
│   ├── github-webhook-bridge.ts # GitHub event handling
│   ├── topic-git-hooks.ts      # Git hook management
│   ├── project-watch.ts        # File system watcher
│   ├── notification-manager.ts # Notification rules
│   └── integration-status.ts   # Unified dashboard
├── kimi-shell/
│   └── kimi-cli.ts             # Unified CLI interface
└── docs/
    ├── TOPICS-CHANNELS.md      # Topics & channels guide
    └── PROJECT-INTEGRATION.md  # Project integration guide
```

## 🚀 Quick Start

### View Integration Status

```bash
kimi integration              # Full dashboard
kimi integration stats        # Statistics
kimi integration matrix       # Topic-project matrix
```

### Manage Topics

```bash
kimi topic list               # List all topics
kimi topic super              # Show super topics
kimi topic routing            # Display routing rules
kimi topic route "feat: add"  # Test message routing
```

### Project Integration

```bash
kimi project list             # List all projects
kimi project current          # Show current project
kimi project route "fix: bug" # Test project routing
```

### Git Hooks (Auto-Routing)

```bash
kimi hooks install            # Install for all projects
kimi hooks list               # Show installed hooks
kimi hooks uninstall          # Remove hooks
```

### File Watching

```bash
kimi watch start              # Watch all projects
kimi watch start nolarose-mcp-config  # Watch specific project
kimi watch status             # Show watch status
```

### GitHub Webhooks

```bash
kimi webhook test             # Test all event types
kimi webhook simulate push github.com/user/repo
kimi webhook server 3000      # Start webhook server
```

### Notifications

```bash
kimi notify rules             # Show notification rules
kimi notify enable nolarose-mcp-config deploy
kimi notify disable nolarose-mcp-config file_change
kimi notify test nolarose-mcp-config commit
```

### Channel Monitoring

```bash
kimi channel dashboard        # Real-time dashboard
kimi channel watch            # Watch mode
kimi channel stats            # Statistics
```

### Performance Monitoring (JSC)

```bash
kimi perf memory              # Show JSC memory report
kimi perf gc                  # Force garbage collection
kimi perf profile             # Run profiler test
kimi perf monitor [file]      # Monitor file read memory
```

Uses Bun's JavaScriptCore API for low-level performance monitoring:
- Heap usage tracking
- Memory delta monitoring
- JSC sampling profiler (when available)
- Object size estimation

## 📊 Telegram Topics

| ID | Name | Icon | Priority | Purpose |
|----|------|------|----------|---------|
| 1 | General | 📢 | normal | Status updates, general discussion |
| 2 | Alerts | 🚨 | high | Critical alerts, errors |
| 5 | Logs | 📊 | low | System logs, monitoring |
| 7 | Development | 💻 | normal | Code, PRs, development |

## 🔀 Super Topics

| Name | Topics | Icon | Description |
|------|--------|------|-------------|
| operations | 1, 2, 5 | ⚙️ | Operational topics |
| development | 7 | 🛠️ | Development topics |
| all | 1, 2, 5, 7 | 📋 | All topics |

## 📁 Project Mappings

| Project | Path | Default Topic | Hooks |
|---------|------|---------------|-------|
| nolarose-mcp-config | `/Users/nolarose` | 7 (Development) | ✅ |
| openclaw | `/Users/nolarose/openclaw` | 1 (General) | ✅ |
| matrix-agent | `/Users/nolarose/matrix-agent` | 7 (Development) | ✅ |

## 🔄 Auto-Routing Rules

### By Commit Message

| Pattern | Topic | Example |
|---------|-------|---------|
| `feat:` | 7 | `feat: add new feature` |
| `fix:` | 2 | `fix: resolve bug` |
| `docs:` | 1 | `docs: update README` |
| `test:` | 7 | `test: add unit tests` |
| `chore:` | 5 | `chore: update deps` |

### By File Type

| Extension | Topic | Description |
|-----------|-------|-------------|
| `.ts` | 7 | TypeScript files |
| `.test.ts` | 7 | Test files |
| `.md` | 1 | Documentation |
| `.yaml` | 5 | Configuration |
| `.json` | 5 | JSON files |

### By GitHub Event

| Event | Action | Topic | Message |
|-------|--------|-------|---------|
| push | - | 7 | 🚀 Push to main |
| pull_request | opened | 7 | 📋 PR opened |
| pull_request | merged | 1 | ✅ PR merged |
| issues | opened | 2 | 🐛 Issue opened |
| release | published | 1 | 🎉 Release v1.0.0 |

## 🛡️ Byte-Safe File Operations

All scripts use the `bytes.ts` utility for safe file handling:

- **Size Limits**: 10MB default for text files
- **Streaming**: Large files processed line-by-line
- **Auto-Rotation**: Logs rotate at 10MB
- **Binary Support**: ArrayBuffer for binary data

```typescript
// Safe text reading
import { readTextFile, streamLines, appendToFile } from "./lib/bytes.ts";

const content = await readTextFile(path);  // Null if >10MB

for await (const line of streamLines(path, { maxLines: 1000 })) {
  // Process line-by-line
}

await appendToFile(logPath, data, { rotate: true, maxSize: 10MB });
```

### JSC Performance Monitoring

Uses Bun's JavaScriptCore API for low-level performance analysis:

```typescript
// scripts/lib/jsc-monitor.ts
import { 
  getMemoryUsage, 
  profileFunction, 
  monitorMemory,
  serializeForIPC 
} from "./lib/jsc-monitor.ts";

// Get memory stats
const mem = getMemoryUsage();
console.log(`Heap: ${formatBytes(mem.heapUsed)}`);

// Profile a function
const { result, profile } = profileFunction(() => {
  return heavyComputation();
}, 100); // sample interval in microseconds

// Monitor memory during operation
const { result, memoryDelta } = await monitorMemory(async () => {
  return await processLargeFile();
}, "file-processing");

// Serialize for IPC (structured clone algorithm)
const buffer = serializeForIPC(largeObject);
```

## 🧪 Testing

```bash
# Test topic routing
kimi topic route "ERROR: database failed"
kimi topic route "feat: new feature"

# Test project routing
kimi project route nolarose-mcp-config "fix: critical bug"

# Test notification
kimi notify test nolarose-mcp-config commit

# Test webhook
kimi webhook simulate push github.com/user/repo
```

## 📈 Logs

Logs are stored in `logs/` directory:

| File | Purpose | Rotation |
|------|---------|----------|
| `topic-routing.jsonl` | Commit routing events | 10MB |
| `file-watch.jsonl` | File change events | 10MB |
| `notifications.jsonl` | Notification history | 10MB |

## 🔧 Configuration

### telegram-topics.yaml

```yaml
bot:
  username: "@mikehuntbot_bot"
  default_topic: 1

topics:
  1: { name: "General", icon: "📢", priority: "normal" }
  2: { name: "Alerts", icon: "🚨", priority: "high" }

routing:
  content_rules:
    - pattern: "^ERROR"
      topic: 2
      priority: urgent
```

### project-topics.yaml

```yaml
projects:
  nolarose-mcp-config:
    path: "/Users/nolarose"
    default_topic: 7
    notifications:
      on_push: true
      on_commit: true
```

## 🐛 Troubleshooting

### Hooks Not Working

```bash
# Check hook installation
kimi hooks list

# Reinstall hooks
kimi hooks install

# Check hook permissions
ls -la .git/hooks/*topic*
```

### Wrong Topic Routing

```bash
# Test routing
kimi topic route "your message"
kimi project route <project> "your message"

# Check configuration
cat config/project-topics.yaml
```

### Large File Issues

```bash
# Check file sizes
bun scripts/lib/bytes.ts info logs/topic-routing.jsonl

# Stream large files
bun scripts/lib/bytes.ts stream logs/file-watch.jsonl 100
```

## 📚 Documentation

- `docs/TOPICS-CHANNELS.md` - Topics & channels guide
- `docs/PROJECT-INTEGRATION.md` - Project integration details

## 🏷️ Version

**Tier-1380 OpenClaw v1.0.0**
- Bun v1.3.8+
- Telegram Bot API
- Git hooks
- GitHub Webhooks

---

*Part of the Tier-1380 OMEGA Protocol*
