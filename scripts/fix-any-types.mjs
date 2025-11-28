#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const replacements = [
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
      if (!['node_modules', 'dist', 'build', '.next', 'out'].includes(file)) {
        walkDir(filePath, fileList);
      }
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
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
