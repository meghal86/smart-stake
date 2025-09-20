describe('UI Redesign - Complete User Flows', () => {
  context('Free User Journey', () => {
    beforeEach(() => {
      cy.window().then((win) => {
        win.localStorage.setItem('mock_user_plan', 'free');
      });
      cy.visit('/');
    });

    it('should complete free user onboarding flow', () => {
      // Land on home page
      cy.contains('Whale Alerts').should('be.visible');
      
      // See teaser cards
      cy.contains('Email Alerts').should('be.visible');
      cy.contains('Webhook Integration').should('be.visible');
      
      // Try to access predictions
      cy.contains('Predictions').click();
      cy.contains('Upgrade to Pro').should('be.visible');
      
      // Click upgrade
      cy.contains('Upgrade Now').click();
      cy.url().should('include', '/subscription');
    });

    it('should show limited features with upgrade prompts', () => {
      // Check each tab for appropriate access
      cy.contains('Market').click();
      cy.contains('Market Dashboard').should('be.visible');
      
      cy.contains('Scanner').click();
      cy.contains('Upgrade to Enterprise').should('be.visible');
      
      cy.contains('Reports').click();
      cy.contains('Upgrade to Pro').should('be.visible');
    });
  });

  context('Pro User Journey', () => {
    beforeEach(() => {
      cy.window().then((win) => {
        win.localStorage.setItem('mock_user_plan', 'pro');
      });
      cy.visit('/');
    });

    it('should access pro features and see premium upsells', () => {
      // Access predictions
      cy.contains('Predictions').click();
      cy.contains("Today's Signals").should('be.visible');
      
      // Try premium features
      cy.contains('Scenarios').click();
      cy.contains('Upgrade to Premium').should('be.visible');
      
      // Access reports
      cy.contains('Reports').click();
      cy.contains('PDF Reports').should('be.visible');
      cy.contains('Export PDF').should('be.visible');
    });

    it('should be blocked from enterprise features', () => {
      cy.contains('Scanner').click();
      cy.contains('Upgrade to Enterprise').should('be.visible');
    });
  });

  context('Premium User Journey', () => {
    beforeEach(() => {
      cy.window().then((win) => {
        win.localStorage.setItem('mock_user_plan', 'premium');
      });
      cy.visit('/');
    });

    it('should access all premium features', () => {
      // Full predictions access
      cy.contains('Predictions').click();
      cy.contains("Today's Signals").should('be.visible');
      cy.contains('Scenarios').click();
      cy.contains('Build Scenario').should('be.visible');
      
      // Full reports access
      cy.contains('Reports').click();
      cy.contains('PDF Reports').should('be.visible');
      cy.contains('Scheduled Reports').should('be.visible');
    });

    it('should complete scenario building flow', () => {
      cy.contains('Predictions').click();
      cy.contains('Scenarios').click();
      cy.contains('Create Scenario').click();
      
      // Fill scenario parameters
      cy.get('input[type="number"]').first().clear().type('5');
      cy.get('input[type="number"]').eq(1).clear().type('1000');
      
      // Run simulation
      cy.contains('Run Simulation').click();
      cy.contains('Running Simulation...').should('be.visible');
      cy.contains('Results').should('be.visible');
    });

    it('should use explainability features', () => {
      cy.contains('Predictions').click();
      cy.contains('View Details').first().click();
      cy.contains('Prediction Explainability').should('be.visible');
      cy.contains('Feature Importance').should('be.visible');
      cy.contains('AI Explanation').should('be.visible');
    });
  });

  context('Enterprise User Journey', () => {
    beforeEach(() => {
      cy.window().then((win) => {
        win.localStorage.setItem('mock_user_plan', 'enterprise');
      });
      cy.visit('/');
    });

    it('should access all enterprise features', () => {
      // Full scanner access
      cy.contains('Scanner').click();
      cy.contains('MM Sentinel').should('be.visible');
      cy.contains('AI Forensics').should('be.visible');
      cy.contains('Compliance').should('be.visible');
      
      // Compliance features
      cy.contains('Reports').click();
      cy.contains('Compliance Packs').should('be.visible');
    });

    it('should complete compliance workflow', () => {
      cy.contains('Scanner').click();
      cy.contains('MM Sentinel').click();
      
      // Trigger sentinel scan
      cy.contains('Scan Now').click();
      cy.contains('Scanning...').should('be.visible');
      
      // Check compliance tab
      cy.contains('Compliance').click();
      cy.contains('Compliance Suite').should('be.visible');
    });
  });

  context('Cross-Feature Integration', () => {
    beforeEach(() => {
      cy.window().then((win) => {
        win.localStorage.setItem('mock_user_plan', 'premium');
      });
      cy.visit('/');
    });

    it('should create alert from prediction', () => {
      // Go to predictions
      cy.contains('Predictions').click();
      cy.contains('View Details').first().click();
      
      // Create alert from prediction
      cy.contains('Create Alert').click();
      cy.contains('Alert Center').should('be.visible');
    });

    it('should export prediction results', () => {
      cy.contains('Predictions').click();
      cy.contains('PDF').click();
      // Verify export initiated
    });

    it('should navigate from home to predictions via alert creation', () => {
      cy.contains('Create Alert').click();
      cy.contains('Create your first alert rule').click();
      cy.url().should('include', '/?tab=predictions');
      cy.contains('Predictions & Scenarios').should('be.visible');
    });
  });

  context('Error Handling Flows', () => {
    beforeEach(() => {
      cy.window().then((win) => {
        win.localStorage.setItem('mock_user_plan', 'premium');
      });
      cy.visit('/');
    });

    it('should handle API failures gracefully', () => {
      // Mock API failure
      cy.intercept('POST', '**/whale-predictions', { statusCode: 500 });
      
      cy.contains('Predictions').click();
      cy.contains('Error loading predictions').should('be.visible');
      cy.contains('Retry').should('be.visible');
    });

    it('should handle network timeouts', () => {
      cy.intercept('POST', '**/whale-predictions', { delay: 30000 });
      
      cy.contains('Predictions').click();
      cy.get('[data-testid="loading-skeleton"]').should('be.visible');
    });

    it('should validate form inputs', () => {
      cy.contains('Predictions').click();
      cy.contains('Scenarios').click();
      cy.contains('Create Scenario').click();
      
      // Try invalid input
      cy.get('input[type="number"]').first().clear().type('-1');
      cy.contains('Run Simulation').click();
      cy.contains('Invalid input').should('be.visible');
    });
  });

  context('Performance Flows', () => {
    it('should load pages quickly', () => {
      const start = Date.now();
      cy.visit('/');
      cy.contains('Whale Alerts').should('be.visible').then(() => {
        const loadTime = Date.now() - start;
        expect(loadTime).to.be.lessThan(2000);
      });
    });

    it('should handle rapid navigation', () => {
      cy.visit('/');
      
      // Rapidly switch between tabs
      cy.contains('Market').click();
      cy.contains('Predictions').click();
      cy.contains('Scanner').click();
      cy.contains('Reports').click();
      
      // Should end up on reports
      cy.contains('Reports & Exports').should('be.visible');
    });

    it('should maintain state during navigation', () => {
      cy.window().then((win) => {
        win.localStorage.setItem('mock_user_plan', 'premium');
      });
      cy.visit('/');
      
      // Set up scenario
      cy.contains('Predictions').click();
      cy.contains('Scenarios').click();
      cy.contains('Create Scenario').click();
      cy.get('input[type="number"]').first().clear().type('10');
      
      // Navigate away and back
      cy.contains('Market').click();
      cy.contains('Predictions').click();
      cy.contains('Scenarios').click();
      
      // State should be preserved
      cy.contains('Create Scenario').click();
      cy.get('input[type="number"]').first().should('have.value', '10');
    });
  });
});