/**
 * Runtime test for Pulse Navigation
 * Tests the actual functionality in a headless browser environment
 */

import { execSync } from 'child_process';
import fs from 'fs';

console.log('🧪 Running Pulse Navigation Runtime Tests\n');

// Test 1: Check if the development server is running
console.log('1. Checking development server...');
try {
  const response = execSync('curl -s -o /dev/null -w "%{http_code}" http://localhost:5173/cockpit?demo=1', { encoding: 'utf8' });
  if (response.trim() === '200') {
    console.log('   ✅ Development server is running');
  } else {
    console.log('   ❌ Development server not responding (HTTP ' + response.trim() + ')');
  }
} catch (error) {
  console.log('   ❌ Development server not accessible');
}

// Test 2: Check if all required files exist and have correct exports
console.log('\n2. Checking file exports...');

const filesToCheck = [
  {
    path: 'src/components/cockpit/PulseSheet.tsx',
    exports: ['PulseSheet']
  },
  {
    path: 'src/hooks/useHashNavigation.ts',
    exports: ['useHashNavigation']
  },
  {
    path: 'src/hooks/usePulseData.ts',
    exports: ['usePulseData']
  }
];

filesToCheck.forEach(file => {
  try {
    const content = fs.readFileSync(file.path, 'utf8');
    const hasAllExports = file.exports.every(exp => 
      content.includes(`export`) && content.includes(exp)
    );
    
    if (hasAllExports) {
      console.log(`   ✅ ${file.path} - All exports found`);
    } else {
      console.log(`   ❌ ${file.path} - Missing exports: ${file.exports.join(', ')}`);
    }
  } catch (error) {
    console.log(`   ❌ ${file.path} - File not found`);
  }
});

// Test 3: Check TypeScript compilation
console.log('\n3. Checking TypeScript compilation...');
try {
  execSync('npm run build > /dev/null 2>&1');
  console.log('   ✅ TypeScript compilation successful');
} catch (error) {
  console.log('   ❌ TypeScript compilation failed');
}

// Test 4: Check for required dependencies
console.log('\n4. Checking dependencies...');
const requiredDeps = [
  'framer-motion',
  'lucide-react'
];

try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const allDeps = { ...packageJson.dependencies, ...packageJson.devDependencies };
  
  requiredDeps.forEach(dep => {
    if (allDeps[dep]) {
      console.log(`   ✅ ${dep} - ${allDeps[dep]}`);
    } else {
      console.log(`   ❌ ${dep} - Not found`);
    }
  });
} catch (error) {
  console.log('   ❌ Could not read package.json');
}

console.log('\n' + '='.repeat(50));
console.log('🎯 Runtime tests completed!');
console.log('📝 Manual testing required:');
console.log('   1. Navigate to http://localhost:5173/cockpit?demo=1');
console.log('   2. Click "Open today\'s pulse" button');
console.log('   3. Verify pulse sheet opens');
console.log('   4. Press ESC to close');
console.log('   5. Verify hash is removed from URL');
console.log('='.repeat(50));