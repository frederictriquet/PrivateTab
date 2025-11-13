# GitHub Actions CI/CD

This directory contains GitHub Actions workflows for automated testing, building, and releasing PrivateTab.

## Workflows

### 1. CI Workflow (`ci.yml`)
**Trigger**: Pull requests and pushes to non-master branches

**Purpose**: Validates code quality before merging

**Steps**:
1. Type checking with TypeScript
2. Running unit tests
3. Building Chrome extension
4. Building Firefox extension

### 2. Release Workflow (`release.yml`)
**Trigger**: Pushes to master branch (or manual dispatch)

**Purpose**: Fully automated release management with semantic versioning

**Steps**:
1. Quality checks (type-check + tests)
2. Build Chrome and Firefox extensions
3. Package extensions into zip files
4. Run `semantic-release` to:
   - Analyze conventional commits
   - Determine next version
   - Update `package.json` and `src/manifest.json`
   - Generate `CHANGELOG.md`
   - Create git tag
   - Commit version changes
   - Create GitHub release with artifacts

**Key Features**:
- **Uses `codfish/semantic-release-action@v4`** - Official GitHub Action wrapper for semantic-release
- **Automatic package.json updates** - No manual version management needed
- **Automatic manifest.json updates** - Extension metadata kept in sync
- **Changelog generation** - Professional release notes from commits
- **Git tag creation** - Automatic version tagging
- **GitHub release creation** - Assets automatically attached
- **Optimized for CI/CD** - Pre-cached dependencies, faster execution
- **Rich outputs** - Provides version info for subsequent steps

## Semantic Versioning

Releases use **Conventional Commits** to determine version bumps:

| Commit Pattern | Version Bump | Example |
|----------------|--------------|---------|
| `feat:` | Minor (1.1.0 → 1.2.0) | New feature |
| `fix:` | Patch (1.1.0 → 1.1.1) | Bug fix |
| `feat!:` or `BREAKING CHANGE:` | Major (1.1.0 → 2.0.0) | Breaking change |

## Commit Message Format

```
<type>(<scope>): <description>

[optional body]
```

### Types
- `feat`: New feature → **Minor** version bump
- `fix`: Bug fix → **Patch** version bump
- `perf`: Performance improvement → **Patch** version bump
- `refactor`: Code refactoring → **Patch** version bump
- `docs`: Documentation → **Patch** version bump
- `style`: Code style → **Patch** version bump
- `test`: Tests → **Patch** version bump
- `chore`: Maintenance → **Patch** version bump
- `feat!` or `BREAKING CHANGE:` → **Major** version bump

### Examples

**Feature (Minor bump)**:
```
feat: add password strength indicator
```

**Bug fix (Patch bump)**:
```
fix: resolve tab synchronization issue
```

**Breaking change (Major bump)**:
```
feat!: redesign settings API

BREAKING CHANGE: Settings now use browser.storage.sync
```

## Manual Release

To manually trigger a release:

1. Go to **Actions** tab
2. Select **Build and Release** workflow
3. Click **Run workflow**
4. Choose version bump type:
   - `auto` - Analyze commits (default)
   - `major` - Force major bump
   - `minor` - Force minor bump
   - `patch` - Force patch bump

## Release Artifacts

Each release includes:
- `privatetab-chrome-vX.Y.Z.zip` - Chrome extension
- `privatetab-firefox-vX.Y.Z.zip` - Firefox extension
- `checksums.txt` - SHA256 checksums

## Troubleshooting

### Workflow Not Running
- Check branch name is exactly `master`
- Verify workflow files in `.github/workflows/`
- Check Actions are enabled in repository settings

### Build Failures
- Review logs in Actions tab
- Verify tests pass locally: `npm test`
- Ensure builds work: `npm run build`

### Version Not Updated
- Check commit message format
- Review git log: `git log --oneline`
- Use conventional commit prefixes

## Status Badges

Add to README.md:
```markdown
[![CI](https://github.com/frederictriquet/PrivateTab/workflows/CI/badge.svg)](https://github.com/frederictriquet/PrivateTab/actions/workflows/ci.yml)
[![Release](https://github.com/frederictriquet/PrivateTab/workflows/Build%20and%20Release/badge.svg)](https://github.com/frederictriquet/PrivateTab/actions/workflows/release.yml)
![Version](https://img.shields.io/github/v/release/frederictriquet/PrivateTab)
```