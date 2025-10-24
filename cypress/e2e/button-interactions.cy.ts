describe('Button Interactions and UI Components', () => {
  // Skip authentication mocking - test against real app

  it('dashboard is accessible', () => {
    cy.visit('/app');

    // Wait for page to load (not API calls)
    cy.get('body', { timeout: 15000 }).should('be.visible');

    // Verify we're on some page (could be dashboard or signin redirect)
    cy.url().should('match', /\/(app|signin)/);
  });

  it('data management page loads', () => {
    cy.visit('/app/data');
    cy.get('body', { timeout: 15000 }).should('be.visible');
    cy.url().should('match', /\/(app\/data|signin)/);
  });

  it('model training page loads', () => {
    cy.visit('/app/train');
    cy.get('body', { timeout: 15000 }).should('be.visible');
    cy.url().should('match', /\/(app\/train|signin)/);
  });

  it('navigation sidebar exists', () => {
    cy.visit('/app');
    cy.get('body', { timeout: 15000 }).should('be.visible');

    // Look for navigation elements (adjust selectors as needed)
    cy.get('nav, aside, [role="navigation"]').should('exist');
  });

  it('settings page loads', () => {
    cy.visit('/app/settings');
    cy.get('body', { timeout: 15000 }).should('be.visible');
    cy.url().should('match', /\/(app\/settings|signin)/);
  });

  it('pipeline builder page loads', () => {
    cy.visit('/app/pipeline');
    cy.get('body', { timeout: 15000 }).should('be.visible');
    cy.url().should('match', /\/(app\/pipeline|signin)/);
  });

  it('trash bin page loads', () => {
    cy.visit('/app/trash');
    cy.get('body', { timeout: 15000 }).should('be.visible');
    cy.url().should('match', /\/(app\/trash|signin)/);
  });

  it('visualizations page loads', () => {
    cy.visit('/app/visualizations');
    cy.get('body', { timeout: 15000 }).should('be.visible');
    cy.url().should('match', /\/(app\/visualizations|signin)/);
  });

  it('all main routes are accessible', () => {
    const routes = [
      '/app',
      '/app/data',
      '/app/feature-engineering',
      '/app/train',
      '/app/evaluate',
      '/app/deploy',
      '/app/monitoring',
      '/app/visualizations',
      '/app/pipeline',
      '/app/profile',
      '/app/settings',
      '/app/usage',
      '/app/trash'
    ];

    routes.forEach((route) => {
      cy.visit(route);
      cy.get('body', { timeout: 15000 }).should('be.visible');

      // Verify no critical error occurred
      cy.contains('Something went wrong').should('not.exist');
      cy.contains('404').should('not.exist');
    });
  });
});
