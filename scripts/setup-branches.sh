#!/bin/bash

# Create feature branches for Sprint 0
branches=(
  "feat/lite-home"
  "feat/plan-gate" 
  "feat/hub2-signals-merge"
  "feat/portfolio-blocks"
  "feat/predictions"
  "feat/scanner"
)

echo "🚀 Setting up AlphaWhale feature branches..."

for branch in "${branches[@]}"; do
  echo "Creating branch: $branch"
  git checkout -b "$branch" 2>/dev/null || git checkout "$branch"
  git push -u origin "$branch" 2>/dev/null || echo "Branch $branch already exists on remote"
done

git checkout main
echo "✅ All branches created and pushed"