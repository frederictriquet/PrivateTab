# GitHub Actions Setup Checklist

Complete this checklist to ensure the CI/CD pipeline is properly configured.

## Pre-Deployment

### 1. Verify Local Build
Run these commands locally to ensure they work:
```bash
npm ci                      # Clean install dependencies
npm run type-check          # TypeScript type checking passes
npm test                    # All tests pass
npm run build:chrome        # Chrome build succeeds
npm run build:firefox       # Firefox build succeeds
npm run package             # Packaging creates zip files
```

### 2. Verify Package Scripts
Check that these scripts exist in `package.json`:
- ✓ `"type-check"`
- ✓ `"test"`
- ✓ `"build:chrome"`
- ✓ `"build:firefox"`
- ✓ `"build"`
- ✓ `"package"`

### 3. Check Version Consistency
```bash
# Verify versions match
node -p "require('./package.json').version"
grep -oP '"version":\s*"\K[^"]+' src/manifest.json
```

## Initial Deployment

### 4. Commit Workflow Files
```bash
# Add workflow files
git add .github/

# Commit with conventional format
git commit -m "ci: add GitHub Actions workflows for automated releases"

# Push to master
git push origin master
```

### 5. Monitor First Run
- Go to repository Actions tab
- Verify "Build and Release" workflow starts
- Check all jobs complete successfully
- Review logs for any warnings

### 6. Verify First Release
- Go to repository Releases tab
- Confirm new release was created
- Download and verify Chrome zip file
- Download and verify Firefox zip file
- Check checksums.txt was included
- Verify version tag was created

## Post-Deployment

### 7. Test CI on Pull Request
```bash
# Create test branch
git checkout -b test/ci-workflow

# Make a small change
echo "# Test" >> README.md

# Commit and push
git commit -m "test: verify CI workflow"
git push origin test/ci-workflow

# Create PR on GitHub
# Verify CI workflow runs and passes
```

### 8. Test Semantic Versioning
Create commits with different types:
- Patch: `git commit -m "fix: test patch versioning"`
- Minor: `git commit -m "feat: test minor versioning"`
- Verify version increments correctly after merge

## Optional Enhancements

### 9. Branch Protection Rules
Configure in Settings → Branches:
- Require pull request reviews before merging
- Require status checks to pass (CI workflow)
- Require branches to be up to date
- Require conversation resolution

### 10. Add Status Badges
Add to README.md:
```markdown
[![CI](https://github.com/frederictriquet/PrivateTab/workflows/CI/badge.svg)](https://github.com/frederictriquet/PrivateTab/actions/workflows/ci.yml)
[![Release](https://github.com/frederictriquet/PrivateTab/workflows/Build%20and%20Release/badge.svg)](https://github.com/frederictriquet/PrivateTab/actions/workflows/release.yml)
```

## Troubleshooting

### Workflow Not Running
1. Check Actions tab for disabled workflows
2. Verify workflow files in `.github/workflows/`
3. Ensure YAML syntax is valid
4. Check Actions are enabled in Settings

### Build Fails
1. Review error logs in Actions tab
2. Run failed commands locally
3. Verify Node.js version compatibility
4. Check all dependencies in package.json

### Release Not Created
1. Check workflow logs for release step
2. Verify `GITHUB_TOKEN` has write permissions
3. Ensure no existing release with same version
4. Check version was properly incremented

### Artifacts Missing
1. Verify package script creates zip files
2. Check artifact paths match actual file names
3. Review packaging step logs
4. Test packaging locally: `npm run package`

## Success Criteria

✅ Workflow files committed and pushed
✅ CI workflow runs on PRs
✅ Release workflow runs on master pushes
✅ Semantic versioning works
✅ GitHub releases created with artifacts
✅ Version tags created automatically
✅ Team understands commit conventions

## Next Steps

After successful setup:
1. Share commit convention with contributors
2. Update project README with badges
3. Configure Dependabot for dependencies
4. Set up branch protection rules
5. Plan for automated store submissions