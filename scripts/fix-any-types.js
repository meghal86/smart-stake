#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Patterns to replace 'any' with proper types
const replacements = [
  // Function parameters
  { pattern: /\(([^:]+): any\)/g, replacement: '($1: unknown)' },
  { pattern: /\(([^:]+): any,/g, replacement: '($1: unknown,' },
  
  // Variable declarations
  { pattern: /: any\[\]/g, replacement: ': unknown[]' },
  { pattern: /: any =/g, replacement: ': unknown =' },
  { pattern: /: any;/g, replacement: ': unknown;' },
  { pattern: /: any\)/g, replacement: ': unknown)' },
  { pattern: /: any>/g, replacement: ': unknown>' },
  { pattern: /: any\|/g, replacement: ': unknown|' },
  
  // Record types
  { pattern: /Record<string, any>/g, replacement: 'Record<string, unknown>' },
  { pattern: /\{ \[key: string\]: any \}/g, replacement: '{ [key: string]: unknown }' },
];

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  replacements.forEach(({ pattern, replacement }) => {
    if (pattern.test(content)) {
      content = content.replace(pattern, replacement);
      modified = true;
    }
  });
  
  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✓ Fixed: ${filePath}`);
    return true;
  }
  return false;
}

function walkDir(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      // Skip node_modules, dist, build directories
      if (!['node_modules', 'dist', 'build', '.next', 'out'].includes(file)) {
        walkDir(filePath, fileList);
      }
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      // Skip test files for now
      if (!file.includes('.test.') && !file.includes('.spec.')) {
        fileList.push(filePath);
      }
    }
  });
  
  return fileList;
}

console.log('🔧 Fixing any types in source files...\n');

const srcDir = path.join(__dirname, '..', 'src');
const files = walkDir(srcDir);

let fixedCount = 0;
files.forEach(file => {
  if (fixFile(file)) {
    fixedCount++;
  }
});

console.log(`\n✅ Fixed ${fixedCount} files`);
console.log('\n📝 Running prettier to format...');

try {
  execSync('npm run format', { stdio: 'inherit' });
} catch (e) {
  console.log('⚠️  Prettier not available, skipping format');
}

console.log('\n✅ Done! Run "npm run lint" to check remaining issues.');
