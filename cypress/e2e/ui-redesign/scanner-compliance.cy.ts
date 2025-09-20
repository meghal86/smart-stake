describe('UI Redesign - Scanner & Compliance', () => {
  context('Enterprise User Access', () => {
    beforeEach(() => {
      cy.window().then((win) => {
        win.localStorage.setItem('mock_user_plan', 'enterprise');
      });
      cy.visit('/');
      cy.contains('Scanner').click();
    });

    it('should display scanner compliance interface', () => {
      cy.contains('Scanner & Compliance').should('be.visible');
      cy.contains('Advanced scanning, compliance monitoring, and forensics').should('be.visible');
    });

    it('should show all compliance tabs', () => {
      cy.contains('Scanner').should('be.visible');
      cy.contains('MM Sentinel').should('be.visible');
      cy.contains('AI Forensics').should('be.visible');
      cy.contains('Compliance').should('be.visible');
    });

    context('Scanner Tab', () => {
      it('should display scanner interface', () => {
        cy.contains('Scanner').click();
        cy.contains('Wallet Scanner').should('be.visible');
        cy.get('input[placeholder*="address"]').should('be.visible');
      });

      it('should perform wallet scan', () => {
        cy.contains('Scanner').click();
        cy.get('input[placeholder*="address"]').type('0x742d35Cc6aB3C0532C4C2C0532C4C2C0532C4C25a3');
        cy.contains('Scan').click();
        cy.contains('Scanning...').should('be.visible');
      });
    });

    context('Market Maker Sentinel Tab', () => {
      beforeEach(() => {
        cy.contains('MM Sentinel').click();
      });

      it('should display market maker flow sentinel', () => {
        cy.contains('Market Maker Flow Sentinel').should('be.visible');
        cy.contains('Real-time CEX to Market Maker flow monitoring').should('be.visible');
      });

      it('should show flow metrics', () => {
        cy.contains('Flows Detected').should('be.visible');
        cy.contains('ML Signals').should('be.visible');
        cy.contains('Total Volume').should('be.visible');
        cy.contains('Strong Signals').should('be.visible');
      });

      it('should trigger sentinel scan', () => {
        cy.contains('Scan Now').click();
        cy.contains('Scanning...').should('be.visible');
      });

      it('should display flow cards', () => {
        cy.get('[data-testid="flow-card"]').should('have.length.at.least', 0);
      });
    });

    context('AI Forensics Tab', () => {
      beforeEach(() => {
        cy.contains('AI Forensics').click();
      });

      it('should display forensics interface', () => {
        cy.contains('AI Forensics').should('be.visible');
        cy.contains('Advanced AI-powered forensics').should('be.visible');
      });
    });

    context('Compliance Tab', () => {
      beforeEach(() => {
        cy.contains('Compliance').click();
      });

      it('should display compliance suite', () => {
        cy.contains('Compliance Suite').should('be.visible');
        cy.contains('Sanctions screening, audit trails').should('be.visible');
      });
    });
  });

  context('Non-Enterprise User Access', () => {
    beforeEach(() => {
      cy.window().then((win) => {
        win.localStorage.setItem('mock_user_plan', 'premium');
      });
      cy.visit('/');
      cy.contains('Scanner').click();
    });

    it('should show enterprise upgrade prompt', () => {
      cy.contains('Scanner & Compliance Suite').should('be.visible');
      cy.contains('Upgrade to Enterprise').should('be.visible');
    });

    it('should redirect to subscription on upgrade click', () => {
      cy.contains('Upgrade Now').click();
      cy.url().should('include', '/subscription');
    });
  });

  context('Free User Access', () => {
    beforeEach(() => {
      cy.window().then((win) => {
        win.localStorage.setItem('mock_user_plan', 'free');
      });
      cy.visit('/');
      cy.contains('Scanner').click();
    });

    it('should show enterprise upgrade prompt for free users', () => {
      cy.contains('Upgrade to Enterprise').should('be.visible');
    });
  });
});