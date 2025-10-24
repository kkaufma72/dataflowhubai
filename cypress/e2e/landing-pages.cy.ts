describe('Landing Pages and Public Routes', () => {
  it('displays landing page', () => {
    cy.visit('/');

    // Check main heading or content
    cy.contains('DataFlowHub').should('be.visible');
  });

  it('navigates to pricing page', () => {
    cy.visit('/pricing');

    cy.contains('Pricing').should('be.visible');
  });

  it('navigates to documentation page', () => {
    cy.visit('/documentation');

    cy.url().should('include', '/documentation');
  });

  it('navigates to API reference page', () => {
    cy.visit('/api-reference');

    cy.url().should('include', '/api-reference');
  });

  it('redirects to signin when accessing protected routes', () => {
    cy.visit('/app/data');

    // Should redirect to signin
    cy.url().should('include', '/signin');
  });

  it('displays demo page', () => {
    cy.visit('/demo');

    cy.url().should('include', '/demo');
  });

  it('password reset page loads correctly', () => {
    cy.visit('/password-reset');

    cy.contains('Reset Password').should('be.visible');
    cy.get('input[name="email"]').should('be.visible');
  });

  it('signup complete page displays', () => {
    cy.visit('/signup-complete');

    cy.url().should('include', '/signup-complete');
  });
});
