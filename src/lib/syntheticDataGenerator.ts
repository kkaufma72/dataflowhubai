// File: src/lib/syntheticDataGenerator.ts

export interface SyntheticDatasetConfig {
  name: string;
  type: 'marketing' | 'sales' | 'customer' | 'ecommerce';
  rowCount: number;
}

const marketingCampaignGenerator = (rowCount: number) => {
  const campaigns = ['Email', 'Social Media', 'PPC', 'Content Marketing', 'SEO'];
  const channels = ['Facebook', 'Google', 'Instagram', 'LinkedIn', 'Email'];
  const statuses = ['Active', 'Paused', 'Completed', 'Draft'];
  
  const data = [];
  const columns = [
    'campaign_id',
    'campaign_name',
    'channel',
    'budget',
    'spend',
    'impressions',
    'clicks',
    'conversions',
    'revenue',
    'start_date',
    'end_date',
    'status',
    'ctr',
    'cpc',
    'roas'
  ];

  for (let i = 0; i < rowCount; i++) {
    const budget = Math.floor(Math.random() * 50000) + 5000;
    const spend = Math.floor(budget * (0.6 + Math.random() * 0.4));
    const impressions = Math.floor(Math.random() * 1000000) + 10000;
    const clicks = Math.floor(impressions * (0.01 + Math.random() * 0.05));
    const conversions = Math.floor(clicks * (0.02 + Math.random() * 0.08));
    const revenue = conversions * (50 + Math.random() * 200);
    
    const startDate = new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1);
    const endDate = new Date(startDate.getTime() + (30 + Math.random() * 60) * 24 * 60 * 60 * 1000);

    data.push([
      `CAMP-${String(i + 1).padStart(5, '0')}`,
      `${campaigns[Math.floor(Math.random() * campaigns.length)]} Campaign ${i + 1}`,
      channels[Math.floor(Math.random() * channels.length)],
      budget,
      spend,
      impressions,
      clicks,
      conversions,
      Math.round(revenue),
      startDate.toISOString().split('T')[0],
      endDate.toISOString().split('T')[0],
      statuses[Math.floor(Math.random() * statuses.length)],
      ((clicks / impressions) * 100).toFixed(2),
      (spend / clicks).toFixed(2),
      (revenue / spend).toFixed(2)
    ]);
  }

  return { columns, data };
};

const salesDataGenerator = (rowCount: number) => {
  const products = ['Widget A', 'Widget B', 'Service X', 'Service Y', 'Bundle Z'];
  const regions = ['North', 'South', 'East', 'West', 'Central'];
  const salespeople = ['John Smith', 'Jane Doe', 'Bob Johnson', 'Alice Williams', 'Charlie Brown'];
  
  const columns = [
    'order_id',
    'date',
    'product',
    'quantity',
    'unit_price',
    'total',
    'region',
    'salesperson',
    'customer_segment',
    'discount_applied'
  ];

  const data = [];
  for (let i = 0; i < rowCount; i++) {
    const quantity = Math.floor(Math.random() * 50) + 1;
    const unitPrice = (10 + Math.random() * 490).toFixed(2);
    const total = (quantity * parseFloat(unitPrice)).toFixed(2);
    const discount = Math.random() > 0.7 ? (Math.random() * 0.2).toFixed(2) : '0.00';
    
    const date = new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1);

    data.push([
      `ORD-${String(i + 1).padStart(6, '0')}`,
      date.toISOString().split('T')[0],
      products[Math.floor(Math.random() * products.length)],
      quantity,
      unitPrice,
      total,
      regions[Math.floor(Math.random() * regions.length)],
      salespeople[Math.floor(Math.random() * salespeople.length)],
      Math.random() > 0.5 ? 'Enterprise' : 'SMB',
      discount
    ]);
  }

  return { columns, data };
};

const customerDataGenerator = (rowCount: number) => {
  const firstNames = ['John', 'Jane', 'Michael', 'Sarah', 'David', 'Emily', 'Robert', 'Lisa'];
  const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis'];
  const cities = ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia'];
  
  const columns = [
    'customer_id',
    'name',
    'email',
    'age',
    'city',
    'signup_date',
    'total_purchases',
    'total_spent',
    'last_purchase_date',
    'loyalty_tier',
    'churn_risk'
  ];

  const data = [];
  for (let i = 0; i < rowCount; i++) {
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const totalPurchases = Math.floor(Math.random() * 50);
    const totalSpent = (totalPurchases * (20 + Math.random() * 200)).toFixed(2);
    
    const signupDate = new Date(2020 + Math.floor(Math.random() * 5), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1);
    const lastPurchase = new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1);
    
    let tier = 'Bronze';
    if (parseFloat(totalSpent) > 5000) tier = 'Gold';
    else if (parseFloat(totalSpent) > 2000) tier = 'Silver';

    data.push([
      `CUST-${String(i + 1).padStart(6, '0')}`,
      `${firstName} ${lastName}`,
      `${firstName.toLowerCase()}.${lastName.toLowerCase()}@email.com`,
      Math.floor(Math.random() * 50) + 18,
      cities[Math.floor(Math.random() * cities.length)],
      signupDate.toISOString().split('T')[0],
      totalPurchases,
      totalSpent,
      lastPurchase.toISOString().split('T')[0],
      tier,
      Math.random() > 0.7 ? 'High' : Math.random() > 0.4 ? 'Medium' : 'Low'
    ]);
  }

  return { columns, data };
};

export const generateSyntheticDataset = (config: SyntheticDatasetConfig) => {
  switch (config.type) {
    case 'marketing':
      return marketingCampaignGenerator(config.rowCount);
    case 'sales':
      return salesDataGenerator(config.rowCount);
    case 'customer':
      return customerDataGenerator(config.rowCount);
    default:
      return marketingCampaignGenerator(config.rowCount);
  }
};

// Function to convert to CSV
export const convertToCSV = (columns: string[], data: any[][]) => {
  const csvContent = [
    columns.join(','),
    ...data.map(row => row.map(cell => 
      typeof cell === 'string' && cell.includes(',') ? `"${cell}"` : cell
    ).join(','))
  ].join('\n');
  
  return csvContent;
};

// Function to download as CSV
export const downloadCSV = (filename: string, columns: string[], data: any[][]) => {
  const csv = convertToCSV(columns, data);
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  window.URL.revokeObjectURL(url);
};