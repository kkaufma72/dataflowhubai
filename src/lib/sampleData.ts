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
   * Generate sample datasets for demo purposes - optimized for VC presentations
   * These datasets showcase real-world business use cases with measurable ROI
   */
  export const generateSampleDatasets = (): SampleDataset[] => {
    const now = new Date().toISOString();
  
    return [
      // 1. CUSTOMER CHURN PREDICTION - High-Value Use Case
      {
        id: '11111111-1111-4111-8111-111111111111',
        name: 'Customer Churn Analysis (SaaS)',
        description: '12,500 B2B SaaS customers with 23% historical churn rate. Predict churn 60 days in advance to save $2.4M annually.',
        row_count: 12500,
        column_count: 15,
        dateUploaded: now,
        file_type: 'csv',
        file_size: '3.2 MB',
        project_id: '1',
        preview_data: {
          columns: [
            'customer_id', 'tenure_months', 'monthly_charges', 'total_revenue', 
            'support_tickets', 'last_login_days', 'feature_usage_score', 
            'payment_failures', 'contract_type', 'industry', 
            'team_size', 'integrations_active', 'training_completed', 
            'nps_score', 'churned'
          ],
          rows: [
            ['CUST-8473', '24', '499', '11976', '2', '3', '87', '0', 'Annual', 'FinTech', '45', '8', 'Yes', '9', 'No'],
            ['CUST-9201', '6', '299', '1794', '8', '45', '34', '3', 'Monthly', 'E-commerce', '12', '2', 'No', '4', 'Yes'],
            ['CUST-7652', '36', '999', '35964', '1', '1', '92', '0', 'Annual', 'Healthcare', '120', '12', 'Yes', '10', 'No'],
            ['CUST-5483', '18', '399', '7182', '5', '12', '68', '1', 'Quarterly', 'Retail', '28', '5', 'Yes', '7', 'No'],
            ['CUST-3829', '3', '199', '597', '12', '67', '22', '4', 'Monthly', 'Marketing', '8', '1', 'No', '3', 'Yes'],
          ]
        },
        column_statistics: {
          monthly_charges: { min: 99, max: 2999, mean: 547, median: 499 },
          tenure_months: { min: 1, max: 72, mean: 18.3, median: 14 },
          nps_score: { min: 0, max: 10, mean: 6.8, median: 7 }
        }
      },

      // 2. SALES FORECASTING - Revenue Impact
      {
        id: '22222222-2222-4222-8222-222222222222',
        name: 'Enterprise Sales Pipeline',
        description: '8,300 deals worth $124M pipeline. ML forecasting improved accuracy by 34%, reducing missed targets by $8.2M/year.',
        row_count: 8300,
        column_count: 18,
        dateUploaded: now,
        file_type: 'csv',
        file_size: '2.8 MB',
        project_id: '1',
        preview_data: {
          columns: [
            'deal_id', 'created_date', 'deal_value', 'probability', 'stage', 
            'days_in_stage', 'contact_count', 'demo_completed', 'proposal_sent',
            'competitor_count', 'industry', 'company_size', 'region',
            'lead_source', 'budget_confirmed', 'decision_date', 'sales_rep', 'closed_won'
          ],
          rows: [
            ['DEAL-4729', '2024-09-15', '85000', '75', 'Negotiation', '12', '23', 'Yes', 'Yes', '2', 'SaaS', '250-500', 'West', 'Referral', 'Yes', '2024-12-01', 'Sarah Chen', 'Yes'],
            ['DEAL-5812', '2024-10-03', '125000', '45', 'Proposal', '8', '15', 'Yes', 'Yes', '3', 'Manufacturing', '500-1000', 'Midwest', 'Outbound', 'No', '2025-01-15', 'Mike Torres', 'Pending'],
            ['DEAL-3904', '2024-08-22', '45000', '90', 'Verbal Commit', '5', '31', 'Yes', 'Yes', '1', 'Healthcare', '100-250', 'East', 'Inbound', 'Yes', '2024-11-20', 'Lisa Wang', 'Yes'],
            ['DEAL-6183', '2024-10-28', '220000', '30', 'Discovery', '15', '8', 'No', 'No', '4', 'Financial', '1000+', 'South', 'Partner', 'No', '2025-03-01', 'James Miller', 'Pending'],
            ['DEAL-2957', '2024-07-10', '65000', '20', 'Stalled', '67', '12', 'Yes', 'No', '2', 'Retail', '250-500', 'West', 'Marketing', 'No', '2024-12-31', 'Amy Johnson', 'Pending'],
          ]
        },
        column_statistics: {
          deal_value: { min: 15000, max: 850000, mean: 149398, median: 95000 },
          probability: { min: 5, max: 95, mean: 48, median: 50 }
        }
      },

      // 3. FRAUD DETECTION - Risk Mitigation
      {
        id: '33333333-3333-4333-8333-333333333333',
        name: 'Payment Fraud Detection',
        description: '245,000 transactions with 2.3% fraud rate. ML model prevented $4.7M in fraud losses with 96.2% accuracy.',
        row_count: 245000,
        column_count: 22,
        dateUploaded: now,
        file_type: 'csv',
        file_size: '18.4 MB',
        project_id: '1',
        preview_data: {
          columns: [
            'transaction_id', 'timestamp', 'amount', 'merchant_category', 'payment_method',
            'card_present', 'international', 'device_id', 'ip_address', 'velocity_1h',
            'velocity_24h', 'avg_transaction_amount', 'customer_age_days', 'previous_fraud',
            'time_since_last_transaction', 'shipping_address_change', 'email_verified',
            'phone_verified', 'billing_shipping_match', 'high_risk_country', 'cvv_provided', 'is_fraud'
          ],
          rows: [
            ['TXN-8472910', '2024-11-16 14:23:01', '89.99', 'Electronics', 'Credit Card', 'No', 'No', 'DEV-4892', '192.168.1.45', '1', '3', '125.50', '450', 'No', '120', 'No', 'Yes', 'Yes', 'Yes', 'No', 'Yes', 'No'],
            ['TXN-8472911', '2024-11-16 14:23:15', '2450.00', 'Jewelry', 'Debit Card', 'No', 'Yes', 'DEV-9201', '89.42.173.22', '5', '8', '78.20', '12', 'No', '15', 'Yes', 'No', 'No', 'No', 'Yes', 'No', 'Yes'],
            ['TXN-8472912', '2024-11-16 14:24:32', '45.00', 'Grocery', 'Credit Card', 'Yes', 'No', 'DEV-3847', '192.168.5.102', '1', '2', '52.30', '890', 'No', '240', 'No', 'Yes', 'Yes', 'Yes', 'No', 'Yes', 'No'],
            ['TXN-8472913', '2024-11-16 14:25:01', '1299.99', 'Electronics', 'Credit Card', 'No', 'Yes', 'DEV-7392', '23.45.67.89', '12', '24', '45.90', '3', 'Yes', '5', 'Yes', 'No', 'No', 'No', 'Yes', 'No', 'Yes'],
            ['TXN-8472914', '2024-11-16 14:26:45', '124.50', 'Restaurant', 'Mobile Pay', 'Yes', 'No', 'DEV-5029', '10.0.0.25', '1', '4', '98.40', '620', 'No', '180', 'No', 'Yes', 'Yes', 'Yes', 'No', 'Yes', 'No'],
          ]
        },
        column_statistics: {
          amount: { min: 0.99, max: 9999.99, mean: 187.43, median: 89.99 },
          velocity_24h: { min: 1, max: 50, mean: 4.2, median: 3 }
        }
      },

      // 4. PREDICTIVE MAINTENANCE - Cost Savings
      {
        id: '44444444-4444-4444-8444-444444444444',
        name: 'Industrial Equipment Monitoring',
        description: '52,000 sensor readings from 340 machines. Predict failures 14 days early, reducing downtime costs by $3.1M/year.',
        row_count: 52000,
        column_count: 16,
        dateUploaded: now,
        file_type: 'csv',
        file_size: '6.7 MB',
        project_id: '1',
        preview_data: {
          columns: [
            'machine_id', 'timestamp', 'temperature_c', 'vibration_mm_s', 'pressure_psi',
            'rpm', 'power_kw', 'humidity_percent', 'runtime_hours', 'maintenance_days_ago',
            'error_count_24h', 'performance_score', 'oil_level', 'bearing_condition',
            'anomaly_score', 'failure_next_14d'
          ],
          rows: [
            ['MACH-204', '2024-11-16 14:00:00', '68.5', '2.3', '125', '3420', '42.1', '45', '8920', '45', '0', '98', 'Good', 'Normal', '0.12', 'No'],
            ['MACH-087', '2024-11-16 14:00:00', '89.2', '8.7', '142', '3580', '51.8', '52', '12450', '120', '12', '72', 'Low', 'Worn', '0.87', 'Yes'],
            ['MACH-156', '2024-11-16 14:00:00', '71.3', '3.1', '128', '3445', '43.5', '48', '5680', '22', '1', '95', 'Good', 'Normal', '0.18', 'No'],
            ['MACH-319', '2024-11-16 14:00:00', '85.7', '6.4', '138', '3520', '48.2', '55', '15230', '89', '7', '78', 'Medium', 'Degraded', '0.64', 'Yes'],
            ['MACH-042', '2024-11-16 14:00:00', '70.1', '2.8', '126', '3410', '41.9', '46', '3420', '15', '0', '97', 'Good', 'Normal', '0.15', 'No'],
          ]
        },
        column_statistics: {
          temperature_c: { min: 45, max: 105, mean: 72.8, median: 71.2 },
          vibration_mm_s: { min: 0.5, max: 12.0, mean: 4.3, median: 3.5 }
        }
      },

      // 5. MARKETING CAMPAIGN OPTIMIZATION - ROI Focus
      {
        id: '55555555-5555-4555-8555-555555555555',
        name: 'Digital Marketing Campaign Performance',
        description: '28,000 campaigns across 5 channels. ML optimization increased ROAS from 3.2x to 5.8x, adding $12M in revenue.',
        row_count: 28000,
        column_count: 20,
        dateUploaded: now,
        file_type: 'csv',
        file_size: '4.5 MB',
        project_id: '1',
        preview_data: {
          columns: [
            'campaign_id', 'start_date', 'channel', 'audience_segment', 'budget',
            'impressions', 'clicks', 'conversions', 'revenue', 'ctr',
            'conversion_rate', 'cpa', 'roas', 'device_type', 'time_of_day',
            'day_of_week', 'ad_creative_type', 'landing_page_variant', 'weather_impact', 'high_performer'
          ],
          rows: [
            ['CAMP-7294', '2024-10-15', 'Facebook', 'Tech Enthusiasts 25-34', '5000', '245000', '8925', '267', '45780', '3.64', '2.99', '18.73', '9.16', 'Mobile', 'Evening', 'Thursday', 'Video', 'Variant-A', 'Sunny', 'Yes'],
            ['CAMP-8301', '2024-10-18', 'Google Ads', 'Enterprise Decision Makers', '12000', '890000', '12450', '89', '124500', '1.40', '0.71', '134.83', '10.38', 'Desktop', 'Morning', 'Tuesday', 'Search Text', 'Variant-C', 'Neutral', 'Yes'],
            ['CAMP-5829', '2024-10-20', 'LinkedIn', 'C-Suite Executives', '8000', '125000', '2875', '45', '67500', '2.30', '1.57', '177.78', '8.44', 'Desktop', 'Afternoon', 'Wednesday', 'Sponsored Content', 'Variant-B', 'Rainy', 'No'],
            ['CAMP-9472', '2024-10-22', 'Instagram', 'Millennials 28-35', '3500', '178000', '6230', '124', '28960', '3.50', '1.99', '28.23', '8.27', 'Mobile', 'Night', 'Friday', 'Story', 'Variant-A', 'Sunny', 'Yes'],
            ['CAMP-3847', '2024-10-25', 'Twitter', 'Tech News Followers', '2500', '95000', '1825', '18', '5940', '1.92', '0.99', '138.89', '2.38', 'Mobile', 'Morning', 'Monday', 'Image', 'Variant-B', 'Cloudy', 'No'],
          ]
        },
        column_statistics: {
          budget: { min: 500, max: 50000, mean: 5420, median: 4200 },
          roas: { min: 0.5, max: 15.8, mean: 4.7, median: 3.9 },
          conversion_rate: { min: 0.1, max: 5.2, mean: 1.8, median: 1.5 }
        }
      },

      // 6. CUSTOMER LIFETIME VALUE - Strategic Planning
      {
        id: '66666666-6666-4666-8666-666666666666',
        name: 'E-commerce Customer Lifetime Value',
        description: '67,500 customers with purchase history. Segment high-LTV customers ($850 avg) vs low-LTV ($120 avg) for targeted retention.',
        row_count: 67500,
        column_count: 18,
        dateUploaded: now,
        file_type: 'csv',
        file_size: '8.9 MB',
        project_id: '1',
        preview_data: {
          columns: [
            'customer_id', 'first_purchase_date', 'total_orders', 'total_revenue', 
            'avg_order_value', 'purchase_frequency_days', 'returns_count', 'support_contacts',
            'email_open_rate', 'sms_opt_in', 'loyalty_points', 'referrals_made',
            'product_categories_bought', 'mobile_app_user', 'subscription_active', 
            'last_purchase_days', 'predicted_ltv_12m', 'segment'
          ],
          rows: [
            ['CUST-28473', '2022-03-15', '47', '8940', '190.21', '23', '2', '5', '42', 'Yes', '8940', '3', '8', 'Yes', 'Yes', '8', '2450', 'High-Value'],
            ['CUST-39201', '2024-08-22', '3', '245', '81.67', '45', '0', '1', '18', 'No', '245', '0', '2', 'No', 'No', '67', '420', 'Low-Value'],
            ['CUST-47652', '2021-11-03', '128', '24580', '191.88', '14', '8', '12', '67', 'Yes', '24580', '7', '12', 'Yes', 'Yes', '3', '4890', 'VIP'],
            ['CUST-15483', '2023-06-18', '18', '2340', '130.00', '32', '1', '3', '35', 'Yes', '2340', '1', '5', 'Yes', 'No', '22', '1250', 'Medium-Value'],
            ['CUST-63829', '2024-10-01', '1', '89', '89.00', 'N/A', '0', '0', '0', 'No', '89', '0', '1', 'No', 'No', '46', '180', 'Low-Value'],
          ]
        },
        column_statistics: {
          total_revenue: { min: 25, max: 45000, mean: 1247, median: 580 },
          predicted_ltv_12m: { min: 50, max: 8500, mean: 850, median: 520 }
        }
      },

      // 7. INVENTORY OPTIMIZATION - Supply Chain
      {
        id: '77777777-7777-4777-8777-777777777777',
        name: 'Retail Inventory & Demand Forecasting',
        description: '15,400 SKUs across 85 locations. ML reduced stockouts by 42% and overstock by 38%, saving $6.8M in holding costs.',
        row_count: 15400,
        column_count: 17,
        dateUploaded: now,
        file_type: 'csv',
        file_size: '3.9 MB',
        project_id: '1',
        preview_data: {
          columns: [
            'sku', 'product_name', 'category', 'location', 'current_stock', 'reorder_point',
            'lead_time_days', 'avg_daily_sales', 'stockout_events_30d', 'holding_cost_monthly',
            'supplier', 'season_sensitive', 'promotion_active', 'weather_dependent', 
            'days_until_expiry', 'predicted_demand_7d', 'reorder_recommended'
          ],
          rows: [
            ['SKU-82947', 'Organic Bananas 2lb', 'Produce', 'Store-042', '245', '180', '2', '67', '0', '45', 'FreshFarms Co', 'No', 'No', 'No', '5', '489', 'Yes'],
            ['SKU-39201', 'Winter Jacket - Black L', 'Apparel', 'Store-018', '12', '25', '14', '3', '2', '180', 'ClothingCorp', 'Yes', 'No', 'No', 'N/A', '42', 'Yes'],
            ['SKU-74652', 'LED Smart Bulb 4-Pack', 'Electronics', 'Warehouse-05', '890', '500', '7', '45', '0', '320', 'TechSupply Inc', 'No', 'Yes', 'No', 'N/A', '378', 'No'],
            ['SKU-15483', 'Sunscreen SPF 50', 'Health & Beauty', 'Store-067', '34', '80', '5', '18', '4', '28', 'BeautyWorks', 'Yes', 'No', 'Yes', '210', '156', 'Yes'],
            ['SKU-93829', 'Holiday Gift Set', 'Seasonal', 'Store-023', '156', '200', '10', '8', '1', '95', 'GiftMasters', 'Yes', 'Yes', 'No', 'N/A', '89', 'No'],
          ]
        },
        column_statistics: {
          current_stock: { min: 0, max: 5000, mean: 287, median: 145 },
          avg_daily_sales: { min: 1, max: 200, mean: 23, median: 15 }
        }
      },

      // 8. EMPLOYEE ATTRITION - HR Analytics
      {
        id: '88888888-8888-4888-8888-888888888888',
        name: 'HR Talent Retention Analysis',
        description: '4,200 employees with 18% annual attrition. Predict departures 90 days early, reducing recruitment costs by $1.2M/year.',
        row_count: 4200,
        column_count: 19,
        dateUploaded: now,
        file_type: 'csv',
        file_size: '1.1 MB',
        project_id: '1',
        preview_data: {
          columns: [
            'employee_id', 'department', 'role', 'tenure_years', 'age', 'salary',
            'performance_rating', 'promotions_count', 'training_hours_annual', 'remote_days_month',
            'commute_time_min', 'manager_rating', 'team_size', 'overtime_hours_month',
            'projects_count', 'last_raise_months', 'satisfaction_score', 'external_offers', 'left_company'
          ],
          rows: [
            ['EMP-7294', 'Engineering', 'Senior Developer', '4.5', '32', '135000', '4.2', '2', '40', '20', '15', '4.5', '8', '12', '4', '8', '8.2', '0', 'No'],
            ['EMP-8301', 'Sales', 'Account Executive', '1.2', '28', '75000', '3.8', '0', '24', '0', '45', '3.9', '12', '28', '12', '18', '5.4', '2', 'Yes'],
            ['EMP-5829', 'Marketing', 'Product Marketing Manager', '6.8', '38', '142000', '4.5', '3', '52', '15', '20', '4.7', '5', '8', '3', '5', '9.1', '0', 'No'],
            ['EMP-9472', 'Customer Success', 'CS Representative', '2.1', '26', '58000', '3.2', '0', '18', '5', '60', '3.5', '15', '22', '8', '24', '4.8', '1', 'Yes'],
            ['EMP-3847', 'Engineering', 'Engineering Manager', '8.3', '41', '185000', '4.8', '4', '35', '22', '10', '4.9', '12', '15', '2', '6', '9.5', '0', 'No'],
          ]
        },
        column_statistics: {
          salary: { min: 45000, max: 285000, mean: 98400, median: 87500 },
          satisfaction_score: { min: 1, max: 10, mean: 7.2, median: 7.5 }
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