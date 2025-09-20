describe('UI Redesign - Home & Alerts', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('should display home page with whale alerts', () => {
    cy.contains('Whale Alerts').should('be.visible');
    cy.contains('AI-powered whale behavior predictions').should('be.visible');
  });

  context('Alert Teaser Cards', () => {
    it('should display email alerts teaser for free users', () => {
      cy.window().then((win) => {
        win.localStorage.setItem('mock_user_plan', 'free');
      });
      cy.reload();
      
      cy.contains('Email Alerts').should('be.visible');
      cy.contains('Get instant email notifications').should('be.visible');
      cy.contains('Upgrade to Premium').should('be.visible');
    });

    it('should display webhook teaser for non-enterprise users', () => {
      cy.window().then((win) => {
        win.localStorage.setItem('mock_user_plan', 'premium');
      });
      cy.reload();
      
      cy.contains('Webhook Integration').should('be.visible');
      cy.contains('Connect to Slack, Discord, Zapier').should('be.visible');
      cy.contains('Upgrade to Enterprise').should('be.visible');
    });

    it('should not show teasers for users with appropriate plans', () => {
      cy.window().then((win) => {
        win.localStorage.setItem('mock_user_plan', 'enterprise');
      });
      cy.reload();
      
      cy.contains('Email Alerts').should('not.exist');
      cy.contains('Webhook Integration').should('not.exist');
    });

    it('should redirect to subscription on teaser click', () => {
      cy.window().then((win) => {
        win.localStorage.setItem('mock_user_plan', 'free');
      });
      cy.reload();
      
      cy.contains('Upgrade to Premium').click();
      cy.url().should('include', '/subscription');
    });
  });

  context('Alert Creation Flow', () => {
    it('should open alert center', () => {
      cy.contains('Create Alert').click();
      cy.contains('Alert Center').should('be.visible');
      cy.contains('Create Custom Alert').should('be.visible');
    });

    it('should show alert templates', () => {
      cy.contains('Create Alert').click();
      cy.contains('Browse Templates').should('be.visible');
      cy.contains('View History').should('be.visible');
    });

    it('should create prediction alert', () => {
      cy.contains('Create Alert').click();
      cy.contains('Create your first alert rule').click();
      cy.url().should('include', '/?tab=predictions');
    });

    it('should close alert center', () => {
      cy.contains('Create Alert').click();
      cy.get('[data-testid="close-alert-center"]').click();
      cy.contains('Alert Center').should('not.exist');
    });
  });

  context('Whale Transactions Display', () => {
    it('should show whale transaction cards', () => {
      cy.get('[data-testid="whale-transaction"]').should('have.length.at.least', 1);
      cy.contains('ETH').should('be.visible');
      cy.contains('$').should('be.visible');
    });

    it('should toggle view modes', () => {
      // Test expanded view (default)
      cy.contains('Full').should('have.class', 'bg-primary');
      
      // Switch to summary view
      cy.contains('Summary').click();
      cy.get('[data-testid="transaction-summary"]').should('be.visible');
      
      // Switch to minimal view
      cy.contains('Minimal').click();
      cy.get('[data-testid="transaction-minimal"]').should('be.visible');
    });

    it('should filter transactions', () => {
      // Test search filter
      cy.get('input[placeholder*="Search"]').type('ETH');
      cy.get('[data-testid="whale-transaction"]').should('contain', 'ETH');
      
      // Test chain filter
      cy.get('select').first().select('Ethereum');
      cy.get('[data-testid="whale-transaction"]').should('be.visible');
      
      // Test amount filter
      cy.get('input[placeholder="Min USD"]').type('1000000');
      cy.get('[data-testid="whale-transaction"]').should('be.visible');
    });

    it('should open transaction details', () => {
      cy.get('[data-testid="whale-transaction"]').first().click();
      cy.contains('Transaction Details').should('be.visible');
      cy.contains('Transaction Hash').should('be.visible');
      cy.contains('From Address').should('be.visible');
      cy.contains('To Address').should('be.visible');
    });
  });

  context('Live Data Status', () => {
    it('should show API health status', () => {
      cy.get('[data-testid="api-health"]').should('be.visible');
      cy.contains('Live Data').should('be.visible');
    });

    it('should display transaction count', () => {
      cy.get('[data-testid="transaction-count"]').should('be.visible');
      cy.contains('alerts').should('be.visible');
    });
  });

  context('Plan Limits', () => {
    it('should show daily limits for free users', () => {
      cy.window().then((win) => {
        win.localStorage.setItem('mock_user_plan', 'free');
      });
      cy.reload();
      
      cy.contains('Daily alerts:').should('be.visible');
      cy.contains('/50').should('be.visible');
      cy.contains('Upgrade').should('be.visible');
    });

    it('should not show limits for premium users', () => {
      cy.window().then((win) => {
        win.localStorage.setItem('mock_user_plan', 'premium');
      });
      cy.reload();
      
      cy.contains('Daily alerts:').should('not.exist');
    });
  });

  context('Responsive Design', () => {
    it('should work on mobile', () => {
      cy.viewport(375, 667);
      cy.contains('Whale Alerts').should('be.visible');
      cy.get('[data-testid="whale-transaction"]').should('be.visible');
    });

    it('should show mobile navigation', () => {
      cy.viewport(375, 667);
      cy.get('[data-testid="bottom-navigation"]').should('be.visible');
    });

    it('should hide desktop elements on mobile', () => {
      cy.viewport(375, 667);
      cy.get('[data-testid="desktop-only"]').should('not.be.visible');
    });
  });
});