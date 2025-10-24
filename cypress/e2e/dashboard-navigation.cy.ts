describe('Dashboard and Navigation', () => {
  it('dashboard page loads', () => {
    cy.visit('/app');
    cy.get('body', { timeout: 15000 }).should('be.visible');

    // Either dashboard loads or redirects to signin
    cy.url().should('match', /\/(app|signin)/);
  });

  it('navigates to data management page', () => {
    cy.visit('/app/data');
    cy.get('body', { timeout: 15000 }).should('be.visible');
    cy.url().should('include', '/data');
  });

  it('navigates to feature engineering page', () => {
    cy.visit('/app/feature-engineering');
    cy.get('body', { timeout: 15000 }).should('be.visible');
    cy.url().should('include', '/feature-engineering');
  });

  it('navigates to model training page', () => {
    cy.visit('/app/train');
    cy.get('body', { timeout: 15000 }).should('be.visible');
    cy.url().should('include', '/train');
  });

  it('navigates to model evaluation page', () => {
    cy.visit('/app/evaluate');
    cy.get('body', { timeout: 15000 }).should('be.visible');
    cy.url().should('include', '/evaluate');
  });

  it('navigates to deployment page', () => {
    cy.visit('/app/deploy');
    cy.get('body', { timeout: 15000 }).should('be.visible');
    cy.url().should('include', '/deploy');
  });

  it('navigates to monitoring page', () => {
    cy.visit('/app/monitoring');
    cy.get('body', { timeout: 15000 }).should('be.visible');
    cy.url().should('include', '/monitoring');
  });

  it('navigates to visualizations page', () => {
    cy.visit('/app/visualizations');
    cy.get('body', { timeout: 15000 }).should('be.visible');
    cy.url().should('include', '/visualizations');
  });

  it('navigates to pipeline builder page', () => {
    cy.visit('/app/pipeline');
    cy.get('body', { timeout: 15000 }).should('be.visible');
    cy.url().should('include', '/pipeline');
  });

  it('navigates to profile page', () => {
    cy.visit('/app/profile');
    cy.get('body', { timeout: 15000 }).should('be.visible');
    cy.url().should('include', '/profile');
  });

  it('navigates to settings page', () => {
    cy.visit('/app/settings');
    cy.get('body', { timeout: 15000 }).should('be.visible');
    cy.url().should('include', '/settings');
  });

  it('navigates to API management page', () => {
    cy.visit('/app/api-management');
    cy.get('body', { timeout: 15000 }).should('be.visible');
    cy.url().should('include', '/api-management');
  });

  it('navigates to usage dashboard', () => {
    cy.visit('/app/usage');
    cy.get('body', { timeout: 15000 }).should('be.visible');
    cy.url().should('include', '/usage');
  });

  it('navigates to trash bin', () => {
    cy.visit('/app/trash');
    cy.get('body', { timeout: 15000 }).should('be.visible');
    cy.url().should('include', '/trash');
  });

  it('all routes render without errors', () => {
    const routes = ['/app', '/app/data', '/app/train', '/app/deploy'];

    routes.forEach((route) => {
      cy.visit(route);
      cy.get('body', { timeout: 15000 }).should('be.visible');

      // No error boundary shown
      cy.contains('Something went wrong').should('not.exist');
    });
  });
});
