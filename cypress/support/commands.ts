// Custom Cypress commands for UI Redesign testing

declare global {
  namespace Cypress {
    interface Chainable {
      setUserPlan(plan: 'free' | 'pro' | 'premium' | 'enterprise'): Chainable<void>
      mockApiResponse(endpoint: string, response: any): Chainable<void>
      testResponsive(callback: () => void): Chainable<void>
      waitForPageLoad(): Chainable<void>
      checkAccessibility(): Chainable<void>
    }
  }
}

// Set user plan for testing
Cypress.Commands.add('setUserPlan', (plan: 'free' | 'pro' | 'premium' | 'enterprise') => {
  cy.window().then((win) => {
    win.localStorage.setItem('mock_user_plan', plan);
  });
});

// Mock API responses
Cypress.Commands.add('mockApiResponse', (endpoint: string, response: any) => {
  cy.intercept('POST', `**/${endpoint}`, {
    statusCode: 200,
    body: response
  }).as(endpoint);
});

// Test responsive behavior across viewports
Cypress.Commands.add('testResponsive', (callback: () => void) => {
  const viewports = [
    { width: 375, height: 667 },   // Mobile
    { width: 768, height: 1024 },  // Tablet
    { width: 1920, height: 1080 }  // Desktop
  ];

  viewports.forEach(viewport => {
    cy.viewport(viewport.width, viewport.height);
    callback();
  });
});

// Wait for page to fully load
Cypress.Commands.add('waitForPageLoad', () => {
  cy.get('[data-testid="loading-skeleton"]').should('not.exist');
  cy.get('[data-testid="page-content"]').should('be.visible');
});

// Basic accessibility checks
Cypress.Commands.add('checkAccessibility', () => {
  // Check for proper heading hierarchy
  cy.get('h1').should('have.length.at.most', 1);
  
  // Check for alt text on images
  cy.get('img').each(($img) => {
    cy.wrap($img).should('have.attr', 'alt');
  });
  
  // Check for proper button labels
  cy.get('button').each(($btn) => {
    cy.wrap($btn).should('satisfy', ($el) => {
      return $el.text().trim() !== '' || $el.attr('aria-label') !== undefined;
    });
  });
});

export {};