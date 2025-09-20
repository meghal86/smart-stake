describe('UI Redesign - Responsive Design', () => {
  const viewports = [
    { name: 'Mobile', width: 375, height: 667 },
    { name: 'Tablet', width: 768, height: 1024 },
    { name: 'Desktop', width: 1920, height: 1080 }
  ];

  viewports.forEach(viewport => {
    context(`${viewport.name} (${viewport.width}x${viewport.height})`, () => {
      beforeEach(() => {
        cy.viewport(viewport.width, viewport.height);
        cy.visit('/');
      });

      it('should display navigation correctly', () => {
        cy.get('[data-testid="bottom-navigation"]').should('be.visible');
        cy.contains('Alerts').should('be.visible');
        cy.contains('Market').should('be.visible');
        cy.contains('Predictions').should('be.visible');
      });

      it('should navigate between pages', () => {
        cy.contains('Market').click();
        cy.contains('Market Dashboard').should('be.visible');
        
        cy.contains('Predictions').click();
        cy.contains('Predictions & Scenarios').should('be.visible');
      });

      if (viewport.name === 'Mobile') {
        it('should show mobile-specific elements', () => {
          // Test FAB for scenario builder
          cy.window().then((win) => {
            win.localStorage.setItem('mock_user_plan', 'premium');
          });
          cy.contains('Predictions').click();
          cy.contains('Scenarios').click();
          cy.get('[data-testid="mobile-fab"]').should('be.visible');
        });

        it('should use mobile drawer for explainability', () => {
          cy.window().then((win) => {
            win.localStorage.setItem('mock_user_plan', 'premium');
          });
          cy.contains('Predictions').click();
          cy.contains('View Details').first().click();
          cy.get('[data-testid="mobile-drawer"]').should('be.visible');
        });

        it('should stack cards vertically', () => {
          cy.get('[data-testid="card-container"]').should('have.css', 'flex-direction', 'column');
        });
      }

      if (viewport.name === 'Desktop') {
        it('should show desktop-specific elements', () => {
          cy.window().then((win) => {
            win.localStorage.setItem('mock_user_plan', 'premium');
          });
          cy.contains('Predictions').click();
          cy.contains('View Details').first().click();
          cy.get('[data-testid="desktop-drawer"]').should('be.visible');
        });

        it('should use grid layouts', () => {
          cy.get('[data-testid="grid-container"]').should('have.css', 'display', 'grid');
        });
      }

      it('should have touch-friendly targets', () => {
        cy.get('button').each(($btn) => {
          cy.wrap($btn).should('have.css', 'min-height').and('match', /^([4-9]\d|\d{3,})px$/);
        });
      });

      it('should handle text overflow', () => {
        cy.get('[data-testid="text-content"]').should('have.css', 'overflow', 'hidden');
      });
    });
  });

  context('Orientation Changes', () => {
    it('should handle landscape orientation on mobile', () => {
      cy.viewport(667, 375); // Landscape mobile
      cy.visit('/');
      cy.contains('Whale Alerts').should('be.visible');
      cy.get('[data-testid="bottom-navigation"]').should('be.visible');
    });

    it('should handle portrait orientation on tablet', () => {
      cy.viewport(768, 1024); // Portrait tablet
      cy.visit('/');
      cy.contains('Market').click();
      cy.contains('Market Dashboard').should('be.visible');
    });
  });

  context('Touch Interactions', () => {
    beforeEach(() => {
      cy.viewport(375, 667);
      cy.visit('/');
    });

    it('should handle tap interactions', () => {
      cy.get('[data-testid="nav-tab"]').first().trigger('touchstart');
      cy.get('[data-testid="nav-tab"]').first().trigger('touchend');
    });

    it('should handle swipe gestures', () => {
      cy.get('[data-testid="swipeable-content"]')
        .trigger('touchstart', { touches: [{ clientX: 100, clientY: 100 }] })
        .trigger('touchmove', { touches: [{ clientX: 200, clientY: 100 }] })
        .trigger('touchend');
    });

    it('should prevent zoom on double tap', () => {
      cy.get('meta[name="viewport"]').should('have.attr', 'content').and('include', 'user-scalable=no');
    });
  });

  context('Performance on Different Devices', () => {
    it('should load quickly on mobile', () => {
      cy.viewport(375, 667);
      const start = Date.now();
      cy.visit('/');
      cy.contains('Whale Alerts').should('be.visible').then(() => {
        const loadTime = Date.now() - start;
        expect(loadTime).to.be.lessThan(3000); // 3 seconds
      });
    });

    it('should handle slow connections', () => {
      cy.intercept('**/*', { delay: 1000 }); // Simulate slow network
      cy.viewport(375, 667);
      cy.visit('/');
      cy.get('[data-testid="loading-skeleton"]').should('be.visible');
      cy.contains('Whale Alerts').should('be.visible');
    });
  });

  context('Accessibility on Mobile', () => {
    beforeEach(() => {
      cy.viewport(375, 667);
      cy.visit('/');
    });

    it('should have proper focus management', () => {
      cy.get('button').first().focus();
      cy.focused().should('have.attr', 'tabindex', '0');
    });

    it('should support keyboard navigation', () => {
      cy.get('body').type('{tab}');
      cy.focused().should('be.visible');
    });

    it('should have proper ARIA labels', () => {
      cy.get('[data-testid="nav-tab"]').should('have.attr', 'aria-label');
      cy.get('button').should('have.attr', 'aria-label').or('have.text');
    });
  });
});