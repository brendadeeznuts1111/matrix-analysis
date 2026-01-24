-- Bun Enterprise Scanner - Rules Database Schema
-- Run: sqlite3 rules.db < schema.sql

CREATE TABLE IF NOT EXISTS lint_rules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  pattern TEXT NOT NULL,
  category TEXT NOT NULL CHECK(category IN ('DEPS', 'PERF', 'COMPAT', 'SECURITY', 'STYLE')),
  scope TEXT NOT NULL DEFAULT 'GLOBAL' CHECK(scope IN ('IMPORT', 'EXPORT', 'GLOBAL', 'LOCAL', 'MODULE')),
  suggestion TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'warning' CHECK(severity IN ('error', 'warning', 'info')),
  enabled INTEGER NOT NULL DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_rules_category ON lint_rules(category);
CREATE INDEX IF NOT EXISTS idx_rules_enabled ON lint_rules(enabled);
CREATE INDEX IF NOT EXISTS idx_rules_severity ON lint_rules(severity);

-- Trigger to update updated_at timestamp
CREATE TRIGGER IF NOT EXISTS update_lint_rules_timestamp
  AFTER UPDATE ON lint_rules
  FOR EACH ROW
  BEGIN
    UPDATE lint_rules SET updated_at = datetime('now') WHERE id = OLD.id;
  END;

-- Default rules
INSERT OR IGNORE INTO lint_rules (name, pattern, category, scope, suggestion, severity) VALUES
-- DEPS rules (Node.js compatibility)
('node_fs_import', 'from\s+["\x27](?:node:)?fs["\x27]', 'DEPS', 'IMPORT', 'Use Bun.file() for file operations', 'warning'),
('node_child_process', 'from\s+["\x27](?:node:)?child_process["\x27]', 'DEPS', 'IMPORT', 'Use Bun.spawn() or Bun.$ for shell commands', 'warning'),
('node_fetch_import', 'from\s+["\x27]node-fetch["\x27]', 'DEPS', 'IMPORT', 'Use native fetch() - built into Bun', 'warning'),
('express_import', 'from\s+["\x27]express["\x27]', 'DEPS', 'IMPORT', 'Consider Bun.serve() for better performance', 'info'),
('axios_import', 'from\s+["\x27]axios["\x27]', 'DEPS', 'IMPORT', 'Consider native fetch() with Bun enhancements', 'info'),
('moment_import', 'from\s+["\x27]moment["\x27]', 'DEPS', 'IMPORT', 'Use Temporal API or date-fns for modern date handling', 'info'),

-- PERF rules (Performance patterns)
('sync_file_read', 'readFileSync\s*\(', 'PERF', 'GLOBAL', 'Use async Bun.file().text() for non-blocking I/O', 'warning'),
('json_parse_fs', 'JSON\.parse\s*\(\s*(?:fs\.readFileSync|await\s+fs)', 'PERF', 'GLOBAL', 'Use Bun.file(path).json() for direct parsing', 'warning'),
('sync_write', 'writeFileSync\s*\(', 'PERF', 'GLOBAL', 'Use Bun.write() for optimized file writing', 'warning'),
('inefficient_concat', '\.concat\s*\([^)]+\)\s*\.concat', 'PERF', 'GLOBAL', 'Use spread operator [...a, ...b] for array concat', 'info'),

-- SECURITY rules
('eval_usage', '(?:^|[^"\x27`])eval\s*\(', 'SECURITY', 'GLOBAL', 'Avoid eval() - use Function constructor or safer alternatives', 'error'),
('hardcoded_secret', '(?:password|secret|api_?key|token)\s*[:=]\s*["\x27][^"\x27]{8,}["\x27]', 'SECURITY', 'GLOBAL', 'Use environment variables: Bun.env.SECRET_NAME', 'error'),
('innerHTML_usage', '\.innerHTML\s*=', 'SECURITY', 'GLOBAL', 'Use textContent or sanitize HTML to prevent XSS', 'warning'),
('sql_concat', '(?:SELECT|INSERT|UPDATE|DELETE).*\+\s*(?:req\.|params\.|query\.)', 'SECURITY', 'GLOBAL', 'Use parameterized queries to prevent SQL injection', 'error'),

-- COMPAT rules (Cross-runtime compatibility)
('process_env_check', 'process\.env\.\w+\s*(?:===?|!==?)\s*(?:undefined|null)', 'COMPAT', 'GLOBAL', 'Use Bun.env for type-safe environment access', 'info'),
('require_usage', '\brequire\s*\(["\x27]', 'COMPAT', 'GLOBAL', 'Use ESM import syntax for better tree-shaking', 'info'),
('dirname_usage', '__dirname|__filename', 'COMPAT', 'GLOBAL', 'Use import.meta.dir and import.meta.file in ESM', 'info'),

-- STYLE rules
('console_log', 'console\.log\s*\(', 'STYLE', 'GLOBAL', 'Remove console.log or use proper logging', 'info'),
('todo_comment', '(?://|/\*)\s*TODO:', 'STYLE', 'GLOBAL', 'Address TODO comments before production', 'info'),
('any_type', ':\s*any\b', 'STYLE', 'GLOBAL', 'Avoid "any" type - use specific types', 'info');
