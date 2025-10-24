describe('Model Training and Deployment Workflow', () => {
  it('model training page is accessible', () => {
    cy.visit('/app/train');
    cy.get('body', { timeout: 15000 }).should('be.visible');
    cy.url().should('match', /\/(app\/train|signin)/);
  });

  it('model evaluation page is accessible', () => {
    cy.visit('/app/evaluate');
    cy.get('body', { timeout: 15000 }).should('be.visible');
    cy.url().should('match', /\/(app\/evaluate|signin)/);
  });

  it('deployment page is accessible', () => {
    cy.visit('/app/deploy');
    cy.get('body', { timeout: 15000 }).should('be.visible');
    cy.url().should('match', /\/(app\/deploy|signin)/);
  });

  it('monitoring page is accessible', () => {
    cy.visit('/app/monitoring');
    cy.get('body', { timeout: 15000 }).should('be.visible');
    cy.url().should('match', /\/(app\/monitoring|signin)/);
  });

  it('feature engineering page is accessible', () => {
    cy.visit('/app/feature-engineering');
    cy.get('body', { timeout: 15000 }).should('be.visible');
    cy.url().should('match', /\/(app\/feature-engineering|signin)/);
  });

  it('ML workflow pages load without errors', () => {
    const mlPages = [
      '/app/train',
      '/app/evaluate',
      '/app/deploy',
      '/app/monitoring',
      '/app/feature-engineering'
    ];

    mlPages.forEach((page) => {
      cy.visit(page);
      cy.get('body', { timeout: 15000 }).should('be.visible');

      // Verify no critical errors
      cy.contains('Something went wrong').should('not.exist');
      cy.contains('404').should('not.exist');
    });
  });
});
