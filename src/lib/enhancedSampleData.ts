// src/lib/enhancedSampleData.ts

export const generateEnhancedSampleDatasets = () => {
  // Sales Transaction Dataset - Perfect for business analytics
  const salesDataset = {
    id: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
    name: 'Sales Transactions 2024',
    description: 'Comprehensive sales data with customer demographics, product details, and transaction metrics',
    row_count: 5000,
    column_count: 12,
    file_type: 'csv',
    file_size: '487 KB',
    preview_data: {
      columns: [
        'transaction_id', 'date', 'customer_id', 'customer_age', 'customer_segment',
        'product_category', 'product_name', 'quantity', 'unit_price', 'total_amount',
        'payment_method', 'region'
      ],
      rows: [
        ['TXN001', '2024-01-15', 'CUST1024', '34', 'Premium', 'Electronics', 'Wireless Headphones', '2', '149.99', '299.98', 'Credit Card', 'West'],
        ['TXN002', '2024-01-15', 'CUST2891', '28', 'Standard', 'Home & Garden', 'Coffee Maker', '1', '89.99', '89.99', 'PayPal', 'East'],
        ['TXN003', '2024-01-16', 'CUST1567', '45', 'Premium', 'Electronics', 'Smart Watch', '1', '399.99', '399.99', 'Credit Card', 'South'],
        ['TXN004', '2024-01-16', 'CUST3421', '31', 'Standard', 'Books', 'Python Programming Guide', '3', '29.99', '89.97', 'Debit Card', 'North'],
        ['TXN005', '2024-01-17', 'CUST1024', '34', 'Premium', 'Sports', 'Yoga Mat', '1', '45.00', '45.00', 'Credit Card', 'West'],
        ['TXN006', '2024-01-17', 'CUST4892', '52', 'VIP', 'Electronics', 'Laptop', '1', '1299.99', '1299.99', 'Credit Card', 'East'],
        ['TXN007', '2024-01-18', 'CUST5612', '27', 'Standard', 'Clothing', 'Running Shoes', '2', '79.99', '159.98', 'PayPal', 'South'],
        ['TXN008', '2024-01-18', 'CUST2341', '39', 'Premium', 'Home & Garden', 'Air Purifier', '1', '249.99', '249.99', 'Credit Card', 'North'],
      ]
    }
  };

  // Customer Churn Dataset - Great for ML models
  const churnDataset = {
    id: 'b2c3d4e5-f6a7-4b5c-9d0e-1f2a3b4c5d6e',
    name: 'Customer Churn Analysis',
    description: 'Customer behavior data for predicting churn with engagement metrics and subscription details',
    row_count: 3000,
    column_count: 15,
    file_type: 'csv',
    file_size: '312 KB',
    preview_data: {
      columns: [
        'customer_id', 'tenure_months', 'monthly_charges', 'total_charges',
        'contract_type', 'payment_method', 'internet_service', 'online_security',
        'tech_support', 'streaming_tv', 'customer_service_calls', 'last_interaction_days',
        'satisfaction_score', 'usage_hours_per_month', 'churned'
      ],
      rows: [
        ['C10001', '24', '79.99', '1919.76', 'Two Year', 'Auto Pay', 'Fiber Optic', 'Yes', 'Yes', 'Yes', '2', '5', '8.5', '145', 'No'],
        ['C10002', '3', '45.50', '136.50', 'Month-to-Month', 'Manual', 'DSL', 'No', 'No', 'No', '8', '45', '4.2', '32', 'Yes'],
        ['C10003', '48', '89.99', '4319.52', 'Two Year', 'Auto Pay', 'Fiber Optic', 'Yes', 'Yes', 'Yes', '1', '3', '9.1', '198', 'No'],
        ['C10004', '6', '65.00', '390.00', 'One Year', 'Manual', 'DSL', 'Yes', 'No', 'Yes', '5', '23', '6.8', '78', 'No'],
        ['C10005', '1', '35.00', '35.00', 'Month-to-Month', 'Manual', 'DSL', 'No', 'No', 'No', '12', '89', '3.1', '15', 'Yes'],
        ['C10006', '36', '95.50', '3438.00', 'Two Year', 'Auto Pay', 'Fiber Optic', 'Yes', 'Yes', 'Yes', '0', '2', '9.3', '210', 'No'],
        ['C10007', '12', '55.75', '669.00', 'One Year', 'Auto Pay', 'DSL', 'Yes', 'Yes', 'No', '3', '12', '7.5', '105', 'No'],
        ['C10008', '2', '42.00', '84.00', 'Month-to-Month', 'Manual', 'DSL', 'No', 'No', 'No', '15', '67', '3.8', '28', 'Yes'],
      ]
    }
  };

  // Product Performance Dataset
  const productDataset = {
    id: 'c3d4e5f6-a7b8-4c5d-0e1f-2a3b4c5d6e7f',
    name: 'Product Performance Analysis',
    description: 'Detailed product analytics including sales, reviews, inventory, and conversion rates',
    row_count: 850,
    column_count: 14,
    file_type: 'csv',
    file_size: '145 KB',
    preview_data: {
      columns: [
        'product_id', 'product_name', 'category', 'subcategory', 'price',
        'cost', 'units_sold', 'revenue', 'page_views', 'conversion_rate',
        'avg_rating', 'num_reviews', 'inventory_level', 'reorder_point'
      ],
      rows: [
        ['PRD1001', 'Ultra HD Smart TV 55"', 'Electronics', 'Televisions', '799.99', '450.00', '234', '187197.66', '12450', '1.88', '4.5', '189', '45', '20'],
        ['PRD1002', 'Organic Green Tea (100 bags)', 'Food & Beverage', 'Tea', '18.99', '8.50', '1842', '34969.58', '8920', '20.65', '4.8', '523', '890', '200'],
        ['PRD1003', 'Professional DSLR Camera', 'Electronics', 'Cameras', '1299.99', '750.00', '89', '115699.11', '5670', '1.57', '4.7', '67', '12', '5'],
        ['PRD1004', 'Memory Foam Pillow', 'Home & Living', 'Bedding', '39.99', '15.00', '567', '22674.33', '15230', '3.72', '4.3', '412', '234', '100'],
        ['PRD1005', 'Bluetooth Speaker', 'Electronics', 'Audio', '79.99', '35.00', '423', '33835.77', '9870', '4.28', '4.6', '298', '167', '50'],
        ['PRD1006', 'Stainless Steel Water Bottle', 'Sports', 'Accessories', '24.99', '9.00', '1234', '30837.66', '18920', '6.52', '4.4', '891', '456', '150'],
        ['PRD1007', 'Gaming Mouse RGB', 'Electronics', 'Accessories', '59.99', '25.00', '789', '47332.11', '11240', '7.02', '4.7', '567', '189', '75'],
        ['PRD1008', 'Organic Coffee Beans 1kg', 'Food & Beverage', 'Coffee', '32.99', '14.00', '2103', '69377.97', '19850', '10.59', '4.9', '1456', '678', '300'],
      ]
    }
  };

  // Employee Performance Dataset
  const employeeDataset = {
    id: 'd4e5f6a7-b8c9-4d5e-1f2a-3b4c5d6e7f8a',
    name: 'Employee Performance Metrics',
    description: 'Comprehensive HR data including performance scores, compensation, and departmental metrics',
    row_count: 450,
    column_count: 13,
    file_type: 'csv',
    file_size: '98 KB',
    preview_data: {
      columns: [
        'employee_id', 'department', 'job_title', 'hire_date', 'salary',
        'bonus', 'performance_score', 'projects_completed', 'training_hours',
        'sick_days', 'vacation_days', 'years_experience', 'education_level'
      ],
      rows: [
        ['EMP001', 'Engineering', 'Senior Developer', '2020-03-15', '125000', '15000', '9.2', '24', '40', '3', '15', '8', 'Masters'],
        ['EMP002', 'Sales', 'Account Executive', '2021-06-01', '85000', '25000', '8.7', '18', '32', '5', '12', '5', 'Bachelors'],
        ['EMP003', 'Marketing', 'Marketing Manager', '2019-01-10', '95000', '12000', '8.9', '15', '48', '2', '18', '10', 'Masters'],
        ['EMP004', 'Engineering', 'Junior Developer', '2023-04-20', '75000', '5000', '7.5', '8', '56', '4', '10', '2', 'Bachelors'],
        ['EMP005', 'Finance', 'Financial Analyst', '2021-11-05', '82000', '8000', '8.4', '12', '35', '1', '14', '4', 'Masters'],
        ['EMP006', 'HR', 'HR Specialist', '2022-02-14', '68000', '6000', '8.1', '10', '42', '6', '13', '3', 'Bachelors'],
        ['EMP007', 'Engineering', 'Lead Architect', '2018-07-22', '145000', '20000', '9.5', '32', '45', '1', '20', '12', 'PhD'],
        ['EMP008', 'Sales', 'Sales Representative', '2023-01-08', '65000', '18000', '7.8', '14', '28', '7', '8', '1', 'Bachelors'],
      ]
    }
  };

  // Marketing Campaign Dataset
  const marketingDataset = {
    id: 'e5f6a7b8-c9d0-4e5f-2a3b-4c5d6e7f8a9b',
    name: 'Marketing Campaign Performance',
    description: 'Multi-channel marketing campaign data with ROI, engagement, and conversion metrics',
    row_count: 120,
    column_count: 16,
    file_type: 'csv',
    file_size: '67 KB',
    preview_data: {
      columns: [
        'campaign_id', 'campaign_name', 'channel', 'start_date', 'end_date',
        'budget', 'impressions', 'clicks', 'ctr', 'conversions',
        'conversion_rate', 'cost_per_click', 'cost_per_acquisition', 'revenue',
        'roi', 'audience_segment'
      ],
      rows: [
        ['CMP001', 'Summer Sale 2024', 'Facebook', '2024-06-01', '2024-06-30', '15000', '450000', '18000', '4.00', '720', '4.00', '0.83', '20.83', '72000', '4.80', '18-35 Female'],
        ['CMP002', 'New Product Launch', 'Google Ads', '2024-05-15', '2024-06-15', '25000', '780000', '31200', '4.00', '1248', '4.00', '0.80', '20.03', '156000', '6.24', 'All Ages'],
        ['CMP003', 'Email Newsletter Q2', 'Email', '2024-04-01', '2024-06-30', '5000', '125000', '12500', '10.00', '625', '5.00', '0.40', '8.00', '37500', '7.50', 'Existing Customers'],
        ['CMP004', 'Instagram Influencer', 'Instagram', '2024-06-10', '2024-06-24', '12000', '320000', '9600', '3.00', '480', '5.00', '1.25', '25.00', '38400', '3.20', '18-25 Female'],
        ['CMP005', 'LinkedIn B2B Campaign', 'LinkedIn', '2024-05-01', '2024-05-31', '18000', '95000', '2850', '3.00', '171', '6.00', '6.32', '105.26', '34200', '1.90', 'B2B Decision Makers'],
        ['CMP006', 'YouTube Video Ads', 'YouTube', '2024-06-15', '2024-07-15', '22000', '890000', '17800', '2.00', '534', '3.00', '1.24', '41.20', '53400', '2.43', 'All Ages'],
        ['CMP007', 'Twitter Promoted Tweets', 'Twitter', '2024-06-01', '2024-06-14', '8000', '210000', '6300', '3.00', '315', '5.00', '1.27', '25.40', '25200', '3.15', '25-45 Tech Savvy'],
        ['CMP008', 'Retargeting Campaign', 'Display Network', '2024-05-20', '2024-06-20', '10000', '550000', '11000', '2.00', '550', '5.00', '0.91', '18.18', '49500', '4.95', 'Cart Abandoners'],
      ]
    }
  };

  // Healthcare Patient Data (Anonymized)
  const healthcareDataset = {
    id: 'f6a7b8c9-d0e1-4f5a-3b4c-5d6e7f8a9b0c',
    name: 'Patient Health Outcomes',
    description: 'Anonymized patient data with treatment outcomes, vitals, and risk factors',
    row_count: 2500,
    column_count: 14,
    file_type: 'csv',
    file_size: '289 KB',
    preview_data: {
      columns: [
        'patient_id', 'age', 'gender', 'bmi', 'blood_pressure_sys', 'blood_pressure_dia',
        'cholesterol', 'blood_sugar', 'diagnosis', 'treatment_type', 'hospital_days',
        'readmission_30days', 'outcome', 'risk_score'
      ],
      rows: [
        ['P10001', '54', 'M', '28.5', '138', '88', '195', '110', 'Hypertension', 'Medication', '0', 'No', 'Improved', '6.2'],
        ['P10002', '67', 'F', '31.2', '152', '95', '230', '145', 'Diabetes Type 2', 'Medication + Diet', '3', 'No', 'Stable', '7.8'],
        ['P10003', '45', 'M', '26.8', '128', '82', '180', '95', 'Preventive Care', 'Lifestyle Changes', '0', 'No', 'Improved', '3.4'],
        ['P10004', '72', 'F', '29.4', '145', '90', '210', '128', 'Heart Disease', 'Medication + Surgery', '7', 'Yes', 'Improved', '8.5'],
        ['P10005', '58', 'M', '33.1', '158', '98', '245', '165', 'Diabetes + Hypertension', 'Medication + Monitoring', '4', 'No', 'Stable', '8.9'],
        ['P10006', '41', 'F', '24.6', '120', '78', '175', '88', 'Preventive Care', 'Routine Checkup', '0', 'No', 'Healthy', '2.1'],
        ['P10007', '69', 'M', '30.8', '148', '92', '218', '138', 'Diabetes Type 2', 'Insulin Therapy', '5', 'No', 'Improved', '7.6'],
        ['P10008', '52', 'F', '27.3', '135', '85', '188', '105', 'Hypertension', 'Medication', '1', 'No', 'Improved', '5.8'],
      ]
    }
  };

  return [
    salesDataset,
    churnDataset,
    productPerformanceDataset,
    employeeDataset,
    marketingDataset,
    healthcareDataset
  ];
};