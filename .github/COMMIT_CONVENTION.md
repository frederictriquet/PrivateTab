# Commit Message Convention

PrivateTab uses **Conventional Commits** for automated semantic versioning.

## Quick Reference

| Type | Version Bump | When to Use |
|------|--------------|-------------|
| `feat:` | Minor (1.1.0 → 1.2.0) | New feature for users |
| `fix:` | Patch (1.1.0 → 1.1.1) | Bug fix |
| `perf:` | Patch (1.1.0 → 1.1.1) | Performance improvement |
| `refactor:` | Patch (1.1.0 → 1.1.1) | Code refactoring |
| `docs:` | Patch (1.1.0 → 1.1.1) | Documentation only |
| `style:` | Patch (1.1.0 → 1.1.1) | Code style (formatting) |
| `test:` | Patch (1.1.0 → 1.1.1) | Test changes |
| `chore:` | Patch (1.1.0 → 1.1.1) | Maintenance tasks |
| `!` or `BREAKING CHANGE:` | Major (1.1.0 → 2.0.0) | Breaking change |

## Format

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

## Examples

### Feature Addition (Minor Bump)
```
feat: add password strength indicator

- Show visual feedback for password complexity
- Include entropy calculation
- Add tooltips with improvement suggestions
```

### Bug Fix (Patch Bump)
```
fix: resolve tab synchronization race condition

The race condition occurred when multiple tabs were opened
simultaneously. Fixed by implementing a mutex lock.

Closes #42
```

### Breaking Change (Major Bump)
```
feat!: redesign settings storage API

BREAKING CHANGE: Settings are now stored in browser.storage.sync
instead of localStorage. Existing settings will be migrated
automatically on first launch.
```

### With Scope
```
fix(popup): correct positioning on small screens

The popup was overflowing on screens smaller than 1024px.
Adjusted media queries to handle smaller viewports.
```

## Scopes (Optional)

- `popup`: Extension popup UI
- `background`: Background service worker
- `content`: Content scripts
- `options`: Options page
- `storage`: Data storage layer
- `build`: Build system changes
- `ci`: CI/CD pipeline

## Tips

### Do
✅ Use imperative mood: "add" not "added" or "adds"
✅ Be descriptive but concise
✅ Reference issues: `Fixes #123`
✅ Explain the "why", not just the "what"

### Don't
❌ `update stuff`
❌ `fix bug`
❌ `WIP`
❌ `asdf`

## Tools

### Commitizen
Interactive commit message creation:
```bash
npm install -g commitizen cz-conventional-changelog
git cz
```

### Commitlint
Enforce commit message format:
```bash
npm install -D @commitlint/cli @commitlint/config-conventional
```

## Resources

- [Conventional Commits](https://www.conventionalcommits.org/)
- [Semantic Versioning](https://semver.org/)