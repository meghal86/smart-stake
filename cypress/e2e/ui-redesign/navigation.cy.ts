describe('UI Redesign - Navigation System', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('should display 6 navigation tabs', () => {
    cy.get('[data-testid="bottom-navigation"]').should('be.visible');
    
    // Verify tab labels
    cy.contains('Alerts').should('be.visible');
    cy.contains('Market').should('be.visible');
    cy.contains('Predictions').should('be.visible');
    cy.contains('Scanner').should('be.visible');
    cy.contains('Reports').should('be.visible');
    cy.contains('Settings').should('be.visible');
  });

  it('should navigate between tabs correctly', () => {
    // Test Home/Alerts tab (default)
    cy.contains('Whale Alerts').should('be.visible');

    // Navigate to Market Dashboard
    cy.contains('Market').click();
    cy.contains('Market Dashboard').should('be.visible');

    // Navigate to Predictions
    cy.contains('Predictions').click();
    cy.contains('Predictions & Scenarios').should('be.visible');

    // Navigate to Scanner
    cy.contains('Scanner').click();
    cy.contains('Scanner & Compliance').should('be.visible');

    // Navigate to Reports
    cy.contains('Reports').click();
    cy.contains('Reports & Exports').should('be.visible');
  });

  it('should work on mobile viewport', () => {
    cy.viewport(375, 667);
    
    // Test mobile navigation
    cy.contains('Predictions').click();
    cy.contains('Predictions & Scenarios').should('be.visible');
  });
});