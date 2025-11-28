#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  // More aggressive patterns
  const patterns = [
    // Function parameters with any
    [/\(([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:\s*any\s*\)/g, '($1: unknown)'],
    [/\(([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:\s*any\s*,/g, '($1: unknown,'],
    [/,\s*([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:\s*any\s*\)/g, ', $1: unknown)'],
    [/,\s*([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:\s*any\s*,/g, ', $1: unknown,'],
    
    // Variable declarations
    [/:\s*any\s*\[\s*\]/g, ': unknown[]'],
    [/:\s*any\s*=/g, ': unknown ='],
    [/:\s*any\s*;/g, ': unknown;'],
    [/:\s*any\s*\)/g, ': unknown)'],
    [/:\s*any\s*>/g, ': unknown>'],
    [/:\s*any\s*\|/g, ': unknown|'],
    [/:\s*any\s*,/g, ': unknown,'],
    [/:\s*any\s*\}/g, ': unknown}'],
    
    // Generic types
    [/Record<string,\s*any>/g, 'Record<string, unknown>'],
    [/Record<string,any>/g, 'Record<string, unknown>'],
    [/\{\s*\[key:\s*string\]:\s*any\s*\}/g, '{ [key: string]: unknown }'],
    [/Array<any>/g, 'Array<unknown>'],
    
    // As any casts
    [/as\s+any\s*\)/g, 'as unknown)'],
    [/as\s+any\s*;/g, 'as unknown;'],
    [/as\s+any\s*,/g, 'as unknown,'],
    
    // Interface/type properties
    [/([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:\s*any\s*;/g, '$1: unknown;'],
    [/([a-zA-Z_$][a-zA-Z0-9_$]*)\?\s*:\s*any\s*;/g, '$1?: unknown;'],
  ];
  
  patterns.forEach(([pattern, replacement]) => {
    if (pattern.test(content)) {
      content = content.replace(pattern, replacement);
      modified = true;
    }
  });
  
  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✓ Fixed: ${path.relative(process.cwd(), filePath)}`);
    return true;
  }
  return false;
}

function walkDir(dir, fileList = []) {
  try {
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
  } catch (e) {
    // Skip directories that don't exist
  }
  
  return fileList;
}

console.log('🔧 Fixing inline any types...\n');

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
