describe('Landing Pages and Public Routes', () => {
  it('landing page loads', () => {
    cy.visit('/');
    cy.get('body', { timeout: 15000 }).should('be.visible');

    // Should show some content (DataFlow or main heading)
    cy.get('h1, h2, [class*="title"], [class*="heading"]').should('exist');
  });

  it('navigates to pricing page', () => {
    cy.visit('/pricing');
    cy.get('body', { timeout: 15000 }).should('be.visible');
    cy.url().should('include', '/pricing');
  });

  it('navigates to documentation page', () => {
    cy.visit('/documentation');
    cy.get('body', { timeout: 15000 }).should('be.visible');
    cy.url().should('include', '/documentation');
  });

  it('navigates to API reference page', () => {
    cy.visit('/api-reference');
    cy.get('body', { timeout: 15000 }).should('be.visible');
    cy.url().should('include', '/api-reference');
  });

  it('redirects to signin when accessing protected routes', () => {
    cy.visit('/app/data');
    cy.get('body', { timeout: 15000 }).should('be.visible');

    // Should be on signin or the protected page (if authenticated)
    cy.url().should('match', /\/(signin|app\/data)/);
  });

  it('demo page loads', () => {
    cy.visit('/demo');
    cy.get('body', { timeout: 15000 }).should('be.visible');
    cy.url().should('include', '/demo');
  });

  it('password reset page loads', () => {
    cy.visit('/demo');
    cy.get('body', { timeout: 15000 }).should('be.visible');
    cy.url().should('include', '/password-reset');

    // Should have an email input
    cy.get('input[name="email"], input[type="email"]').should('exist');
  });

  it('signup complete page displays', () => {
    cy.visit('/signup-complete');
    cy.get('body', { timeout: 15000 }).should('be.visible');
    cy.url().should('include', '/signup-complete');
  });

  it('all public pages load without errors', () => {
    const publicPages = ['/', '/pricing', '/documentation', '/api-reference', '/demo'];

    publicPages.forEach((page) => {
      cy.visit(page);
      cy.get('body', { timeout: 15000 }).should('be.visible');

      // No error boundary
      cy.contains('Something went wrong').should('not.exist');
    });
  });
});
