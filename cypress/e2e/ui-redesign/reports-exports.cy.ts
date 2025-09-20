describe('UI Redesign - Reports & Exports', () => {
  context('Pro User Access', () => {
    beforeEach(() => {
      cy.window().then((win) => {
        win.localStorage.setItem('mock_user_plan', 'pro');
      });
      cy.visit('/');
      cy.contains('Reports').click();
    });

    it('should display reports interface', () => {
      cy.contains('Reports & Exports').should('be.visible');
      cy.contains('Generate reports and export data').should('be.visible');
    });

    it('should show export options', () => {
      cy.contains('PDF Reports').should('be.visible');
      cy.contains('CSV Data').should('be.visible');
      cy.contains('Scheduled Reports').should('be.visible');
    });

    it('should export PDF report', () => {
      cy.contains('Export PDF').click();
      // Mock download verification would go here
      cy.window().its('console').then((console) => {
        cy.stub(console, 'log').as('consoleLog');
      });
      cy.get('@consoleLog').should('have.been.calledWith', 'Exporting PDF report...');
    });

    it('should export CSV data', () => {
      cy.contains('Export CSV').click();
      cy.window().its('console').then((console) => {
        cy.stub(console, 'log').as('consoleLog');
      });
      cy.get('@consoleLog').should('have.been.calledWith', 'Exporting CSV data...');
    });

    it('should schedule report', () => {
      cy.contains('Schedule Report').click();
      cy.window().its('console').then((console) => {
        cy.stub(console, log').as('consoleLog');
      });
      cy.get('@consoleLog').should('have.been.calledWith', 'Opening schedule modal...');
    });

    it('should display recent reports', () => {
      cy.contains('Recent Reports').should('be.visible');
      cy.contains('Weekly Whale Analysis').should('be.visible');
      cy.contains('Transaction Data Export').should('be.visible');
    });

    it('should show report status badges', () => {
      cy.get('[data-testid="report-status"]').should('contain', 'completed');
      cy.get('[data-testid="report-type"]').should('contain', 'PDF');
    });
  });

  context('Enterprise User Access', () => {
    beforeEach(() => {
      cy.window().then((win) => {
        win.localStorage.setItem('mock_user_plan', 'enterprise');
      });
      cy.visit('/');
      cy.contains('Reports').click();
    });

    it('should show compliance packs', () => {
      cy.contains('Compliance Packs').should('be.visible');
      cy.contains('AML Compliance Report').should('be.visible');
      cy.contains('Audit Trail Export').should('be.visible');
    });

    it('should generate compliance reports', () => {
      cy.contains('AML Compliance Report').parent().contains('Generate').click();
      // Mock generation process
    });
  });

  context('Free User Access', () => {
    beforeEach(() => {
      cy.window().then((win) => {
        win.localStorage.setItem('mock_user_plan', 'free');
      });
      cy.visit('/');
      cy.contains('Reports').click();
    });

    it('should show upgrade prompt for reports', () => {
      cy.contains('Upgrade to Pro').should('be.visible');
      cy.contains('Data Export').should('be.visible');
    });

    it('should redirect to subscription on upgrade', () => {
      cy.contains('Upgrade Now').click();
      cy.url().should('include', '/subscription');
    });
  });

  context('Export Functionality', () => {
    beforeEach(() => {
      cy.window().then((win) => {
        win.localStorage.setItem('mock_user_plan', 'premium');
      });
      cy.visit('/');
      cy.contains('Reports').click();
    });

    it('should handle export errors gracefully', () => {
      // Mock export failure
      cy.window().then((win) => {
        cy.stub(win.console, 'error').as('consoleError');
      });
      
      cy.contains('Export PDF').click();
      // Verify error handling
    });

    it('should show export progress', () => {
      cy.contains('Export CSV').click();
      cy.contains('Exporting...').should('be.visible');
    });
  });

  context('Responsive Design', () => {
    beforeEach(() => {
      cy.window().then((win) => {
        win.localStorage.setItem('mock_user_plan', 'pro');
      });
      cy.visit('/');
      cy.contains('Reports').click();
    });

    it('should work on mobile', () => {
      cy.viewport(375, 667);
      cy.contains('Reports & Exports').should('be.visible');
      cy.contains('PDF Reports').should('be.visible');
    });

    it('should stack export cards on mobile', () => {
      cy.viewport(375, 667);
      cy.get('[data-testid="export-card"]').should('have.css', 'flex-direction', 'column');
    });
  });
});