#!/usr/bin/env tsx
/**
 * Interactive Elements Audit Script
 * 
 * Scans the codebase for interactive elements that may lack proper feedback.
 * Implements requirement R5 - Interactive Element Reliability
 * 
 * Usage: npx tsx src/scripts/audit-interactive-elements.ts
 */

import fs from 'fs'
import path from 'path'
import * as glob from 'glob'

interface InteractiveElementIssue {
  file: string
  line: number
  element: string
  issue: string
  severity: 'high' | 'medium' | 'low'
  suggestion: string
}

const issues: InteractiveElementIssue[] = []

// Patterns that indicate interactive elements
const INTERACTIVE_PATTERNS = [
  // Click handlers without proper button/link semantics
  { pattern: /div.*onClick/g, issue: 'div-with-onclick', severity: 'high' as const },
  { pattern: /span.*onClick/g, issue: 'span-with-onclick', severity: 'high' as const },
  { pattern: /img.*onClick/g, issue: 'img-with-onclick', severity: 'high' as const },
  
  // Interactive styling without handlers
  { pattern: /cursor-pointer(?!.*onClick)/g, issue: 'cursor-pointer-no-handler', severity: 'high' as const },
  { pattern: /hover:(?!.*onClick|.*href)/g, issue: 'hover-styling-no-handler', severity: 'medium' as const },
  
  // Missing accessibility
  { pattern: /onClick(?!.*aria-label|.*title)/g, issue: 'onclick-no-aria', severity: 'medium' as const },
  { pattern: /onClick(?!.*onKeyDown)/g, issue: 'onclick-no-keyboard', severity: 'high' as const },
  
  // Disabled elements without feedback
  { pattern: /disabled.*(?!title|aria-label|tooltip)/g, issue: 'disabled-no-feedback', severity: 'medium' as const },
]

// Patterns that are acceptable (don't flag these)
const ACCEPTABLE_PATTERNS = [
  /Button.*onClick/,  // Button components are fine
  /button.*onClick/,  // Native buttons are fine
  /a.*href/,          // Links with href are fine
  /Link.*to/,         // React Router Links are fine
  /NavLink.*to/,      // React Router NavLinks are fine
  /role="button"/,    // Elements with button role are fine
  /tabIndex.*onClick.*onKeyDown/, // Properly accessible elements
]

function isAcceptablePattern(line: string): boolean {
  return ACCEPTABLE_PATTERNS.some(pattern => pattern.test(line))
}

function scanFile(filePath: string) {
  const content = fs.readFileSync(filePath, 'utf-8')
  const lines = content.split('\n')
  
  lines.forEach((line, index) => {
    const lineNumber = index + 1
    
    // Skip if this line matches acceptable patterns
    if (isAcceptablePattern(line)) {
      return
    }
    
    // Check for problematic patterns
    INTERACTIVE_PATTERNS.forEach(({ pattern, issue, severity }) => {
      const matches = line.match(pattern)
      if (matches) {
        matches.forEach(match => {
          issues.push({
            file: filePath,
            line: lineNumber,
            element: line.trim(),
            issue,
            severity,
            suggestion: getSuggestion(issue)
          })
        })
      }
    })
  })
}

function getSuggestion(issue: string): string {
  switch (issue) {
    case 'div-with-onclick':
      return 'Use <button> or add role="button", tabIndex=0, and onKeyDown handler'
    case 'span-with-onclick':
      return 'Use <button> or add role="button", tabIndex=0, and onKeyDown handler'
    case 'img-with-onclick':
      return 'Wrap in <button> or add role="button", tabIndex=0, and onKeyDown handler'
    case 'cursor-pointer-no-handler':
      return 'Add onClick handler or remove cursor-pointer styling'
    case 'hover-styling-no-handler':
      return 'Add interaction handler or remove hover styling'
    case 'onclick-no-aria':
      return 'Add aria-label or title attribute for screen readers'
    case 'onclick-no-keyboard':
      return 'Add onKeyDown handler for Enter/Space keys'
    case 'disabled-no-feedback':
      return 'Add tooltip or title explaining why element is disabled'
    default:
      return 'Review element for proper interactive feedback'
  }
}

function generateReport() {
  console.log('🔍 Interactive Elements Audit Report')
  console.log('=====================================\n')
  
  if (issues.length === 0) {
    console.log('✅ No interactive element issues found!')
    return
  }
  
  const highSeverity = issues.filter(i => i.severity === 'high')
  const mediumSeverity = issues.filter(i => i.severity === 'medium')
  const lowSeverity = issues.filter(i => i.severity === 'low')
  
  console.log(`Total Issues: ${issues.length}`)
  console.log(`High Severity: ${highSeverity.length}`)
  console.log(`Medium Severity: ${mediumSeverity.length}`)
  console.log(`Low Severity: ${lowSeverity.length}\n`)
  
  if (highSeverity.length > 0) {
    console.log('🚨 HIGH SEVERITY ISSUES:')
    console.log('========================\n')
    highSeverity.forEach((issue, index) => {
      console.log(`${index + 1}. ${issue.file}:${issue.line}`)
      console.log(`   Issue: ${issue.issue}`)
      console.log(`   Element: ${issue.element}`)
      console.log(`   Suggestion: ${issue.suggestion}\n`)
    })
  }
  
  if (mediumSeverity.length > 0) {
    console.log('⚠️ MEDIUM SEVERITY ISSUES:')
    console.log('==========================\n')
    mediumSeverity.forEach((issue, index) => {
      console.log(`${index + 1}. ${issue.file}:${issue.line}`)
      console.log(`   Issue: ${issue.issue}`)
      console.log(`   Element: ${issue.element}`)
      console.log(`   Suggestion: ${issue.suggestion}\n`)
    })
  }
  
  // Generate summary by file
  const fileIssues = issues.reduce((acc, issue) => {
    if (!acc[issue.file]) acc[issue.file] = []
    acc[issue.file].push(issue)
    return acc
  }, {} as Record<string, InteractiveElementIssue[]>)
  
  console.log('📁 ISSUES BY FILE:')
  console.log('==================\n')
  Object.entries(fileIssues)
    .sort(([, a], [, b]) => b.length - a.length)
    .forEach(([file, fileIssues]) => {
      const high = fileIssues.filter(i => i.severity === 'high').length
      const medium = fileIssues.filter(i => i.severity === 'medium').length
      console.log(`${file}: ${fileIssues.length} issues (${high} high, ${medium} medium)`)
    })
}

async function main() {
  console.log('Scanning TypeScript React files for interactive element issues...\n')
  
  // Find all TSX files in src directory using sync version
  const files = glob.sync('src/**/*.tsx', { ignore: ['node_modules/**', 'dist/**'] })
  
  console.log(`Found ${files.length} files to scan\n`)
  
  files.forEach(scanFile)
  
  generateReport()
  
  // Exit with error code if high severity issues found
  const highSeverityCount = issues.filter(i => i.severity === 'high').length
  if (highSeverityCount > 0) {
    console.log(`\n❌ Found ${highSeverityCount} high severity issues that must be fixed`)
    process.exit(1)
  } else {
    console.log('\n✅ No high severity issues found')
    process.exit(0)
  }
}

// Run the audit
main().catch(console.error)

export { scanFile, generateReport, issues }