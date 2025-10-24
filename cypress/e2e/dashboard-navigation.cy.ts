describe('Dashboard and Navigation', () => {
  beforeEach(() => {
    // Mock authentication
    cy.intercept('GET', '**/auth/v1/user', {
      statusCode: 200,
      body: {
        id: 'test-user-id',
        email: 'test@example.com',
      },
    }).as('getUser');

    // Mock datasets
    cy.intercept('GET', '**/rest/v1/datasets*', {
      statusCode: 200,
      body: [
        {
          id: 'dataset-1',
          name: 'Sample Dataset',
          description: 'A test dataset',
          rows: 1000,
          columns: 10,
          dateUploaded: new Date().toISOString(),
          fileType: 'csv',
          fileSize: '2.5 MB',
          projectId: 'project-1',
        }
      ]
    }).as('getDatasets');

    // Mock models
    cy.intercept('GET', '**/rest/v1/models*', {
      statusCode: 200,
      body: [
        {
          id: 'model-1',
          name: 'Test Model',
          algorithm: 'RandomForest',
          status: 'trained',
          accuracy: 0.95,
        }
      ]
    }).as('getModels');

    // Visit the dashboard
    cy.visit('/app');
    cy.wait('@getUser');
  });

  it('displays dashboard with stats cards', () => {
    cy.contains('Welcome to DataFlowHub AI').should('be.visible');

    // Check stats cards
    cy.contains('Datasets').should('be.visible');
    cy.contains('Models').should('be.visible');
    cy.contains('Deployed').should('be.visible');
    cy.contains('In Progress').should('be.visible');
  });

  it('navigates to data management page', () => {
    cy.contains('a', 'Data').click();
    cy.url().should('include', '/app/data');
  });

  it('navigates to feature engineering page', () => {
    cy.visit('/app/feature-engineering');
    cy.url().should('include', '/app/feature-engineering');
    cy.contains('Feature Engineering').should('be.visible');
  });

  it('navigates to model training page', () => {
    cy.visit('/app/train');
    cy.url().should('include', '/app/train');
    cy.contains('Model Training').should('be.visible');
  });

  it('navigates to model evaluation page', () => {
    cy.visit('/app/evaluate');
    cy.url().should('include', '/app/evaluate');
    cy.contains('Model Evaluation').should('be.visible');
  });

  it('navigates to deployment page', () => {
    cy.visit('/app/deploy');
    cy.url().should('include', '/app/deploy');
    cy.contains('Deployment').should('be.visible');
  });

  it('navigates to monitoring page', () => {
    cy.visit('/app/monitoring');
    cy.url().should('include', '/app/monitoring');
    cy.contains('Model Monitoring').should('be.visible');
  });

  it('navigates to visualizations page', () => {
    cy.visit('/app/visualizations');
    cy.url().should('include', '/app/visualizations');
  });

  it('navigates to pipeline builder page', () => {
    cy.visit('/app/pipeline');
    cy.url().should('include', '/app/pipeline');
    cy.contains('Pipeline Builder').should('be.visible');
  });

  it('navigates to profile page', () => {
    cy.visit('/app/profile');
    cy.url().should('include', '/app/profile');
    cy.contains('User Profile').should('be.visible');
  });

  it('navigates to settings page', () => {
    cy.visit('/app/settings');
    cy.url().should('include', '/app/settings');
    cy.contains('Account Settings').should('be.visible');
  });

  it('navigates to API management page', () => {
    cy.visit('/app/api-management');
    cy.url().should('include', '/app/api-management');
  });

  it('navigates to usage dashboard', () => {
    cy.visit('/app/usage');
    cy.url().should('include', '/app/usage');
    cy.contains('Usage').should('be.visible');
  });

  it('navigates to trash bin', () => {
    cy.visit('/app/trash');
    cy.url().should('include', '/app/trash');
    cy.contains('Trash').should('be.visible');
  });

  it('workflow steps are clickable', () => {
    cy.visit('/app');

    // Find and click a workflow step button
    cy.contains('button', 'Upload Data').should('be.visible');
  });

  it('stats cards link to correct pages', () => {
    cy.visit('/app');

    // Click on Datasets card
    cy.contains('Available datasets').parent().parent().click();
    cy.url().should('include', '/app/data');
  });
});
