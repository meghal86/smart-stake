/**
 * Copy Safety Lint Tests for HarvestPro
 * 
 * MANDATORY: Blocks forbidden phrases that could trigger App Store rejection
 * Requirements: Enhanced Req 27 AC1-5
 * Design: Apple-Safe UI Copy → Forbidden Phrases
 */

import { describe, test, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

// Forbidden phrases that could trigger App Store rejection
const FORBIDDEN_PHRASES = {
  'Execute': 'Prepare',
  'Guaranteed': 'Estimated', 
  'IRS-ready': '8949-compatible',
  'Tax advice': 'Tax information',
  'Financial advice': 'Financial information',
  'Legal advice': 'Legal information',
  'Guaranteed returns': 'Estimated returns',
  'Risk-free': 'Lower-risk',
  'Certain profit': 'Potential benefit',
  'Always profitable': 'Potentially profitable'
} as const;

// Additional context-sensitive forbidden patterns
const FORBIDDEN_PATTERNS = [
  /\bguaranteed?\b/gi,
  /\birs[- ]ready\b/gi,
  /\bcertain(ly)?\s+(profit|return|gain)/gi,
  /\brisk[- ]free\b/gi,
  /\balways\s+(profitable|works|succeeds)/gi,
  /\bnever\s+(fails|loses)/gi
] as const;

/**
 * Recursively get all TypeScript/TSX files in a directory
 */
function getAllTsxFiles(dir: string): string[] {
  const files: string[] = [];
  
  try {
    const items = readdirSync(dir);
    
    for (const item of items) {
      const fullPath = join(dir, item);
      const stat = statSync(fullPath);
      
      if (stat.isDirectory()) {
        // Skip node_modules, .git, etc.
        if (!item.startsWith('.') && item !== 'node_modules') {
          files.push(...getAllTsxFiles(fullPath));
        }
      } else if (item.endsWith('.tsx') || item.endsWith('.ts')) {
        files.push(fullPath);
      }
    }
  } catch (error) {
    // Directory might not exist, skip silently
  }
  
  return files;
}

/**
 * Check if a file contains forbidden phrases
 */
function checkFileForForbiddenPhrases(filePath: string): {
  violations: Array<{
    phrase: string;
    line: number;
    content: string;
    suggestion: string;
  }>;
} {
  const violations: Array<{
    phrase: string;
    line: number;
    content: string;
    suggestion: string;
  }> = [];
  
  try {
    const content = readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    
    lines.forEach((line, index) => {
      // Check exact phrase matches
      Object.entries(FORBIDDEN_PHRASES).forEach(([forbidden, replacement]) => {
        if (line.toLowerCase().includes(forbidden.toLowerCase())) {
          violations.push({
            phrase: forbidden,
            line: index + 1,
            content: line.trim(),
            suggestion: `Replace "${forbidden}" with "${replacement}"`
          });
        }
      });
      
      // Check pattern matches
      FORBIDDEN_PATTERNS.forEach((pattern) => {
        const matches = line.match(pattern);
        if (matches) {
          matches.forEach((match) => {
            violations.push({
              phrase: match,
              line: index + 1,
              content: line.trim(),
              suggestion: `Review and replace "${match}" with safer alternative`
            });
          });
        }
      });
    });
  } catch (error) {
    // File might not be readable, skip
  }
  
  return { violations };
}

describe('HarvestPro Copy Safety Lint', () => {
  test('should not contain forbidden phrases in HarvestPro components', () => {
    const harvestProDir = join(process.cwd(), 'src/components/harvestpro');
    const files = getAllTsxFiles(harvestProDir);
    
    const allViolations: Array<{
      file: string;
      violations: Array<{
        phrase: string;
        line: number;
        content: string;
        suggestion: string;
      }>;
    }> = [];
    
    files.forEach((file) => {
      const { violations } = checkFileForForbiddenPhrases(file);
      if (violations.length > 0) {
        allViolations.push({
          file: file.replace(process.cwd(), ''),
          violations
        });
      }
    });
    
    if (allViolations.length > 0) {
      const errorMessage = allViolations
        .map(({ file, violations }) => {
          const violationDetails = violations
            .map(({ phrase, line, content, suggestion }) => 
              `  Line ${line}: "${phrase}" in "${content}"\n    → ${suggestion}`
            )
            .join('\n');
          
          return `${file}:\n${violationDetails}`;
        })
        .join('\n\n');
      
      throw new Error(
        `Found forbidden phrases in HarvestPro components:\n\n${errorMessage}\n\n` +
        'These phrases could trigger App Store rejection. Please replace them with safer alternatives.'
      );
    }
    
    expect(allViolations).toHaveLength(0);
  });
  
  test('should not contain forbidden phrases in HarvestPro pages', () => {
    const pagesDir = join(process.cwd(), 'src/pages');
    const files = getAllTsxFiles(pagesDir).filter(file => 
      file.toLowerCase().includes('harvest')
    );
    
    const allViolations: Array<{
      file: string;
      violations: Array<{
        phrase: string;
        line: number;
        content: string;
        suggestion: string;
      }>;
    }> = [];
    
    files.forEach((file) => {
      const { violations } = checkFileForForbiddenPhrases(file);
      if (violations.length > 0) {
        allViolations.push({
          file: file.replace(process.cwd(), ''),
          violations
        });
      }
    });
    
    if (allViolations.length > 0) {
      const errorMessage = allViolations
        .map(({ file, violations }) => {
          const violationDetails = violations
            .map(({ phrase, line, content, suggestion }) => 
              `  Line ${line}: "${phrase}" in "${content}"\n    → ${suggestion}`
            )
            .join('\n');
          
          return `${file}:\n${violationDetails}`;
        })
        .join('\n\n');
      
      throw new Error(
        `Found forbidden phrases in HarvestPro pages:\n\n${errorMessage}\n\n` +
        'These phrases could trigger App Store rejection. Please replace them with safer alternatives.'
      );
    }
    
    expect(allViolations).toHaveLength(0);
  });
  
  test('should not contain forbidden phrases in HarvestPro lib functions', () => {
    const libDir = join(process.cwd(), 'src/lib/harvestpro');
    const files = getAllTsxFiles(libDir);
    
    const allViolations: Array<{
      file: string;
      violations: Array<{
        phrase: string;
        line: number;
        content: string;
        suggestion: string;
      }>;
    }> = [];
    
    files.forEach((file) => {
      const { violations } = checkFileForForbiddenPhrases(file);
      if (violations.length > 0) {
        allViolations.push({
          file: file.replace(process.cwd(), ''),
          violations
        });
      }
    });
    
    if (allViolations.length > 0) {
      const errorMessage = allViolations
        .map(({ file, violations }) => {
          const violationDetails = violations
            .map(({ phrase, line, content, suggestion }) => 
              `  Line ${line}: "${phrase}" in "${content}"\n    → ${suggestion}`
            )
            .join('\n');
          
          return `${file}:\n${violationDetails}`;
        })
        .join('\n\n');
      
      throw new Error(
        `Found forbidden phrases in HarvestPro lib functions:\n\n${errorMessage}\n\n` +
        'These phrases could trigger App Store rejection. Please replace them with safer alternatives.'
      );
    }
    
    expect(allViolations).toHaveLength(0);
  });
  
  test('should validate forbidden phrases detection', () => {
    // Test that our detection works correctly
    const testContent = `
      Execute this transaction
      This is guaranteed to work
      IRS-ready export file
      Always profitable strategy
      Risk-free investment
      Certain profit guaranteed
    `;
    
    const testFile = '/tmp/test-forbidden.tsx';
    
    // Mock the file content check
    const lines = testContent.split('\n');
    const violations: Array<{
      phrase: string;
      line: number;
      content: string;
      suggestion: string;
    }> = [];
    
    lines.forEach((line, index) => {
      Object.entries(FORBIDDEN_PHRASES).forEach(([forbidden, replacement]) => {
        if (line.toLowerCase().includes(forbidden.toLowerCase())) {
          violations.push({
            phrase: forbidden,
            line: index + 1,
            content: line.trim(),
            suggestion: `Replace "${forbidden}" with "${replacement}"`
          });
        }
      });
      
      FORBIDDEN_PATTERNS.forEach((pattern) => {
        const matches = line.match(pattern);
        if (matches) {
          matches.forEach((match) => {
            violations.push({
              phrase: match,
              line: index + 1,
              content: line.trim(),
              suggestion: `Review and replace "${match}" with safer alternative`
            });
          });
        }
      });
    });
    
    // Should detect multiple violations
    expect(violations.length).toBeGreaterThan(0);
    
    // Should detect "Execute"
    expect(violations.some(v => v.phrase.toLowerCase().includes('execute'))).toBe(true);
    
    // Should detect "guaranteed" pattern
    expect(violations.some(v => v.phrase.toLowerCase().includes('guaranteed'))).toBe(true);
    
    // Should detect "IRS-ready"
    expect(violations.some(v => v.phrase.toLowerCase().includes('irs-ready'))).toBe(true);
  });
});