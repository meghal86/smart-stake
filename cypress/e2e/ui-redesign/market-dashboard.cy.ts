describe('UI Redesign - Market Dashboard', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.contains('Market').click();
  });

  it('should display market dashboard with tabs', () => {
    cy.contains('Market Dashboard').should('be.visible');
    cy.contains('Whale Analytics').should('be.visible');
    cy.contains('Sentiment').should('be.visible');
    cy.contains('Portfolio').should('be.visible');
  });

  context('Whale Analytics Tab', () => {
    it('should display whale analytics by default', () => {
      cy.contains('Whale Analytics').should('have.class', 'data-[state=active]');
      cy.contains('AI-powered whale risk assessment').should('be.visible');
    });

    it('should show whale cards', () => {
      cy.get('[data-testid="whale-card"]').should('have.length.at.least', 1);
      cy.contains('Whale 1').should('be.visible');
      cy.contains('Risk Score').should('be.visible');
    });

    it('should display market metrics', () => {
      cy.contains('24h Volume').should('be.visible');
      cy.contains('Active Whales').should('be.visible');
      cy.contains('Risk Alerts').should('be.visible');
    });
  });

  context('Sentiment Tab', () => {
    beforeEach(() => {
      cy.contains('Sentiment').click();
    });

    it('should display sentiment analysis', () => {
      cy.contains('Multi-Coin Analysis').should('be.visible');
      cy.get('[data-testid="coin-card"]').should('have.length.at.least', 1);
    });

    it('should show coin sentiment scores', () => {
      cy.contains('BTC').should('be.visible');
      cy.contains('ETH').should('be.visible');
      cy.get('[data-testid="sentiment-score"]').should('be.visible');
    });

    it('should allow filtering coins', () => {
      cy.get('[data-testid="sentiment-filter"]').select('Bullish');
      cy.get('[data-testid="coin-card"]').should('be.visible');
    });
  });

  context('Portfolio Tab', () => {
    beforeEach(() => {
      cy.contains('Portfolio').click();
    });

    it('should display portfolio overview', () => {
      cy.contains('Portfolio Tracking').should('be.visible');
      cy.contains('Total Value').should('be.visible');
    });

    it('should show portfolio metrics', () => {
      cy.contains('24h Change').should('be.visible');
      cy.contains('Holdings').should('be.visible');
    });

    it('should allow adding addresses', () => {
      cy.contains('Add Address').click();
      cy.get('input[placeholder*="address"]').should('be.visible');
    });
  });

  context('Responsive Design', () => {
    it('should work on tablet', () => {
      cy.viewport(768, 1024);
      cy.contains('Market Dashboard').should('be.visible');
      cy.contains('Whale Analytics').click();
      cy.get('[data-testid="whale-card"]').should('be.visible');
    });

    it('should work on mobile', () => {
      cy.viewport(375, 667);
      cy.contains('Market Dashboard').should('be.visible');
      cy.contains('Sentiment').click();
      cy.get('[data-testid="coin-card"]').should('be.visible');
    });
  });
});