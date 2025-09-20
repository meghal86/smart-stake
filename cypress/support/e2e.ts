// Cypress E2E support file for UI Redesign tests

import './commands';

// Global test setup
beforeEach(() => {
  // Mock user authentication
  cy.window().then((win) => {
    win.localStorage.setItem('mock_authenticated', 'true');
  });

  // Mock API responses for consistent testing
  cy.intercept('POST', '**/whale-predictions', {
    fixture: 'predictions.json'
  }).as('getPredictions');

  cy.intercept('POST', '**/whale-alerts', {
    fixture: 'alerts.json'
  }).as('getAlerts');

  cy.intercept('POST', '**/market-maker-sentinel', {
    fixture: 'market-maker-flows.json'
  }).as('getMarketMakerFlows');
});

// Handle uncaught exceptions
Cypress.on('uncaught:exception', (err, runnable) => {
  // Ignore certain errors that don't affect functionality
  if (err.message.includes('ResizeObserver loop limit exceeded')) {
    return false;
  }
  return true;
});

// Add data-testid attributes for better testing
Cypress.Commands.overwrite('contains', (originalFn, subject, filter, text, options = {}) => {
  if (typeof text === 'object') {
    options = text;
    text = filter;
    filter = undefined;
  }

  options.matchCase = false;
  return originalFn(subject, filter, text, options);
});