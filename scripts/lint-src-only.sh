#!/bin/bash

echo "🔍 Linting source code only (excluding tests)..."
echo ""

npx eslint src apps/web/components apps/web/pages \
  --ext .ts,.tsx \
  --ignore-pattern "**/*.test.ts" \
  --ignore-pattern "**/*.test.tsx" \
  --ignore-pattern "**/*.spec.ts" \
  --ignore-pattern "**/__tests__/**" \
  --ignore-pattern "**/__mocks__/**" \
  "$@"

EXIT_CODE=$?

if [ $EXIT_CODE -eq 0 ]; then
  echo ""
  echo "✅ Source code lint passed!"
else
  echo ""
  echo "❌ Found $EXIT_CODE errors in source code"
  echo ""
  echo "Run with --fix to auto-fix:"
  echo "  ./scripts/lint-src-only.sh --fix"
fi

exit $EXIT_CODE
