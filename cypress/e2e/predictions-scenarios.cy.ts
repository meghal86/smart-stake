describe('Predictions & Scenarios', () => {
  beforeEach(() => {
    // Mock authentication
    cy.window().then((win) => {
      win.localStorage.setItem('supabase.auth.token', JSON.stringify({
        access_token: 'mock-token',
        user: { id: 'test-user', email: 'test@example.com' }
      }));
    });
    
    // Mock API responses
    cy.intercept('POST', '**/functions/v1/whale-predictions', {
      fixture: 'predictions.json'
    }).as('getPredictions');
    
    cy.intercept('GET', '**/rest/v1/prediction_clusters*', {
      fixture: 'clusters.json'
    }).as('getClusters');
    
    cy.intercept('GET', '**/rest/v1/prediction_outcomes*', {
      fixture: 'outcomes.json'
    }).as('getOutcomes');
  });

  it('displays predictions page with trust signals', () => {
    cy.visit('/predictions-scenarios');
    
    // Check header
    cy.contains('Predictions & Scenarios').should('be.visible');
    cy.contains('AI-powered whale behavior analysis').should('be.visible');
    
    // Check export buttons
    cy.contains('Export CSV').should('be.visible');
    cy.contains('Export PDF').should('be.visible');
  });

  it('shows prediction clusters and filtering', () => {
    cy.visit('/predictions-scenarios');
    
    // Wait for clusters to load
    cy.wait('@getClusters');
    
    // Check cluster section
    cy.contains('Signal Clusters').should('be.visible');
    cy.get('[data-testid="cluster-card"]').should('have.length.at.least', 1);
    
    // Click cluster to filter
    cy.get('[data-testid="cluster-card"]').first().click();
    
    // Check filter is applied
    cy.contains('Clear Filter').should('be.visible');
    
    // Clear filter
    cy.contains('Clear Filter').click();
    cy.contains('Clear Filter').should('not.exist');
  });

  it('displays outcome badges for predictions', () => {
    cy.visit('/predictions-scenarios');
    
    cy.wait('@getPredictions');
    cy.wait('@getOutcomes');
    
    // Check for outcome badges
    cy.get('[data-testid="outcome-badge"]').should('exist');
    cy.contains('✓').should('be.visible'); // Correct prediction
  });

  it('shows confidence bars with intervals', () => {
    cy.visit('/predictions-scenarios');
    
    cy.wait('@getPredictions');
    
    // Check confidence bars exist
    cy.get('[data-testid="confidence-bar"]').should('exist');
    cy.contains('%').should('be.visible');
    
    // Hover to see tooltip
    cy.get('[data-testid="confidence-bar"]').first().trigger('mouseover');
    cy.contains('bootstrap CI').should('be.visible');
  });

  it('creates alerts from predictions', () => {
    cy.visit('/predictions-scenarios');
    
    cy.wait('@getPredictions');
    
    // Click alert button
    cy.get('[data-testid="alert-button"]').first().click();
    
    // Check dialog opens
    cy.contains('Create Alert').should('be.visible');
    cy.get('[data-testid="alert-dialog"]').should('be.visible');
    
    // Confirm alert creation
    cy.get('[data-testid="confirm-alert"]').click();
    
    // Check success (mock response)
    cy.contains('Alert created').should('be.visible');
  });

  it('exports prediction reports', () => {
    cy.visit('/predictions-scenarios');
    
    cy.wait('@getPredictions');
    
    // Test CSV export
    cy.contains('Export CSV').click();
    
    // Test PDF export
    cy.contains('Export PDF').click();
    
    // Verify downloads (would need to check downloads folder in real test)
  });

  it('shows educational tooltips', () => {
    cy.visit('/predictions-scenarios');
    
    cy.wait('@getPredictions');
    
    // Find and hover over learn why
    cy.get('[data-testid="learn-why"]').first().trigger('mouseover');
    cy.contains('Sharp increases in whale accumulation').should('be.visible');
    cy.contains('Learn more').should('be.visible');
  });

  it('handles mobile responsive behavior', () => {
    cy.viewport('iphone-x');
    cy.visit('/predictions-scenarios');
    
    cy.wait('@getPredictions');
    
    // Check mobile FAB
    cy.get('[data-testid="mobile-fab"]').should('be.visible');
    
    // Check accordion for feature importance
    cy.contains('Feature Importance').click();
    cy.get('[data-testid="feature-accordion"]').should('be.visible');
  });

  it('shows upgrade prompt for free users', () => {
    // Mock free user
    cy.window().then((win) => {
      win.localStorage.setItem('user-plan', 'free');
    });
    
    cy.visit('/predictions-scenarios');
    
    // Should see upgrade prompt
    cy.contains('Premium Feature').should('be.visible');
    cy.contains('Upgrade to Premium').should('be.visible');
  });

  it('auto-refreshes predictions every 30 seconds', () => {
    cy.visit('/predictions-scenarios');
    
    cy.wait('@getPredictions');
    
    // Wait for auto-refresh (mock faster for testing)
    cy.clock();
    cy.tick(30000);
    
    // Should make another API call
    cy.wait('@getPredictions');
  });

  it('tracks analytics events', () => {
    cy.visit('/predictions-scenarios');
    
    cy.wait('@getPredictions');
    cy.wait('@getClusters');
    
    // Mock analytics
    cy.window().then((win) => {
      win.posthog = { capture: cy.stub().as('analytics') };
    });
    
    // Click cluster
    cy.get('[data-testid="cluster-card"]').first().click();
    cy.get('@analytics').should('have.been.calledWith', 'cluster_clicked');
    
    // Create alert
    cy.get('[data-testid="alert-button"]').first().click();
    cy.get('[data-testid="confirm-alert"]').click();
    cy.get('@analytics').should('have.been.calledWith', 'alert_created_from_prediction');
  });
});