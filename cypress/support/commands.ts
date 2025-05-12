// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

// -- This is a parent command --
Cypress.Commands.add('login', (email, password) => {
  cy.visit('/signin');
  cy.get('input[name="email"]').type(email);
  cy.get('input[name="password"]').type(password);
  cy.get('button[type="submit"]').click();
  cy.url().should('include', '/app');
});

// -- This is a child command --
Cypress.Commands.add('dragAndDrop', { prevSubject: 'element' }, (subject, targetSelector) => {
  cy.wrap(subject)
    .trigger('mousedown', { which: 1 })
    .trigger('mousemove', { clientX: 100, clientY: 100 })
    .then(() => {
      cy.get(targetSelector)
        .trigger('mousemove')
        .trigger('mouseup', { force: true });
    });
});

// -- This is a dual command --
Cypress.Commands.add('uploadFile', (selector, fileName, fileType = 'text/csv') => {
  cy.fixture(fileName, 'binary')
    .then(Cypress.Blob.binaryStringToBlob)
    .then(blob => {
      const file = new File([blob], fileName, { type: fileType });
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);

      cy.get(selector).then(input => {
        const inputElement = input[0];
        inputElement.files = dataTransfer.files;
        cy.wrap(input).trigger('change', { force: true });
      });
    });
});

// -- This will overwrite an existing command --
// Cypress.Commands.overwrite('visit', (originalFn, url, options) => { ... })

// Declare global Cypress namespace to add custom commands
declare global {
  namespace Cypress {
    interface Chainable {
      login(email: string, password: string): Chainable<void>;
      dragAndDrop(targetSelector: string): Chainable<Element>;
      uploadFile(selector: string, fileName: string, fileType?: string): Chainable<void>;
    }
  }
}

export {};