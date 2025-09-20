describe('UI Redesign - Predictions & Scenarios', () => {
  beforeEach(() => {
    cy.window().then((win) => {
      win.localStorage.setItem('mock_user_plan', 'premium');
    });
    cy.visit('/');
    cy.contains('Predictions').click();
  });

  it('should display merged predictions interface', () => {
    cy.contains('Predictions & Scenarios').should('be.visible');
    cy.contains("Today's Signals").should('be.visible');
    cy.contains('Scenarios').should('be.visible');
  });

  it('should default to Today\'s Signals tab', () => {
    cy.get('[role="tabpanel"]').should('contain', "Today's Signals");
    cy.contains('active').should('be.visible');
  });

  context('Today\'s Signals', () => {
    it('should display signals list', () => {
      cy.contains("Today's Signals").click();
      cy.get('[data-testid="signals-list"]').should('be.visible');
      cy.contains('ETH').should('be.visible');
      cy.contains('85%').should('be.visible'); // confidence
    });

    it('should open explainability panel', () => {
      cy.contains('View Details').first().click();
      cy.contains('Prediction Explainability').should('be.visible');
      cy.contains('Feature Importance').should('be.visible');
      cy.contains('AI Explanation').should('be.visible');
    });

    it('should close explainability panel', () => {
      cy.contains('View Details').first().click();
      cy.get('[data-testid="close-explainability"]').click();
      cy.contains('Prediction Explainability').should('not.exist');
    });
  });

  context('Scenarios Tab', () => {
    beforeEach(() => {
      cy.contains('Scenarios').click();
    });

    it('should display scenario builder', () => {
      cy.contains('Scenario Builder').should('be.visible');
      cy.contains('Create Scenario').should('be.visible');
    });

    it('should open scenario builder modal', () => {
      cy.contains('Create Scenario').click();
      cy.contains('Scenario Builder').should('be.visible');
      cy.contains('Simulation Parameters').should('be.visible');
    });

    it('should run simulation', () => {
      cy.contains('Create Scenario').click();
      
      // Fill parameters
      cy.get('input[type="number"]').first().clear().type('10');
      cy.get('input[type="number"]').eq(1).clear().type('2000');
      
      // Run simulation
      cy.contains('Run Simulation').click();
      cy.contains('Running Simulation...').should('be.visible');
      
      // Check results
      cy.contains('Results').should('be.visible');
    });
  });

  context('Performance Panel', () => {
    it('should display performance metrics', () => {
      cy.contains('Model Performance').should('be.visible');
      cy.contains('87.5%').should('be.visible'); // accuracy
      cy.contains('1,247').should('be.visible'); // total predictions
    });

    it('should export PDF', () => {
      cy.contains('PDF').click();
      // Mock download would be tested here
    });

    it('should export CSV', () => {
      cy.contains('CSV').click();
      // Mock download would be tested here
    });
  });

  context('Mobile Responsive', () => {
    it('should show FAB on mobile', () => {
      cy.viewport(375, 667);
      cy.contains('Scenarios').click();
      cy.get('[data-testid="mobile-fab"]').should('be.visible');
    });

    it('should open scenario builder from FAB', () => {
      cy.viewport(375, 667);
      cy.contains('Scenarios').click();
      cy.get('[data-testid="mobile-fab"]').click();
      cy.contains('Scenario Builder').should('be.visible');
    });
  });
});