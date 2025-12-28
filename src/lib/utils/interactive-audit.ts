/**
 * Interactive Element Audit Utility
 * 
 * Provides utilities to identify and fix inert interactive elements.
 * Implements requirement R5 - Interactive Element Reliability
 * 
 * @see .kiro/specs/missing-requirements/requirements.md - Requirement 5
 */

interface ElementWithOnClick extends Element {
  onclick?: ((this: GlobalEventHandlers, ev: MouseEvent) => unknown) | null;
}

interface WindowWithAudit extends Window {
  auditInteractiveElements?: () => InteractiveElementIssue[] | undefined;
}

export interface InteractiveElementIssue {
  element: Element
  type: 'button' | 'link' | 'card' | 'toggle' | 'other'
  issue: 'no-click-handler' | 'no-keyboard-support' | 'no-aria-label' | 'no-disabled-feedback'
  severity: 'high' | 'medium' | 'low'
  suggestion: string
}

/**
 * Audits the current page for interactive element issues
 */
export function auditInteractiveElements(): InteractiveElementIssue[] {
  const issues: InteractiveElementIssue[] = []
  
  // Find all potentially interactive elements
  const selectors = [
    'button',
    'a[href]',
    '[role="button"]',
    '[tabindex="0"]',
    '.cursor-pointer',
    '[onclick]',
    '.hover\\:',
    '.transition-all',
    '.hover\\:shadow',
    '.hover\\:scale',
    '.hover\\:bg-',
    '.hover\\:opacity'
  ]
  
  const elements = document.querySelectorAll(selectors.join(', '))
  
  elements.forEach(element => {
    const issues_for_element = checkElement(element)
    issues.push(...issues_for_element)
  })
  
  return issues
}

function checkElement(element: Element): InteractiveElementIssue[] {
  const issues: InteractiveElementIssue[] = []
  const tagName = element.tagName.toLowerCase()
  
  // Determine element type
  let type: InteractiveElementIssue['type'] = 'other'
  if (tagName === 'button') type = 'button'
  else if (tagName === 'a') type = 'link'
  else if (element.classList.contains('card') || element.closest('.card')) type = 'card'
  else if (element.getAttribute('role') === 'button') type = 'button'
  
  // Check for click handler
  const hasClickHandler = !!(
    element.getAttribute('onclick') ||
    (element as ElementWithOnClick).onclick ||
    element.getAttribute('href') ||
    element.getAttribute('role') === 'button'
  )
  
  // Check for keyboard support
  const hasKeyboardSupport = !!(
    tagName === 'button' ||
    tagName === 'a' ||
    element.getAttribute('tabindex') === '0' ||
    element.getAttribute('onkeydown')
  )
  
  // Check for ARIA labels
  const hasAriaLabel = !!(
    element.getAttribute('aria-label') ||
    element.getAttribute('aria-labelledby') ||
    element.getAttribute('title')
  )
  
  // Check if element appears interactive but has no handler
  const appearsInteractive = !!(
    element.classList.contains('cursor-pointer') ||
    element.classList.toString().includes('hover:') ||
    element.classList.contains('transition-all')
  )
  
  // Check for disabled state feedback
  const isDisabled = element.hasAttribute('disabled') || element.getAttribute('aria-disabled') === 'true'
  const hasDisabledFeedback = !!(
    isDisabled && (
      element.getAttribute('title') ||
      element.getAttribute('aria-label') ||
      element.closest('[data-tooltip]')
    )
  )
  
  // Report issues
  if (appearsInteractive && !hasClickHandler) {
    issues.push({
      element,
      type,
      issue: 'no-click-handler',
      severity: 'high',
      suggestion: 'Add onClick handler or remove interactive styling'
    })
  }
  
  if (hasClickHandler && !hasKeyboardSupport) {
    issues.push({
      element,
      type,
      issue: 'no-keyboard-support',
      severity: 'high',
      suggestion: 'Add tabIndex=0 and onKeyDown handler for Enter/Space keys'
    })
  }
  
  if (hasClickHandler && !hasAriaLabel) {
    issues.push({
      element,
      type,
      issue: 'no-aria-label',
      severity: 'medium',
      suggestion: 'Add aria-label or title attribute for screen readers'
    })
  }
  
  if (isDisabled && !hasDisabledFeedback) {
    issues.push({
      element,
      type,
      issue: 'no-disabled-feedback',
      severity: 'medium',
      suggestion: 'Add tooltip or title explaining why element is disabled'
    })
  }
  
  return issues
}

/**
 * Generates a report of interactive element issues
 */
export function generateInteractiveAuditReport(): string {
  const issues = auditInteractiveElements()
  
  if (issues.length === 0) {
    return '✅ No interactive element issues found!'
  }
  
  const highSeverity = issues.filter(i => i.severity === 'high')
  const mediumSeverity = issues.filter(i => i.severity === 'medium')
  const lowSeverity = issues.filter(i => i.severity === 'low')
  
  let report = `🔍 Interactive Element Audit Report\n\n`
  report += `Total Issues: ${issues.length}\n`
  report += `High Severity: ${highSeverity.length}\n`
  report += `Medium Severity: ${mediumSeverity.length}\n`
  report += `Low Severity: ${lowSeverity.length}\n\n`
  
  if (highSeverity.length > 0) {
    report += `🚨 HIGH SEVERITY ISSUES:\n`
    highSeverity.forEach((issue, index) => {
      report += `${index + 1}. ${issue.type.toUpperCase()}: ${issue.issue}\n`
      report += `   Element: ${getElementDescription(issue.element)}\n`
      report += `   Suggestion: ${issue.suggestion}\n\n`
    })
  }
  
  if (mediumSeverity.length > 0) {
    report += `⚠️ MEDIUM SEVERITY ISSUES:\n`
    mediumSeverity.forEach((issue, index) => {
      report += `${index + 1}. ${issue.type.toUpperCase()}: ${issue.issue}\n`
      report += `   Element: ${getElementDescription(issue.element)}\n`
      report += `   Suggestion: ${issue.suggestion}\n\n`
    })
  }
  
  return report
}

function getElementDescription(element: Element): string {
  const tagName = element.tagName.toLowerCase()
  const id = element.id ? `#${element.id}` : ''
  const classes = element.className ? `.${element.className.split(' ').slice(0, 3).join('.')}` : ''
  const text = element.textContent?.slice(0, 30) || ''
  
  return `<${tagName}${id}${classes}>${text}${text.length >= 30 ? '...' : ''}`
}

/**
 * Development helper to run audit in console
 */
export function runInteractiveAudit(): InteractiveElementIssue[] | undefined {
  if (typeof window === 'undefined') {
    console.warn('Interactive audit can only run in browser environment');
    return undefined;
  }
  
  const report = generateInteractiveAuditReport();
  console.log(report);
  
  // Also highlight problematic elements in the DOM
  const issues = auditInteractiveElements();
  issues.forEach(issue => {
    if (issue.severity === 'high') {
      const htmlElement = issue.element as HTMLElement;
      htmlElement.style.outline = '2px solid red';
      htmlElement.title = `ISSUE: ${issue.suggestion}`;
    }
  });
  
  return issues;
}

// Make available globally for development
if (typeof window !== 'undefined') {
  (window as WindowWithAudit).auditInteractiveElements = runInteractiveAudit;
}