#!/bin/bash
set -e

echo "🔍 Validating GitHub Actions workflows..."
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if workflow files exist
echo "1. Checking workflow files..."
if [ -f ".github/workflows/ci.yml" ]; then
    echo -e "${GREEN}✓${NC} ci.yml exists"
else
    echo -e "${RED}✗${NC} ci.yml not found"
    exit 1
fi

if [ -f ".github/workflows/release.yml" ]; then
    echo -e "${GREEN}✓${NC} release.yml exists"
else
    echo -e "${RED}✗${NC} release.yml not found"
    exit 1
fi

echo ""

# Check if required package.json scripts exist
echo "2. Checking package.json scripts..."
REQUIRED_SCRIPTS=("type-check" "test" "build:chrome" "build:firefox" "build" "package")

for script in "${REQUIRED_SCRIPTS[@]}"; do
    if grep -q "\"$script\":" package.json; then
        echo -e "${GREEN}✓${NC} Script '$script' found"
    else
        echo -e "${YELLOW}⚠${NC} Script '$script' not found in package.json"
    fi
done

echo ""

# Validate YAML syntax (if python3 is available)
echo "3. Validating YAML syntax..."
if command -v python3 &> /dev/null; then
    for file in .github/workflows/*.yml; do
        if python3 -c "import yaml; yaml.safe_load(open('$file'))" 2>/dev/null; then
            echo -e "${GREEN}✓${NC} $(basename $file) syntax is valid"
        else
            echo -e "${RED}✗${NC} $(basename $file) has syntax errors"
            exit 1
        fi
    done
else
    echo -e "${YELLOW}⚠${NC} Python not found, skipping YAML validation"
fi

echo ""

# Check version consistency
echo "4. Checking version consistency..."
PACKAGE_VERSION=$(node -p "require('./package.json').version" 2>/dev/null || echo "")
MANIFEST_VERSION=$(grep -oP '"version":\s*"\K[^"]+' src/manifest.json 2>/dev/null || echo "")

if [ -n "$PACKAGE_VERSION" ] && [ -n "$MANIFEST_VERSION" ]; then
    if [ "$PACKAGE_VERSION" = "$MANIFEST_VERSION" ]; then
        echo -e "${GREEN}✓${NC} Version consistent: $PACKAGE_VERSION"
    else
        echo -e "${YELLOW}⚠${NC} Version mismatch:"
        echo "  package.json: $PACKAGE_VERSION"
        echo "  manifest.json: $MANIFEST_VERSION"
    fi
else
    echo -e "${YELLOW}⚠${NC} Could not verify version consistency"
fi

echo ""

# Test local build
echo "5. Testing local build (optional)..."
echo -e "${YELLOW}→${NC} To test the full build process, run:"
echo "  npm ci"
echo "  npm run type-check"
echo "  npm test"
echo "  npm run build"
echo "  npm run package"

echo ""
echo -e "${GREEN}✓${NC} Workflow validation complete!"
echo ""
echo "Next steps:"
echo "1. Review the workflows in .github/workflows/"
echo "2. Read .github/SETUP_CHECKLIST.md for deployment"
echo "3. Commit and push to trigger the first workflow run"