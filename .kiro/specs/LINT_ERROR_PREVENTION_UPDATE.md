# Lint Error Prevention - Task List Updates

## Summary

Updated both Hunter Screen Feed and HarvestPro task lists to include comprehensive lint checking and type-checking tasks to ensure no lint errors occur during development and deployment.

## Changes Made

### Hunter Screen Feed (`hunter-screen-feed/tasks.md`)

1. **Added Task 3a: Establish lint and type-check standards**
   - Configure ESLint with strict rules
   - Enable TypeScript strict mode
   - Set up pre-commit hooks (optional)
   - Configure CI/CD to fail on lint errors
   - Document linting standards
   - Fix existing lint and type errors
   - Ensure no `any` types
   - Verify explicit return types
   - Test build succeeds without warnings

2. **Updated Task 34b: Run lint checks and fix errors**
   - Added before monitoring setup
   - Includes ESLint checks
   - Includes TypeScript type checks
   - Ensures strict mode compliance
   - Verifies build succeeds

3. **Updated Task 39: Deployment preparation**
   - Added `npm run lint` check
   - Added `npm run type-check` check
   - Ensures no errors before deployment

### HarvestPro (`harvestpro/tasks.md`)

1. **Added Task 1.4: Establish lint and type-check standards**
   - Configure ESLint with strict rules for HarvestPro
   - Enable TypeScript strict mode
   - Set up pre-commit hooks (optional)
   - Configure CI/CD to fail on lint errors
   - Document linting standards
   - Fix existing lint and type errors
   - Ensure no `any` types
   - Verify explicit return types
   - Test build succeeds without warnings
   - **Marked as blocking task** - establishes code quality baseline

2. **Updated Task 28: Checkpoint - Ensure all tests pass and no lint errors**
   - Added lint checking steps
   - Added type-check steps
   - Ensures strict mode compliance
   - Verifies all imports are valid

3. **Updated Task 34: Final checkpoint - Ensure all tests pass and no lint errors**
   - Added comprehensive lint checking
   - Added TypeScript type checking
   - Ensures code quality before final deployment

4. **Updated Task 35: Documentation and deployment preparation**
   - Added `npm run lint` check
   - Added `npm run type-check` check
   - Added `npm run build` verification

5. **Updated Task 42: Checkpoint - Ensure all v2 tests pass and no lint errors**
   - Added lint and type-check for v2 features

6. **Updated Task 48: Checkpoint - Ensure all v3 tests pass and no lint errors**
   - Added lint and type-check for v3 features

## Lint Checking Commands

Both specs now include these standard commands at checkpoints:

```bash
# Check for ESLint errors
npm run lint

# Auto-fix fixable ESLint issues
npm run lint:fix

# Check for TypeScript type errors
npm run type-check
# or
tsc --noEmit

# Verify build succeeds
npm run build
```

## Code Quality Standards

Both specs now enforce:

1. **No `any` types** - Use `unknown` with type guards instead
2. **Explicit return types** - All functions must have return types
3. **TypeScript strict mode** - Enabled for all feature code
4. **Valid imports** - All imports must be used and valid
5. **ESLint compliance** - No errors or warnings allowed
6. **Build success** - Must build without errors or warnings

## Integration Points

### Pre-commit Hooks (Optional)
Both specs mention setting up pre-commit hooks to run lint checks automatically before commits.

### CI/CD Integration
Both specs require configuring CI/CD pipelines to fail on lint errors, preventing broken code from being merged.

### Documentation
- Hunter: Linting standards should be documented in README or docs
- HarvestPro: Linting standards should be documented in `.kiro/specs/harvestpro/LINTING_STANDARDS.md`

## Benefits

1. **Early Detection** - Lint errors caught during development, not deployment
2. **Consistent Quality** - All code follows same standards
3. **Type Safety** - TypeScript strict mode prevents type-related bugs
4. **Clean Builds** - No warnings or errors in production builds
5. **Better DX** - Developers get immediate feedback on code quality
6. **Reduced Bugs** - Many common errors caught by linters
7. **Easier Reviews** - Code reviews focus on logic, not style

## Next Steps

1. **Run initial lint check** on both features:
   ```bash
   npm run lint
   npm run type-check
   ```

2. **Fix existing errors** before proceeding with new development

3. **Set up pre-commit hooks** (optional but recommended):
   ```bash
   npm install --save-dev husky lint-staged
   npx husky install
   ```

4. **Configure CI/CD** to run lint checks on every PR

5. **Document standards** in respective locations

## Task Priorities

### Hunter Screen Feed
- **Task 3a** - Should be completed early (after Task 3)
- **Task 34b** - Before monitoring setup
- **Task 39** - Before deployment

### HarvestPro
- **Task 1.4** - Critical blocking task, complete after Task 1
- **Task 28** - Mid-development checkpoint
- **Task 34** - Final checkpoint before deployment
- **Task 35** - Deployment preparation
- **Tasks 42, 48** - v2/v3 checkpoints

## Conclusion

These updates ensure that both Hunter Screen Feed and HarvestPro maintain high code quality standards throughout development, with lint errors caught and fixed at multiple checkpoints before reaching production.
