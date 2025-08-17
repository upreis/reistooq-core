#!/bin/bash

# Guard script to prevent sidebar duplication
set -e

echo "🔍 Checking for sidebar duplication..."

# Check for multiple EnhancedSidebar instances
ENHANCED_SIDEBAR_COUNT=$(grep -r "EnhancedSidebar" src/ --include="*.tsx" --include="*.ts" | grep -v "__tests__" | grep -v "export.*EnhancedSidebar" | grep -v "import.*EnhancedSidebar" | wc -l)

if [ "$ENHANCED_SIDEBAR_COUNT" -gt 1 ]; then
  echo "❌ ERROR: Found $ENHANCED_SIDEBAR_COUNT instances of EnhancedSidebar render. Only one is allowed."
  echo "Instances found:"
  grep -r "EnhancedSidebar" src/ --include="*.tsx" --include="*.ts" | grep -v "__tests__" | grep -v "export.*EnhancedSidebar" | grep -v "import.*EnhancedSidebar"
  exit 1
fi

# Check for legacy sidebar imports
LEGACY_IMPORTS=$(grep -r "from 'src/layouts/full/vertical/sidebar" src/ --include="*.tsx" --include="*.ts" || true)

if [ ! -z "$LEGACY_IMPORTS" ]; then
  echo "❌ ERROR: Found legacy sidebar imports:"
  echo "$LEGACY_IMPORTS"
  exit 1
fi

# Check for legacy Sidebar components
LEGACY_SIDEBAR=$(grep -r "<Sidebar" src/ --include="*.tsx" | grep -v "EnhancedSidebar" | grep -v "__tests__" || true)

if [ ! -z "$LEGACY_SIDEBAR" ]; then
  echo "❌ ERROR: Found legacy Sidebar components:"
  echo "$LEGACY_SIDEBAR"
  exit 1
fi

echo "✅ Sidebar guard checks passed!"