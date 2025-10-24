describe('Model Training and Deployment Workflow', () => {
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
          name: 'Training Dataset',
          description: 'Dataset for model training',
          rows: 5000,
          columns: 15,
          dateUploaded: new Date().toISOString(),
          fileType: 'csv',
          fileSize: '5.2 MB',
          projectId: 'project-1',
        }
      ]
    }).as('getDatasets');

    // Mock models
    cy.intercept('GET', '**/rest/v1/models*', {
      statusCode: 200,
      body: []
    }).as('getModels');
  });

  it('completes model training flow', () => {
    cy.visit('/app/train');
    cy.wait('@getUser');

    // Check training page loads
    cy.contains('Model Training').should('be.visible');

    // Select dataset
    cy.contains('Select Dataset').should('be.visible');

    // Select algorithm
    cy.contains('Algorithm').should('be.visible');
  });

  it('displays model evaluation metrics', () => {
    // Mock trained model
    cy.intercept('GET', '**/rest/v1/models*', {
      statusCode: 200,
      body: [
        {
          id: 'model-1',
          name: 'Trained Model',
          algorithm: 'RandomForest',
          status: 'trained',
          accuracy: 0.95,
          precision: 0.93,
          recall: 0.92,
          f1Score: 0.925,
        }
      ]
    }).as('getTrainedModels');

    cy.visit('/app/evaluate');
    cy.wait('@getUser');
    cy.wait('@getTrainedModels');

    cy.contains('Model Evaluation').should('be.visible');
  });

  it('can select model for deployment', () => {
    // Mock trained model
    cy.intercept('GET', '**/rest/v1/models*', {
      statusCode: 200,
      body: [
        {
          id: 'model-1',
          name: 'Ready Model',
          algorithm: 'XGBoost',
          status: 'trained',
          accuracy: 0.96,
        }
      ]
    }).as('getTrainedModels');

    cy.visit('/app/deploy');
    cy.wait('@getUser');
    cy.wait('@getTrainedModels');

    cy.contains('Deployment').should('be.visible');
    cy.contains('Select a model').should('be.visible');
  });

  it('shows model monitoring dashboard', () => {
    // Mock deployed model
    cy.intercept('GET', '**/rest/v1/models*', {
      statusCode: 200,
      body: [
        {
          id: 'model-1',
          name: 'Deployed Model',
          algorithm: 'RandomForest',
          status: 'deployed',
          accuracy: 0.95,
        }
      ]
    }).as('getDeployedModels');

    cy.visit('/app/monitoring');
    cy.wait('@getUser');
    cy.wait('@getDeployedModels');

    cy.contains('Model Monitoring').should('be.visible');
  });

  it('feature engineering page displays options', () => {
    cy.visit('/app/feature-engineering');
    cy.wait('@getUser');

    cy.contains('Feature Engineering').should('be.visible');
  });
});
