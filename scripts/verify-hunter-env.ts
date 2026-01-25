/**
 * Hunter Environment Verification Script
 * 
 * Verifies all Hunter Demand-Side environment variables are configured correctly
 * Run with: tsx scripts/verify-hunter-env.ts
 */

import 'dotenv/config';
import { validateHunterEnv } from '../src/lib/hunter/env-validation';

console.log('🔍 Verifying Hunter Demand-Side Environment Configuration...\n');

try {
  const result = validateHunterEnv();

  console.log('========================================');
  console.log('Hunter Demand-Side Environment Validation');
  console.log('========================================\n');

  console.log(`Phase: ${result.phase}`);
  console.log(`Valid: ${result.isValid ? '✅' : '❌'}\n`);

  console.log('Capabilities:');
  Object.entries(result.capabilities).forEach(([key, value]) => {
    console.log(`  ${value ? '✅' : '❌'} ${key}`);
  });
  console.log('');

  if (result.errors.length > 0) {
    console.error('❌ Errors:');
    result.errors.forEach((error) => console.error(`  - ${error}`));
    console.log('');
  }

  if (result.warnings.length > 0) {
    console.warn('⚠️  Warnings:');
    result.warnings.forEach((warning) => console.warn(`  - ${warning}`));
    console.log('');
  }

  if (result.info.length > 0) {
    console.info('ℹ️  Info:');
    result.info.forEach((info) => console.info(`  - ${info}`));
    console.log('');
  }

  console.log('========================================\n');

  if (result.isValid) {
    console.log('✅ Environment validation passed!');
    console.log('\nNext steps:');
    console.log('1. Run seed scripts: npm run seed:all');
    console.log('2. Start dev server: npm run dev');
    console.log('3. Navigate to /hunter to see opportunities\n');
    process.exit(0);
  } else {
    console.error('❌ Environment validation failed!');
    console.error('Please fix the errors above and try again.\n');
    process.exit(1);
  }
} catch (error) {
  console.error('❌ Failed to validate environment:', error);
  process.exit(1);
}
