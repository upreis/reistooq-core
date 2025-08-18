#!/bin/bash

# Router validation script
set -e

echo "🔍 Checking for Router duplication..."

# Check for BrowserRouter usage (should only be in main.tsx)
BROWSER_ROUTER_FILES=$(grep -r "BrowserRouter" src/ --include="*.tsx" --include="*.ts" | grep -v "import.*BrowserRouter" | wc -l)

if [ "$BROWSER_ROUTER_FILES" -gt 1 ]; then
  echo "❌ ERROR: Found multiple BrowserRouter usages. Only main.tsx should render BrowserRouter."
  grep -r "BrowserRouter" src/ --include="*.tsx" --include="*.ts" | grep -v "import.*BrowserRouter"
  exit 1
fi

# Check for Router imports outside main.tsx
ROUTER_IMPORTS=$(grep -r "import.*BrowserRouter" src/ --include="*.tsx" --include="*.ts" | grep -v "src/main.tsx" | wc -l)

if [ "$ROUTER_IMPORTS" -gt 0 ]; then
  echo "⚠️  WARNING: Found BrowserRouter imports outside main.tsx:"
  grep -r "import.*BrowserRouter" src/ --include="*.tsx" --include="*.ts" | grep -v "src/main.tsx"
fi

echo "✅ Router validation completed!"