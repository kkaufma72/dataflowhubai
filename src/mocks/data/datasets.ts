import { Dataset } from '../../types';

export const sampleDatasets: Dataset[] = [
  {
    id: 'sample-users',
    name: 'Users Dataset',
    description: 'Sample user data for analysis including roles and departments',
    rows: 100,
    columns: 6,
    dateUploaded: new Date().toISOString(),
    fileType: 'json',
    fileSize: '2.5 KB',
    projectId: '1',
    previewData: {
      columns: ['id', 'name', 'email', 'role', 'department', 'joinDate'],
      rows: [
        ['1', 'John Smith', 'john@example.com', 'admin', 'IT', '2023-01-15'],
        ['2', 'Sarah Johnson', 'sarah@example.com', 'user', 'Sales', '2023-02-20'],
        ['3', 'Michael Chen', 'michael@example.com', 'user', 'Marketing', '2023-03-10']
      ]
    }
  },
  {
    id: 'sample-products',
    name: 'Products Dataset',
    description: 'Sample product catalog data with categories and ratings',
    rows: 50,
    columns: 6,
    dateUploaded: new Date().toISOString(),
    fileType: 'json',
    fileSize: '1.8 KB',
    projectId: '1',
    previewData: {
      columns: ['id', 'name', 'price', 'stock', 'category', 'rating'],
      rows: [
        ['101', 'Premium Widget', '299.99', '50', 'Electronics', '4.5'],
        ['102', 'Basic Package', '149.99', '200', 'Software', '4.0'],
        ['103', 'Deluxe Bundle', '499.99', '25', 'Electronics', '4.8']
      ]
    }
  },
  {
    id: 'sample-orders',
    name: 'Orders Dataset',
    description: 'Sample order transaction data with payment methods',
    rows: 200,
    columns: 7,
    dateUploaded: new Date().toISOString(),
    fileType: 'json',
    fileSize: '3.2 KB',
    projectId: '1',
    previewData: {
      columns: ['id', 'userId', 'products', 'total', 'status', 'date', 'paymentMethod'],
      rows: [
        ['1001', '2', '[101, 103]', '799.98', 'completed', '2024-01-15', 'credit_card'],
        ['1002', '3', '[102]', '149.99', 'pending', '2024-01-18', 'paypal'],
        ['1003', '1', '[101, 102]', '449.98', 'processing', '2024-01-20', 'credit_card']
      ]
    }
  }
];