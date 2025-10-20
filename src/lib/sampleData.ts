// src/lib/sampleData.ts

export interface SampleDataset {
    id: string;
    name: string;
    description: string;
    row_count: number;
    column_count: number;
    dateUploaded: string;
    file_type: string;
    file_size: string;
    project_id: string;
    preview_data: {
      columns: string[];
      rows: any[][];
    };
    column_statistics?: any;
  }
  
  /**
   * Generate sample datasets for demo purposes
   */
  export const generateSampleDatasets = (): SampleDataset[] => {
    const now = new Date().toISOString();
  
    return [
      {
        id: 'sample-sales-demo',
        name: 'Sales Data 2024',
        description: 'Sample sales transactions with customer information',
        row_count: 1000,
        column_count: 8,
        dateUploaded: now,
        file_type: 'csv',
        file_size: '125 KB',
        project_id: '1',
        preview_data: {
          columns: ['order_id', 'date', 'customer_id', 'product', 'quantity', 'price', 'total', 'region'],
          rows: [
            ['ORD001', '2024-01-15', 'CUST1234', 'Laptop', '1', '999.99', '999.99', 'West'],
            ['ORD002', '2024-01-15', 'CUST5678', 'Mouse', '2', '29.99', '59.98', 'East'],
            ['ORD003', '2024-01-16', 'CUST9012', 'Keyboard', '1', '79.99', '79.99', 'South'],
            ['ORD004', '2024-01-16', 'CUST3456', 'Monitor', '2', '299.99', '599.98', 'North'],
            ['ORD005', '2024-01-17', 'CUST7890', 'Webcam', '1', '89.99', '89.99', 'West'],
          ]
        },
        column_statistics: {
          total: { min: 29.99, max: 999.99, mean: 365.99, median: 299.99 }
        }
      },
      {
        id: 'sample-customer-demo',
        name: 'Customer Data',
        description: 'Customer demographics and purchase history',
        row_count: 500,
        column_count: 7,
        dateUploaded: now,
        file_type: 'csv',
        file_size: '68 KB',
        project_id: '1',
        preview_data: {
          columns: ['customer_id', 'name', 'email', 'age', 'city', 'signup_date', 'total_purchases'],
          rows: [
            ['CUST1234', 'John Doe', 'john@example.com', '35', 'San Francisco', '2023-06-15', '5'],
            ['CUST5678', 'Jane Smith', 'jane@example.com', '28', 'New York', '2023-08-22', '12'],
            ['CUST9012', 'Bob Johnson', 'bob@example.com', '42', 'Chicago', '2023-05-10', '8'],
            ['CUST3456', 'Alice Williams', 'alice@example.com', '31', 'Seattle', '2023-07-03', '15'],
            ['CUST7890', 'Charlie Brown', 'charlie@example.com', '55', 'Boston', '2023-04-18', '3'],
          ]
        },
        column_statistics: {
          age: { min: 18, max: 75, mean: 38.5, median: 36 },
          total_purchases: { min: 1, max: 50, mean: 8.7, median: 7 }
        }
      },
      {
        id: 'sample-products-demo',
        name: 'Product Catalog',
        description: 'Product information with pricing and inventory',
        row_count: 250,
        column_count: 6,
        dateUploaded: now,
        file_type: 'json',
        file_size: '45 KB',
        project_id: '1',
        preview_data: {
          columns: ['product_id', 'name', 'category', 'price', 'stock', 'rating'],
          rows: [
            ['PROD101', 'Laptop Pro', 'Electronics', '999.99', '45', '4.5'],
            ['PROD102', 'Wireless Mouse', 'Accessories', '29.99', '120', '4.2'],
            ['PROD103', 'Mechanical Keyboard', 'Accessories', '79.99', '67', '4.7'],
            ['PROD104', '4K Monitor', 'Electronics', '299.99', '32', '4.6'],
            ['PROD105', 'HD Webcam', 'Electronics', '89.99', '88', '4.3'],
          ]
        }
      }
    ];
  };
  
  /**
   * Get a single sample dataset by ID
   */
  export const getSampleDataset = (id: string): SampleDataset | undefined => {
    const datasets = generateSampleDatasets();
    return datasets.find(d => d.id === id);
  };
  
  /**
   * Check if a dataset is a sample dataset
   */
  export const isSampleDataset = (id: string): boolean => {
    return id.startsWith('sample-');
  };