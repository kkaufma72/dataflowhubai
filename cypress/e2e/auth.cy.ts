describe('Authentication', () => {
  beforeEach(() => {
    // Intercept auth API calls
    cy.intercept('POST', '**/auth/v1/token?grant_type=password', {
      statusCode: 200,
      body: {
        access_token: 'fake-access-token',
        token_type: 'bearer',
        expires_in: 3600,
        refresh_token: 'fake-refresh-token',
        user: {
          id: 'test-user-id',
          email: 'test@example.com',
        },
      },
    }).as('signIn');

    cy.intercept('GET', '**/auth/v1/user', {
      statusCode: 200,
      body: {
        id: 'test-user-id',
        email: 'test@example.com',
      },
    }).as('getUser');
  });

  it('should allow a user to sign in', () => {
    cy.visit('/signin');
    
    // Fill in the form
    cy.get('input[name="email"]').type('test@example.com');
    cy.get('input[name="password"]').type('password123');
    
    // Submit the form
    cy.get('button[type="submit"]').click();
    
    // Wait for the API call
    cy.wait('@signIn');
    
    // Should redirect to dashboard
    cy.url().should('include', '/app');
    
    // Should display the dashboard
    cy.contains('Welcome to DataFlowHub AI').should('be.visible');
  });

  it('should show error message for invalid credentials', () => {
    // Override the intercept for this test
    cy.intercept('POST', '**/auth/v1/token?grant_type=password', {
      statusCode: 400,
      body: {
        error: 'Invalid login credentials',
        error_description: 'Invalid login credentials',
      },
    }).as('signInError');

    cy.visit('/signin');
    
    // Fill in the form
    cy.get('input[name="email"]').type('wrong@example.com');
    cy.get('input[name="password"]').type('wrongpassword');
    
    // Submit the form
    cy.get('button[type="submit"]').click();
    
    // Wait for the API call
    cy.wait('@signInError');
    
    // Should show error message
    cy.contains('Invalid email or password').should('be.visible');
    
    // Should stay on the sign in page
    cy.url().should('include', '/signin');
  });

  it('should allow a user to sign up', () => {
    // Intercept sign up API call
    cy.intercept('POST', '**/auth/v1/signup', {
      statusCode: 200,
      body: {
        id: 'new-user-id',
        email: 'new@example.com',
      },
    }).as('signUp');

    cy.visit('/signin');
    
    // Switch to sign up mode
    cy.contains('Sign up').click();
    
    // Fill in the form
    cy.get('input[name="fullName"]').type('New User');
    cy.get('input[name="email"]').type('new@example.com');
    cy.get('input[name="password"]').type('Password123');
    
    // Submit the form
    cy.get('button[type="submit"]').click();
    
    // Wait for the API call
    cy.wait('@signUp');
    
    // Should show success message
    cy.contains('Sign up successful').should('be.visible');
  });

  it('should redirect to requested page after sign in', () => {
    // Visit a protected page
    cy.visit('/app/data');
    
    // Should redirect to sign in
    cy.url().should('include', '/signin');
    
    // Fill in the form
    cy.get('input[name="email"]').type('test@example.com');
    cy.get('input[name="password"]').type('password123');
    
    // Submit the form
    cy.get('button[type="submit"]').click();
    
    // Wait for the API call
    cy.wait('@signIn');
    
    // Should redirect to the originally requested page
    cy.url().should('include', '/app/data');
  });

  it('should allow password reset request', () => {
    // Intercept password reset API call
    cy.intercept('POST', '**/auth/v1/recover', {
      statusCode: 200,
      body: {},
    }).as('passwordReset');

    cy.visit('/password-reset');
    
    // Fill in the form
    cy.get('input[name="email"]').type('test@example.com');
    
    // Submit the form
    cy.get('button[type="submit"]').click();
    
    // Wait for the API call
    cy.wait('@passwordReset');
    
    // Should show success message
    cy.contains('Check your email').should('be.visible');
  });
});