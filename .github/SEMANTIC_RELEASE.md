# Semantic Release Integration

This project uses **semantic-release** for fully automated version management and package publishing.

## What is Semantic Release?

[semantic-release](https://github.com/semantic-release/semantic-release) automates the whole package release workflow including:
- Determining the next version number
- Generating release notes
- Publishing the package

## How It Works

### 1. Commit Analysis
Semantic-release analyzes your commit messages to determine the type of changes:

```
feat: new feature         → Minor release (1.1.0 → 1.2.0)
fix: bug fix             → Patch release (1.1.0 → 1.1.1)
feat!: breaking change   → Major release (1.0.0 → 2.0.0)
```

### 2. Automatic Version Updates
When you push to the `master` branch:
1. ✅ Analyzes commits since last release
2. ✅ Determines semantic version bump
3. ✅ Updates `package.json`
4. ✅ Updates `src/manifest.json`
5. ✅ Generates `CHANGELOG.md`
6. ✅ Creates git commit with version changes
7. ✅ Creates git tag (e.g., `v1.2.0`)
8. ✅ Pushes commit and tag to repository
9. ✅ Creates GitHub release with artifacts

## Configuration

Semantic-release is configured via `.releaserc.json`:

```json
{
  "branches": ["master"],
  "plugins": [
    "@semantic-release/commit-analyzer",      // Analyze commits
    "@semantic-release/release-notes-generator", // Generate changelog
    "@semantic-release/changelog",            // Update CHANGELOG.md
    "@semantic-release/npm",                  // Update package.json
    "@semantic-release/exec",                 // Update manifest.json
    "@semantic-release/git",                  // Commit changes
    "@semantic-release/github"                // Create GitHub release
  ]
}
```

### Plugin Details

#### @semantic-release/commit-analyzer
Analyzes commits to determine version bump:
- `feat:` → **minor** version bump
- `fix:`, `perf:`, `refactor:`, etc. → **patch** version bump
- `BREAKING CHANGE:` or `!` → **major** version bump

#### @semantic-release/release-notes-generator
Generates release notes from commits:
- Groups commits by type (Features, Bug Fixes, etc.)
- Formats as markdown
- Includes commit hashes and links

#### @semantic-release/changelog
Updates `CHANGELOG.md` with release notes:
- Maintains chronological history
- Professional formatting
- Links to commits and PRs

#### @semantic-release/npm
Updates `package.json` version:
- Bumps version field
- Updates `package-lock.json`
- Does NOT publish to npm (configured with `npmPublish: false`)

#### @semantic-release/exec
Executes custom commands:
- Updates `src/manifest.json` version
- Uses `sed` to replace version string

#### @semantic-release/git
Commits version changes:
- Commits updated files
- Uses conventional commit format
- Includes `[skip ci]` to prevent loop

#### @semantic-release/github
Creates GitHub release:
- Creates release with version tag
- Uploads build artifacts (zip files)
- Includes generated release notes

## Workflow Integration

The GitHub Actions workflow integrates semantic-release:

```yaml
- name: Install semantic-release dependencies
  run: |
    npm install --save-dev \
      semantic-release \
      @semantic-release/changelog \
      @semantic-release/git \
      @semantic-release/github \
      @semantic-release/exec \
      conventional-changelog-conventionalcommits

- name: Run semantic-release
  env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
  run: npx semantic-release
```

## Commit Message Convention

Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

### Format
```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

### Types

| Type | Description | Version Bump |
|------|-------------|--------------|
| `feat` | New feature | Minor |
| `fix` | Bug fix | Patch |
| `perf` | Performance improvement | Patch |
| `refactor` | Code refactoring | Patch |
| `docs` | Documentation only | Patch |
| `style` | Code style (formatting) | Patch |
| `test` | Adding tests | Patch |
| `chore` | Maintenance tasks | Patch |
| `feat!` or `BREAKING CHANGE:` | Breaking change | Major |

### Examples

#### Feature (Minor Release)
```bash
git commit -m "feat: add dark mode toggle

Adds a new setting to enable dark mode across the extension.
Users can toggle between light and dark themes."
```

#### Bug Fix (Patch Release)
```bash
git commit -m "fix: resolve memory leak in background script

Fixed issue where event listeners were not being properly cleaned up,
causing memory to accumulate over time.

Closes #123"
```

#### Breaking Change (Major Release)
```bash
git commit -m "feat!: redesign storage API

BREAKING CHANGE: Storage API now uses browser.storage.sync instead
of localStorage. Existing settings will be automatically migrated
on first run after update."
```

## Release Process

### Automatic Releases

1. **Develop and commit**:
   ```bash
   git add .
   git commit -m "feat: add new feature"
   ```

2. **Push to master**:
   ```bash
   git push origin master
   ```

3. **Workflow runs automatically**:
   - Runs tests and type-check
   - Builds extensions
   - Runs semantic-release
   - Creates release

4. **Check GitHub releases**:
   - Go to: https://github.com/frederictriquet/PrivateTab/releases
   - New release created with version number
   - Artifacts attached (Chrome + Firefox zips)
   - Changelog included

### Manual Trigger

If needed, you can manually trigger a release:

1. Go to **Actions** tab
2. Select **Build and Release** workflow
3. Click **Run workflow**
4. Choose **master** branch
5. Click **Run workflow** button

## What Gets Updated

When semantic-release runs, these files are automatically updated:

### package.json
```json
{
  "version": "1.2.0"  // ← Updated automatically
}
```

### src/manifest.json
```json
{
  "version": "1.2.0"  // ← Updated automatically via @semantic-release/exec
}
```

### CHANGELOG.md
```markdown
# [1.2.0](https://github.com/.../compare/v1.1.0...v1.2.0) (2025-01-13)

### Features
* add dark mode toggle ([abc1234](https://github.com/.../commit/abc1234))
* add password strength indicator ([def5678](https://github.com/.../commit/def5678))

### Bug Fixes
* resolve memory leak ([ghi9012](https://github.com/.../commit/ghi9012))
```

## Benefits

### 🚀 Automation
- No manual version management
- No manual changelog updates
- No manual git tagging
- No manual release creation

### ✅ Consistency
- Follows semantic versioning strictly
- Standardized commit messages
- Professional release notes
- Predictable release process

### 📚 Documentation
- Automatic changelog generation
- Detailed release notes
- Commit history preserved
- Easy to track changes

### 🔒 Reliability
- Industry-standard tool
- Used by thousands of projects
- Well-tested and maintained
- Prevents versioning mistakes

## Troubleshooting

### No Release Created

**Problem**: Workflow runs but no release is created

**Solutions**:
1. **Check commit messages**: Ensure at least one commit since last release follows conventional format
2. **Verify branch**: Must be pushing to `master` branch
3. **Check logs**: Review semantic-release output in workflow logs
4. **Skip CI**: If commits have `[skip ci]`, they're ignored

### Version Not Bumped

**Problem**: Release created but version didn't change as expected

**Solutions**:
1. **Review commit types**:
   - `feat:` = minor bump
   - `fix:` = patch bump
   - `feat!:` or `BREAKING CHANGE:` = major bump
2. **Check for multiple commits**: Highest bump type wins
3. **Verify commit format**: Must match conventional commits exactly

### Manifest.json Not Updated

**Problem**: package.json updated but manifest.json not

**Solutions**:
1. **Check .releaserc.json**: Verify `@semantic-release/exec` plugin configured
2. **Verify sed command**: Check command syntax in config
3. **File path**: Ensure `src/manifest.json` exists and is correct path

### Build Artifacts Missing

**Problem**: Release created but zip files not attached

**Solutions**:
1. **Check build step**: Ensure extensions built successfully before semantic-release
2. **Verify artifact names**: Must match pattern in .releaserc.json (`privatetab-*.zip`)
3. **Timing**: Artifacts must exist before semantic-release runs

## Best Practices

### 1. Write Clear Commit Messages
```bash
# Good
git commit -m "feat(popup): add search functionality"

# Bad
git commit -m "update code"
```

### 2. Group Related Changes
```bash
# Combine related changes in one commit
git add feature1.ts feature2.ts
git commit -m "feat: implement user authentication

- Add login form
- Implement JWT token handling
- Add session management"
```

### 3. Use Proper Scope
```bash
feat(popup): add dark mode     # Changes in popup UI
fix(background): resolve leak  # Changes in background script
docs(readme): update install   # Documentation changes
```

### 4. Reference Issues
```bash
git commit -m "fix: resolve tab sync issue

Fixed race condition when multiple tabs opened simultaneously.

Closes #123"
```

### 5. Breaking Changes
```bash
git commit -m "feat!: redesign API

BREAKING CHANGE: All API methods now return Promises instead of callbacks.
Update existing code to use async/await or .then()."
```

## Migration from Previous Setup

The semantic-release integration replaces:
- ❌ ~~Manual version determination script~~
- ❌ ~~Manual package.json updates~~
- ❌ ~~Manual manifest.json updates~~
- ❌ ~~Manual git tagging~~
- ❌ ~~Manual changelog writing~~

With:
- ✅ Fully automated semantic versioning
- ✅ Automatic file updates
- ✅ Automatic changelog generation
- ✅ Automatic git operations
- ✅ Professional release management

## Resources

- **semantic-release**: https://github.com/semantic-release/semantic-release
- **Conventional Commits**: https://www.conventionalcommits.org/
- **Semantic Versioning**: https://semver.org/
- **Commit Conventions**: [.github/COMMIT_CONVENTION.md](./COMMIT_CONVENTION.md)

## Support

For issues with semantic-release:
1. Check workflow logs in Actions tab
2. Review this documentation
3. Consult [semantic-release docs](https://semantic-release.gitbook.io/)
4. Open issue with workflow run URL

---

**Last Updated**: 2025-01-13
**Configuration**: `.releaserc.json`
**Workflow**: `.github/workflows/release.yml`