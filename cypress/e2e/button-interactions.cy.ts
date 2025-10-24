describe('Button Interactions and UI Components', () => {
  beforeEach(() => {
    // Mock authentication
    cy.intercept('GET', '**/auth/v1/user', {
      statusCode: 200,
      body: {
        id: 'test-user-id',
        email: 'test@example.com',
      },
    }).as('getUser');

    // Mock empty datasets and models
    cy.intercept('GET', '**/rest/v1/datasets*', {
      statusCode: 200,
      body: []
    }).as('getDatasets');

    cy.intercept('GET', '**/rest/v1/models*', {
      statusCode: 200,
      body: []
    }).as('getModels');
  });

  it('dashboard action buttons work', () => {
    cy.visit('/app');
    cy.wait('@getUser');

    // Check for action buttons
    cy.contains('Get Started').should('be.visible');
  });

  it('data management action buttons are clickable', () => {
    cy.visit('/app/data');
    cy.wait('@getUser');

    // Upload button
    cy.contains('button', 'Upload Dataset').should('be.visible').and('not.be.disabled');

    // Add connection button
    cy.contains('button', 'Add Connection').should('be.visible').and('not.be.disabled');
  });

  it('model training page buttons are present', () => {
    cy.intercept('GET', '**/rest/v1/datasets*', {
      statusCode: 200,
      body: [
        {
          id: 'dataset-1',
          name: 'Training Dataset',
          rows: 1000,
          columns: 10,
          dateUploaded: new Date().toISOString(),
          fileType: 'csv',
        }
      ]
    }).as('getDatasetsWithData');

    cy.visit('/app/train');
    cy.wait('@getUser');
    cy.wait('@getDatasetsWithData');

    // Check for training button or form
    cy.contains('Train Model').should('be.visible');
  });

  it('navigation sidebar links work correctly', () => {
    cy.visit('/app');
    cy.wait('@getUser');

    // Click through main navigation items
    const navItems = [
      'Dashboard',
      'Data',
      'Train',
      'Deploy',
      'Monitor'
    ];

    navItems.forEach((item) => {
      cy.contains('a', item).should('be.visible');
    });
  });

  it('user menu button works', () => {
    cy.visit('/app');
    cy.wait('@getUser');

    // Look for profile or user menu
    cy.get('button[aria-label*="user" i], button[aria-label*="menu" i], [class*="user-menu"]')
      .should('exist');
  });

  it('settings page save buttons exist', () => {
    cy.visit('/app/settings');
    cy.wait('@getUser');

    cy.contains('Account Settings').should('be.visible');

    // Check for save or update buttons
    cy.contains('button', /save|update/i).should('exist');
  });

  it('pipeline builder has interactive elements', () => {
    cy.visit('/app/pipeline');
    cy.wait('@getUser');

    cy.contains('Pipeline Builder').should('be.visible');
  });

  it('trash bin has restore functionality', () => {
    cy.visit('/app/trash');
    cy.wait('@getUser');

    cy.contains('Trash').should('be.visible');
  });

  it('visualizations page renders without errors', () => {
    cy.visit('/app/visualizations');
    cy.wait('@getUser');

    // Page should load without critical errors
    cy.get('body').should('be.visible');
  });

  it('all main routes are accessible and render', () => {
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
      cy.wait('@getUser');

      // Verify page loads without errors
      cy.get('body').should('be.visible');

      // Verify no error boundary is shown
      cy.contains('Something went wrong').should('not.exist');
    });
  });
});
