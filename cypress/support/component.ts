// Cypress component testing support

import './commands';
import { mount } from 'cypress/react18';

// Mount command for React components
Cypress.Commands.add('mount', mount);

// Global component test setup
beforeEach(() => {
  // Mock localStorage for component tests
  cy.window().then((win) => {
    win.localStorage.clear();
    win.localStorage.setItem('mock_user_plan', 'premium');
  });
});

declare global {
  namespace Cypress {
    interface Chainable {
      mount: typeof mount;
    }
  }
}