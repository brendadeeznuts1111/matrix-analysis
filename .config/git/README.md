# Enhanced Git Configuration

This directory contains enhanced git configuration for better developer workflow.

## What's Configured

### Commit Message Template
- Located at `commit-template.txt`
- Uses conventional commit format
- Includes examples and guidelines

### Git Hooks
- **pre-commit**: Runs linting and tests before commits
- **pre-push**: Runs type checking and build verification before pushes
- Located in `hooks/` directory

### Enhanced Aliases

#### Basic Workflow
- `git st` - status
- `git co <branch>` - checkout
- `git br` - branch
- `git ci` - commit
- `git back` - checkout previous branch

#### Advanced Operations
- `git uncommit` - undo last commit (keep changes)
- `git nuke` - reset hard + clean untracked
- `git recent` - last 10 commits
- `git graph` - visual branch graph
- `git review` - files changed since main

#### Conventional Commits
- `git feat "message"` - feature commit
- `git fix "message"` - bug fix commit
- `git docs "message"` - documentation
- `git refactor "message"` - code refactor
- `git test "message"` - test changes
- `git chore "message"` - maintenance

#### Branch Management
- `git feature <name>` - create feature branch
- `git hotfix <name>` - create hotfix branch
- `git release <name>` - create release branch
- `git cleanup` - remove merged branches
- `git sync` - fetch + rebase current branch
- `git ship` - push current branch

#### WIP Management
- `git wip` - commit all as "WIP"
- `git unwip` - undo WIP commit
- `git wip-save "msg"` - stash with message
- `git wip-restore` - uncommit + unstage

#### Information
- `git uncached` - untracked files
- `git unstaged` - unstaged changes
- `git staged` - staged changes
- `git ignored` - ignored files
- `git unpushed` - unpushed commits
- `git commits` - top contributors
- `git contrib` - all contributors

### Performance Optimizations
- Maximum compression settings
- Optimized pack configuration
- Smart garbage collection
- Delta caching enabled

### Enhanced Features
- Colorized diff output
- Moved code detection
- Reuse recorded conflict resolutions
- Auto-corrected commands
- Sorted branches/tags by date

## Usage Tips

1. Use `git feat "add login"` for new features
2. Use `git wip` before switching contexts
3. Use `git review` to see your PR changes
4. Use `git sync` before starting work
5. Use `git cleanup` to remove merged branches

## Customization

Edit the commit template at `commit-template.txt` to match your team's conventions.
Modify hooks in `hooks/` directory for custom quality checks.
