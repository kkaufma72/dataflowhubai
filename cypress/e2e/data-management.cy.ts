describe('Data Management', () => {
  beforeEach(() => {
    // Mock authentication
    cy.intercept('GET', '**/auth/v1/user', {
      statusCode: 200,
      body: {
        id: 'test-user-id',
        email: 'test@example.com',
      },
    }).as('getUser');

    cy.intercept('GET', '**/rest/v1/datasets*', {
      statusCode: 200,
      body: [
        {
          id: 'test-dataset-1',
          name: 'Test Dataset',
          description: 'A test dataset for E2E testing',
          rows: 1000,
          columns: 10,
          dateUploaded: new Date().toISOString(),
          fileType: 'csv',
          fileSize: '2.5 MB',
          projectId: 'project-1',
          preview_data: {
            columns: ['id', 'name', 'age', 'city', 'salary'],
            rows: [
              ['1', 'John Doe', '30', 'New York', '100000'],
              ['2', 'Jane Smith', '25', 'San Francisco', '120000'],
              ['3', 'Bob Johnson', '40', 'Chicago', '90000']
            ]
          }
        }
      ]
    }).as('getDatasets');

    // Visit the data management page
    cy.visit('/app/data');
    cy.wait('@getUser');
    cy.wait('@getDatasets');
  });

  it('displays datasets', () => {
    cy.contains('Test Dataset').should('be.visible');
    cy.contains('A test dataset for E2E testing').should('be.visible');
    cy.contains('1,000 rows • 10 columns').should('be.visible');
  });

  it('opens dataset preview when clicking Preview button', () => {
    cy.contains('button', 'Preview').click();
    
    // Check that the preview modal is displayed
    cy.contains('Test Dataset').should('be.visible');
    cy.contains('id').should('be.visible');
    cy.contains('name').should('be.visible');
    cy.contains('John Doe').should('be.visible');
  });

  it('opens dataset analysis when clicking Analyze button', () => {
    cy.contains('button', 'Analyze').click();
    
    // Check that the analysis view is displayed
    cy.contains('Dataset Analysis: Test Dataset').should('be.visible');
    cy.contains('Total Rows').should('be.visible');
    cy.contains('1,000').should('be.visible');
  });

  it('shows upload form when clicking Upload Dataset button', () => {
    cy.contains('button', 'Upload Dataset').click();
    
    // Check that the upload form is displayed
    cy.contains('Drag and drop your file here').should('be.visible');
    cy.contains('Supported formats: CSV, Excel, JSON, CSS').should('be.visible');
  });

  it('shows data connector when clicking Add Connection button', () => {
    cy.contains('button', 'Add Connection').click();
    
    // Check that the connector form is displayed
    cy.contains('Connect Data Source').should('be.visible');
    cy.contains('Connect to your enterprise data platforms and analytics tools').should('be.visible');
  });

  it('navigates between dataset tabs', () => {
    // First click on a dataset to select it
    cy.contains('Test Dataset').click();
    
    // Check that the dataset details are displayed
    cy.contains('Test Dataset').should('be.visible');
    
    // Click on the Versioning tab
    cy.contains('Versioning').click();
    cy.contains('Data Versioning').should('be.visible');
    cy.contains('Track changes and manage versions of your dataset').should('be.visible');
    
    // Click on the Quality Checks tab
    cy.contains('Quality Checks').click();
    cy.contains('Data Validation Rules').should('be.visible');
    
    // Click on the Lineage tab
    cy.contains('Lineage').click();
    cy.contains('Data Lineage').should('be.visible');
    cy.contains('Track the origin and transformations of your data').should('be.visible');
    
    // Click on the Data Profile tab
    cy.contains('Data Profile').click();
    
    // Click on the Preprocessing tab
    cy.contains('Preprocessing').click();
    cy.contains('Automated Data Preprocessing').should('be.visible');
  });

  it('uploads a file', () => {
    // Intercept file upload request
    cy.intercept('POST', '**/rest/v1/datasets', {
      statusCode: 201,
      body: {
        id: 'new-dataset-id',
        name: 'test-file.csv',
        description: 'Uploaded CSV file',
        rows: 100,
        columns: 5,
        dateUploaded: new Date().toISOString(),
        fileType: 'csv',
        fileSize: '10 KB',
        projectId: 'project-1'
      }
    }).as('uploadDataset');

    // Click upload button
    cy.contains('button', 'Upload Dataset').click();
    
    // Create a test file and upload it
    cy.get('input[type="file"]').selectFile({
      contents: Cypress.Buffer.from('id,name,age\n1,John,30\n2,Jane,25'),
      fileName: 'test-file.csv',
      mimeType: 'text/csv'
    }, { force: true });
    
    // Check that the file was selected
    cy.contains('test-file.csv').should('be.visible');
    
    // Click upload
    cy.contains('button', 'Upload').click();
    
    // Wait for the upload to complete
    cy.wait('@uploadDataset');
    
    // Check for success message
    cy.contains('Dataset "test-file.csv" uploaded successfully').should('be.visible');
  });
});