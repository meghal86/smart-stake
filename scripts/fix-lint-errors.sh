#!/bin/bash

# Fix ESLint errors automatically
echo "🔧 Running ESLint auto-fix..."
npm run lint -- --fix

# Fix specific patterns that ESLint can't auto-fix
echo "🔧 Fixing remaining patterns..."

# Fix prefer-const errors
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' 's/let \([a-zA-Z_][a-zA-Z0-9_]*\): \(string\[\]\) = \[\]/const \1: \2 = []/g' {} +

echo "✅ Auto-fix complete. Please review changes and run 'npm run lint' to check remaining issues."
