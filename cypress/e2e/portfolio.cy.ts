describe('Portfolio Monitor E2E Tests', () => {
  beforeEach(() => {
    cy.visit('/?tab=portfolio');
    cy.clearLocalStorage();
  });

  describe('Add Address Flow', () => {
    it('should add a new wallet address', () => {
      cy.contains('Add Your First Address').click();
      cy.get('input[placeholder*="0x742d35Cc"]').type('0x742d35Cc6634C0532925a3b8D4C9db4C532925a3');
      cy.get('input[placeholder*="My Trading Wallet"]').type('My Test Wallet');
      cy.get('button').contains('Add Address').click();
      
      cy.contains('My Test Wallet').should('be.visible');
    });

    it('should validate invalid address format', () => {
      cy.contains('Add Your First Address').click();
      cy.get('input[placeholder*="0x742d35Cc"]').type('invalid-address');
      cy.get('input[placeholder*="My Trading Wallet"]').type('Test');
      
      cy.contains('Please enter a valid Ethereum address').should('be.visible');
    });
  });

  describe('Portfolio Management', () => {
    it('should display portfolio summary', () => {
      cy.contains('Total Portfolio Value').should('be.visible');
      cy.contains('Avg P&L').should('be.visible');
      cy.contains('Monitored Addresses').should('be.visible');
    });

    it('should show export button when addresses exist', () => {
      cy.window().then((win) => {
        win.localStorage.setItem('portfolio-addresses', JSON.stringify([{
          id: '1',
          address: '0x742d35Cc6634C0532925a3b8D4C9db4C532925a3',
          label: 'Test Wallet',
          totalValue: 45000,
          pnl: 8.5,
          riskScore: 7,
          whaleInteractions: 12,
          lastActivity: new Date().toISOString(),
          holdings: []
        }]));
      });
      cy.reload();
      
      cy.contains('Export').should('be.visible');
    });
  });
});