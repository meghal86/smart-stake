describe('UI Redesign - Plan Gating System', () => {
  context('Free User Experience', () => {
    beforeEach(() => {
      cy.window().then((win) => {
        win.localStorage.setItem('mock_user_plan', 'free');
      });
      cy.visit('/');
    });

    it('should show upgrade prompts for premium features', () => {
      // Navigate to predictions
      cy.contains('Predictions').click();
      
      // Should see upgrade prompt
      cy.contains('Upgrade to Pro').should('be.visible');
      cy.contains('Premium Feature').should('be.visible');
    });

    it('should display alert teaser cards on home page', () => {
      // Should see email alerts teaser
      cy.contains('Email Alerts').should('be.visible');
      cy.contains('Upgrade to Premium').should('be.visible');
      
      // Should see webhook teaser
      cy.contains('Webhook Integration').should('be.visible');
      cy.contains('Upgrade to Enterprise').should('be.visible');
    });

    it('should block access to scanner compliance', () => {
      cy.contains('Scanner').click();
      cy.contains('Upgrade to Enterprise').should('be.visible');
      cy.contains('Scanner & Compliance Suite').should('be.visible');
    });
  });

  context('Pro User Experience', () => {
    beforeEach(() => {
      cy.window().then((win) => {
        win.localStorage.setItem('mock_user_plan', 'pro');
      });
      cy.visit('/');
    });

    it('should allow access to predictions', () => {
      cy.contains('Predictions').click();
      cy.contains("Today's Signals").should('be.visible');
      cy.contains('Scenarios').should('be.visible');
    });

    it('should block premium features', () => {
      cy.contains('Predictions').click();
      cy.contains('Scenarios').click();
      cy.contains('Upgrade to Premium').should('be.visible');
    });
  });

  context('Premium User Experience', () => {
    beforeEach(() => {
      cy.window().then((win) => {
        win.localStorage.setItem('mock_user_plan', 'premium');
      });
      cy.visit('/');
    });

    it('should allow full predictions access', () => {
      cy.contains('Predictions').click();
      cy.contains("Today's Signals").should('be.visible');
      cy.contains('Scenarios').click();
      cy.contains('Build Scenario').should('be.visible');
    });

    it('should allow reports access', () => {
      cy.contains('Reports').click();
      cy.contains('PDF Reports').should('be.visible');
      cy.contains('CSV Data').should('be.visible');
    });

    it('should block enterprise scanner', () => {
      cy.contains('Scanner').click();
      cy.contains('Upgrade to Enterprise').should('be.visible');
    });
  });

  context('Enterprise User Experience', () => {
    beforeEach(() => {
      cy.window().then((win) => {
        win.localStorage.setItem('mock_user_plan', 'enterprise');
      });
      cy.visit('/');
    });

    it('should allow full scanner access', () => {
      cy.contains('Scanner').click();
      cy.contains('MM Sentinel').should('be.visible');
      cy.contains('AI Forensics').should('be.visible');
      cy.contains('Compliance').should('be.visible');
    });

    it('should have access to all features', () => {
      // Test predictions
      cy.contains('Predictions').click();
      cy.contains('Build Scenario').should('be.visible');
      
      // Test reports
      cy.contains('Reports').click();
      cy.contains('Compliance Packs').should('be.visible');
    });
  });
});