#!/usr/bin/env bun
// factory-wager/cli/fw-changelog.ts
import { execSync } from 'child_process';
import { ANSIDiffer } from '../render/ansi-diff';

interface ChangelogEntry {
  type: 'added' | 'removed' | 'modified';
  file: string;
  description: string;
}

function getGitDiff(from: string, to: string): string {
  try {
    return execSync(`git diff ${from}..${to} --name-status`, { encoding: 'utf-8' });
  } catch {
    return '';
  }
}

function generateChangelog(from: string = 'HEAD~1', to: string = 'HEAD'): void {
  console.log(`📋 Generating changelog: ${from} → ${to}\n`);
  
  const diff = getGitDiff(from, to);
  
  if (!diff.trim()) {
    console.log('No changes detected.');
    return;
  }
  
  const changes: ChangelogEntry[] = [];
  
  diff.split('\n').forEach(line => {
    const [status, ...pathParts] = line.trim().split(/\s+/);
    const file = pathParts.join(' ');
    
    if (!status || !file) return;
    
    switch (status) {
      case 'A':
        changes.push({ type: 'added', file, description: 'New file added' });
        break;
      case 'D':
        changes.push({ type: 'removed', file, description: 'File deleted' });
        break;
      case 'M':
        changes.push({ type: 'modified', file, description: 'File modified' });
        break;
    }
  });
  
  // Group by type
  const added = changes.filter(c => c.type === 'added');
  const removed = changes.filter(c => c.type === 'removed');
  const modified = changes.filter(c => c.type === 'modified');
  
  console.log('\x1b[1m╔══ CHANGELOG ══╗\x1b[0m\n');
  
  if (added.length > 0) {
    console.log('\x1b[32m\x1b[1m✨ Added:\x1b[0m');
    added.forEach(c => console.log(`  + ${c.file}`));
    console.log();
  }
  
  if (removed.length > 0) {
    console.log('\x1b[31m\x1b[1m🗑️  Removed:\x1b[0m');
    removed.forEach(c => console.log(`  - ${c.file}`));
    console.log();
  }
  
  if (modified.length > 0) {
    console.log('\x1b[33m\x1b[1m📝 Modified:\x1b[0m');
    modified.forEach(c => console.log(`  ~ ${c.file}`));
    console.log();
  }
  
  console.log(`\x1b[90mTotal: ${changes.length} changes\x1b[0m`);
  
  // Show detailed diff for markdown files
  const markdownChanges = modified.filter(c => c.file.endsWith('.md'));
  if (markdownChanges.length > 0) {
    console.log('\n\x1b[1m📄 Detailed Markdown Changes:\x1b[0m');
    const differ = new ANSIDiffer();
    
    markdownChanges.forEach(c => {
      try {
        const oldContent = execSync(`git show ${from}:${c.file}`, { encoding: 'utf-8' });
        const newContent = execSync(`git show ${to}:${c.file}`, { encoding: 'utf-8' });
        
        console.log(`\n\x1b[36m${c.file}:\x1b[0m`);
        console.log(differ.diffFiles(oldContent, newContent));
      } catch {
        console.log(`  (unable to show diff for ${c.file})`);
      }
    });
  }
}

// CLI entry
const args = process.argv.slice(2);
const fromIdx = args.findIndex(a => a.startsWith('--from='));
const toIdx = args.findIndex(a => a.startsWith('--to='));

const from = fromIdx >= 0 ? args[fromIdx].split('=')[1] : 'HEAD~1';
const to = toIdx >= 0 ? args[toIdx].split('=')[1] : 'HEAD';

generateChangelog(from, to);
