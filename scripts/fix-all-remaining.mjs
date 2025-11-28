#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const fixes = [
  // Fix any types
  { pattern: /\(([^:]+): any\)/g, replacement: '($1: unknown)' },
  { pattern: /\(([^:]+): any,/g, replacement: '($1: unknown,' },
  { pattern: /: any\[\]/g, replacement: ': unknown[]' },
  { pattern: /: any =/g, replacement: ': unknown =' },
  { pattern: /: any;/g, replacement: ': unknown;' },
  { pattern: /: any\)/g, replacement: ': unknown)' },
  { pattern: /: any>/g, replacement: ': unknown>' },
  { pattern: /: any\|/g, replacement: ': unknown|' },
  { pattern: /Record<string, any>/g, replacement: 'Record<string, unknown>' },
  { pattern: /\{ \[key: string\]: any \}/g, replacement: '{ [key: string]: unknown }' },
  
  // Fix case declarations - wrap in blocks
  { 
    pattern: /(case\s+['"][^'"]+['"]:\s*\n\s*)(const|let|function|class)/gm, 
    replacement: '$1{\n    $2' 
  },
];

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  fixes.forEach(({ pattern, replacement }) => {
    if (pattern.test(content)) {
      content = content.replace(pattern, replacement);
      modified = true;
    }
  });
  
  // Fix case declarations more carefully
  const casePattern = /case\s+(['"][^'"]+['"]|[^:]+):\s*\n\s*(const|let|function|class)\s+/g;
  if (casePattern.test(content)) {
    content = content.replace(casePattern, (match, caseValue, keyword) => {
      return `case ${caseValue}: {\n    ${keyword} `;
    });
    
    // Add closing braces before next case or default
    content = content.replace(/(case\s+[^:]+:\s*\{[^}]+)(case\s+|default:)/g, '$1\n    break;\n  }\n  $2');
    modified = true;
  }
  
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
      if (!['node_modules', 'dist', 'build', '.next', 'out', '__tests__', 'cypress'].includes(file)) {
        walkDir(filePath, fileList);
      }
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      if (!file.includes('.test.') && !file.includes('.spec.') && !file.includes('.cy.')) {
        fileList.push(filePath);
      }
    }
  });
  
  return fileList;
}

console.log('🔧 Fixing all remaining lint errors...\n');

const srcDir = path.join(__dirname, '..', 'src');
const appsDir = path.join(__dirname, '..', 'apps');

const files = [...walkDir(srcDir), ...walkDir(appsDir)];

let fixedCount = 0;
files.forEach(file => {
  if (fixFile(file)) {
    fixedCount++;
  }
});

console.log(`\n✅ Fixed ${fixedCount} files`);
console.log('\n📝 Run "npm run lint" to check remaining issues.');
