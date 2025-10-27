// E2E Tests for Stripe Payment and Account Creation Flow

describe('Stripe Integration and Account Creation', () => {
  
  describe('Account Signup Flow', () => {
    beforeEach(() => {
      cy.visit('/signin');
    });

    it('should display enhanced signup form with all fields', () => {
      // Switch to signup mode
      cy.contains('button', 'Sign up').click();
      
      // Check all form fields are present
      cy.get('input[name="fullName"]').should('be.visible');
      cy.get('input[name="company"]').should('be.visible');
      cy.get('input[name="jobTitle"]').should('be.visible');
      cy.get('input[name="linkedinUrl"]').should('be.visible');
      cy.get('select[name="useCase"]').should('be.visible');
      cy.get('input[name="email"]').should('be.visible');
      cy.get('input[name="password"]').should('be.visible');
    });

    it('should validate required fields', () => {
      cy.contains('button', 'Sign up').click();
      
      // Try to submit empty form
      cy.get('button[type="submit"]').click();
      
      // Should show validation errors
      cy.contains('Please fill in all required fields').should('be.visible');
    });

    it('should validate email format', () => {
      cy.contains('button', 'Sign up').click();
      
      // Fill with invalid email
      cy.get('input[name="fullName"]').type('Test User');
      cy.get('select[name="useCase"]').select('accounting');
      cy.get('input[name="email"]').type('invalid@test.com'); // Blocked domain
      cy.get('input[name="password"]').type('password123');
      
      cy.get('button[type="submit"]').click();
      
      // Should show email validation error
      cy.contains('Please use a real email address').should('be.visible');
    });

    it('should validate password length', () => {
      cy.contains('button', 'Sign up').click();
      
      cy.get('input[name="fullName"]').type('Test User');
      cy.get('select[name="useCase"]').select('accounting');
      cy.get('input[name="email"]').type('test@gmail.com');
      cy.get('input[name="password"]').type('short'); // Too short
      
      cy.get('button[type="submit"]').click();
      
      cy.contains('Password must be at least 8 characters').should('be.visible');
    });

    it('should successfully create account with all profile data', () => {
      // Intercept Supabase signup
      cy.intercept('POST', '**/auth/v1/signup', {
        statusCode: 200,
        body: {
          user: {
            id: 'new-user-123',
            email: 'testuser@gmail.com',
            user_metadata: {
              full_name: 'Test User',
              company: 'Test Company',
              job_title: 'Marketing Manager',
              use_case: 'marketing-analytics'
            }
          }
        }
      }).as('signup');

      cy.contains('button', 'Sign up').click();
      
      // Fill complete form
      cy.get('input[name="fullName"]').type('Test User');
      cy.get('input[name="company"]').type('Test Company');
      cy.get('input[name="jobTitle"]').type('Marketing Manager');
      cy.get('input[name="linkedinUrl"]').type('https://linkedin.com/in/testuser');
      cy.get('select[name="useCase"]').select('marketing-analytics');
      cy.get('input[name="email"]').type('testuser@gmail.com');
      cy.get('input[name="password"]').type('TestPassword123');
      
      cy.get('button[type="submit"]').click();
      
      cy.wait('@signup');
      
      // Should show success message
      cy.contains('Account created successfully').should('be.visible');
      
      // Should switch to sign-in mode
      cy.get('input[name="email"]').should('have.value', 'testuser@gmail.com');
    });

    it('should show 27 use case options grouped by category', () => {
      cy.contains('button', 'Sign up').click();
      
      cy.get('select[name="useCase"]').click();
      
      // Check optgroups exist
      cy.get('optgroup[label="💼 Business & Finance"]').should('exist');
      cy.get('optgroup[label="🏢 Industry-Specific"]').should('exist');
      cy.get('optgroup[label="📊 Analytics & Insights"]').should('exist');
      cy.get('optgroup[label="🎯 Personal Use"]').should('exist');
      cy.get('optgroup[label="🔬 Advanced"]').should('exist');
      
      // Check specific options
      cy.get('option[value="accounting"]').should('exist');
      cy.get('option[value="real-estate"]').should('exist');
      cy.get('option[value="marketing-analytics"]').should('exist');
      cy.get('option[value="personal-finance"]').should('exist');
    });
  });

  describe('Stripe Checkout Flow', () => {
    beforeEach(() => {
      // Mock authenticated user
      cy.intercept('GET', '**/auth/v1/user', {
        statusCode: 200,
        body: {
          id: 'test-user-id',
          email: 'test@example.com',
          user_metadata: {
            full_name: 'Test User',
            use_case: 'business-analytics'
          }
        }
      });
    });

    it('should display pricing plans', () => {
      cy.visit('/pricing');
      
      // Check all pricing tiers are visible
      cy.contains('Free').should('be.visible');
      cy.contains('Professional').should('be.visible');
      cy.contains('Team').should('be.visible');
      
      // Check prices
      cy.contains('$0').should('be.visible');
      cy.contains('$49').should('be.visible');
      cy.contains('$149').should('be.visible');
    });

    it('should start checkout for Pro plan when logged in', () => {
      // Intercept Stripe checkout creation
      cy.intercept('POST', '**/functions/v1/create-checkout-session', {
        statusCode: 200,
        body: {
          url: 'https://checkout.stripe.com/test-session-123'
        }
      }).as('createCheckout');

      cy.visit('/pricing');
      
      // Click on Pro plan CTA
      cy.contains('Professional').parent().within(() => {
        cy.contains('button', 'Start free trial').click();
      });
      
      // Should call checkout API
      cy.wait('@createCheckout').its('request.body').should('deep.include', {
        tier: 'professional',
        billing: 'monthly'
      });
    });

    it('should show email modal for unauthenticated users', () => {
      // Override to unauthenticated
      cy.intercept('GET', '**/auth/v1/user', {
        statusCode: 401
      });

      cy.visit('/pricing');
      
      cy.contains('Professional').parent().within(() => {
        cy.contains('button', 'Start free trial').click();
      });
      
      // Should show email modal
      cy.contains('Enter your email to continue').should('be.visible');
      cy.get('input[type="email"]').should('be.visible');
    });

    it('should handle annual vs monthly billing toggle', () => {
      cy.visit('/pricing');
      
      // Check monthly is selected by default
      cy.contains('Professional').parent().within(() => {
        cy.contains('$49').should('be.visible');
        
        // Switch to annual
        cy.contains('button', 'Annual').click();
        
        // Price should change (annual equivalent shown)
        cy.contains('/year').should('be.visible');
      });
    });

    it('should redirect to stripe checkout when session URL returned', () => {
      cy.intercept('POST', '**/functions/v1/create-checkout-session', {
        statusCode: 200,
        body: {
          url: 'https://checkout.stripe.com/test-session-123'
        }
      }).as('createCheckout');

      cy.visit('/pricing');
      
      cy.contains('Professional').parent().within(() => {
        cy.contains('button', 'Start free trial').click();
      });
      
      cy.wait('@createCheckout');
      
      // Note: Can't actually redirect to Stripe in test
      // but we can verify the call was made
    });
  });

  describe('Complete User Journey', () => {
    it('should complete full signup → dashboard → upgrade flow', () => {
      // Step 1: Sign up
      cy.intercept('POST', '**/auth/v1/signup', {
        statusCode: 200,
        body: {
          user: {
            id: 'journey-user-123',
            email: 'journey@gmail.com',
            user_metadata: {
              full_name: 'Journey User',
              company: 'Test Co',
              job_title: 'Data Analyst',
              use_case: 'business-analytics'
            }
          }
        }
      }).as('signup');

      cy.visit('/signin');
      cy.contains('button', 'Sign up').click();
      
      cy.get('input[name="fullName"]').type('Journey User');
      cy.get('input[name="company"]').type('Test Co');
      cy.get('input[name="jobTitle"]').type('Data Analyst');
      cy.get('select[name="useCase"]').select('business-analytics');
      cy.get('input[name="email"]').type('journey@gmail.com');
      cy.get('input[name="password"]').type('JourneyPass123');
      
      cy.get('button[type="submit"]').click();
      cy.wait('@signup');
      
      // Step 2: Sign in
      cy.intercept('POST', '**/auth/v1/token?grant_type=password', {
        statusCode: 200,
        body: {
          access_token: 'journey-token',
          user: {
            id: 'journey-user-123',
            email: 'journey@gmail.com'
          }
        }
      }).as('signin');

      cy.contains('Account created successfully').should('be.visible');
      
      // Should be on signin mode
      cy.get('input[name="password"]').type('JourneyPass123');
      cy.get('button[type="submit"]').click();
      cy.wait('@signin');
      
      // Step 3: Dashboard
      cy.url().should('include', '/app');
      
      // Step 4: Navigate to pricing from dashboard
      cy.visit('/pricing');
      
      // Step 5: Start checkout
      cy.intercept('POST', '**/functions/v1/create-checkout-session', {
        statusCode: 200,
        body: {
          url: 'https://checkout.stripe.com/session-123'
        }
      }).as('checkout');

      cy.contains('Professional').parent().within(() => {
        cy.contains('button', 'Start free trial').click();
      });
      
      cy.wait('@checkout');
      
      // Journey complete!
    });
  });

  describe('Magic Moment Onboarding', () => {
    it('should show Magic Moment modal for new users with no datasets', () => {
      // Mock empty datasets
      cy.intercept('GET', '**/rest/v1/datasets*', {
        statusCode: 200,
        body: []
      });

      cy.intercept('GET', '**/auth/v1/user', {
        statusCode: 200,
        body: {
          id: 'new-user',
          email: 'new@example.com',
          user_metadata: {
            full_name: 'New User',
            use_case: 'marketing-analytics'
          }
        }
      });

      cy.visit('/app');
      
      // Magic Moment should appear after delay
      cy.contains('Welcome', { timeout: 3000 }).should('be.visible');
      cy.contains('60 seconds').should('be.visible');
      
      // Should show sample datasets
      cy.contains('Sales Data').should('be.visible');
      cy.contains('Customer Data').should('be.visible');
    });

    it('should not show Magic Moment if user has datasets', () => {
      cy.intercept('GET', '**/rest/v1/datasets*', {
        statusCode: 200,
        body: [{
          id: '1',
          name: 'Existing Dataset',
          rows: 100,
          columns: 5
        }]
      });

      cy.visit('/app');
      
      // Magic Moment should NOT appear
      cy.contains('Welcome', { timeout: 2000 }).should('not.exist');
    });
  });
});

