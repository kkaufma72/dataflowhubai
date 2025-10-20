// src/lib/syntheticDataGenerator.ts

export type DataGeneratorType = 
  | 'financial' 
  | 'ecommerce' 
  | 'healthcare' 
  | 'marketing' 
  | 'iot' 
  | 'social_media'
  | 'hr'
  | 'education';

export interface SyntheticDataset {
  columns: string[];
  rows: any[][];
  metadata: {
    type: DataGeneratorType;
    rowCount: number;
    generatedAt: string;
  };
}

/**
 * Generate synthetic dataset based on type
 */
export const generateSyntheticDataset = (
  type: DataGeneratorType,
  rowCount: number = 1000
): SyntheticDataset => {
  switch (type) {
    case 'financial':
      return generateFinancialData(rowCount);
    case 'ecommerce':
      return generateEcommerceData(rowCount);
    case 'healthcare':
      return generateHealthcareData(rowCount);
    case 'marketing':
      return generateMarketingData(rowCount);
    case 'iot':
      return generateIoTData(rowCount);
    case 'social_media':
      return generateSocialMediaData(rowCount);
    case 'hr':
      return generateHRData(rowCount);
    case 'education':
      return generateEducationData(rowCount);
    default:
      return generateFinancialData(rowCount);
  }
};

/**
 * Generate financial transaction data
 */
const generateFinancialData = (rowCount: number): SyntheticDataset => {
  const columns = [
    'transaction_id',
    'date',
    'account_id',
    'transaction_type',
    'amount',
    'balance',
    'category',
    'merchant',
    'location',
    'status'
  ];

  const transactionTypes = ['debit', 'credit', 'transfer', 'withdrawal', 'deposit'];
  const categories = ['groceries', 'entertainment', 'utilities', 'transportation', 'healthcare', 'shopping', 'dining'];
  const merchants = ['Walmart', 'Amazon', 'Target', 'Starbucks', 'Shell', 'CVS', 'Best Buy'];
  const locations = ['New York, NY', 'Los Angeles, CA', 'Chicago, IL', 'Houston, TX', 'Phoenix, AZ'];
  const statuses = ['completed', 'pending', 'failed'];

  const rows: any[][] = [];
  let balance = 5000;

  for (let i = 0; i < rowCount; i++) {
    const type = randomChoice(transactionTypes);
    const amount = randomFloat(10, 500);
    
    if (type === 'debit' || type === 'withdrawal') {
      balance -= amount;
    } else {
      balance += amount;
    }

    rows.push([
      `TXN${String(i + 1).padStart(6, '0')}`,
      randomDate(new Date(2023, 0, 1), new Date()).toISOString().split('T')[0],
      `ACC${randomInt(1000, 9999)}`,
      type,
      amount.toFixed(2),
      balance.toFixed(2),
      randomChoice(categories),
      randomChoice(merchants),
      randomChoice(locations),
      randomChoice(statuses)
    ]);
  }

  return {
    columns,
    rows,
    metadata: {
      type: 'financial',
      rowCount,
      generatedAt: new Date().toISOString()
    }
  };
};

/**
 * Generate e-commerce data
 */
const generateEcommerceData = (rowCount: number): SyntheticDataset => {
  const columns = [
    'order_id',
    'customer_id',
    'product_name',
    'category',
    'quantity',
    'unit_price',
    'total_price',
    'order_date',
    'shipping_method',
    'status'
  ];

  const products = ['Laptop', 'Phone', 'Tablet', 'Headphones', 'Camera', 'Watch', 'Keyboard'];
  const categories = ['Electronics', 'Accessories', 'Computing', 'Audio', 'Wearables'];
  const shippingMethods = ['Standard', 'Express', 'Next Day', 'International'];
  const statuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

  const rows: any[][] = [];

  for (let i = 0; i < rowCount; i++) {
    const quantity = randomInt(1, 5);
    const unitPrice = randomFloat(50, 2000);
    const totalPrice = quantity * unitPrice;

    rows.push([
      `ORD${String(i + 1).padStart(6, '0')}`,
      `CUST${randomInt(1000, 9999)}`,
      randomChoice(products),
      randomChoice(categories),
      quantity,
      unitPrice.toFixed(2),
      totalPrice.toFixed(2),
      randomDate(new Date(2023, 0, 1), new Date()).toISOString().split('T')[0],
      randomChoice(shippingMethods),
      randomChoice(statuses)
    ]);
  }

  return {
    columns,
    rows,
    metadata: {
      type: 'ecommerce',
      rowCount,
      generatedAt: new Date().toISOString()
    }
  };
};

/**
 * Generate healthcare patient data
 */
const generateHealthcareData = (rowCount: number): SyntheticDataset => {
  const columns = [
    'patient_id',
    'age',
    'gender',
    'blood_pressure',
    'heart_rate',
    'temperature',
    'diagnosis',
    'treatment',
    'admission_date',
    'discharge_date',
    'insurance_provider'
  ];

  const genders = ['M', 'F', 'Other'];
  const diagnoses = ['Hypertension', 'Diabetes', 'Asthma', 'Arthritis', 'Migraine', 'Allergy'];
  const treatments = ['Medication', 'Surgery', 'Therapy', 'Monitoring', 'Rehabilitation'];
  const insuranceProviders = ['Blue Cross', 'Aetna', 'Cigna', 'United Healthcare', 'Medicare'];

  const rows: any[][] = [];

  for (let i = 0; i < rowCount; i++) {
    const admissionDate = randomDate(new Date(2023, 0, 1), new Date());
    const dischargeDate = new Date(admissionDate.getTime() + randomInt(1, 14) * 24 * 60 * 60 * 1000);

    rows.push([
      `P${String(i + 1).padStart(6, '0')}`,
      randomInt(18, 90),
      randomChoice(genders),
      `${randomInt(110, 140)}/${randomInt(70, 90)}`,
      randomInt(60, 100),
      randomFloat(97.0, 99.5).toFixed(1),
      randomChoice(diagnoses),
      randomChoice(treatments),
      admissionDate.toISOString().split('T')[0],
      dischargeDate.toISOString().split('T')[0],
      randomChoice(insuranceProviders)
    ]);
  }

  return {
    columns,
    rows,
    metadata: {
      type: 'healthcare',
      rowCount,
      generatedAt: new Date().toISOString()
    }
  };
};

/**
 * Generate marketing campaign data
 */
const generateMarketingData = (rowCount: number): SyntheticDataset => {
  const columns = [
    'campaign_id',
    'campaign_name',
    'channel',
    'budget',
    'impressions',
    'clicks',
    'conversions',
    'ctr',
    'conversion_rate',
    'cost_per_click',
    'roi'
  ];

  const channels = ['Facebook', 'Google Ads', 'Instagram', 'LinkedIn', 'Twitter', 'Email'];
  const campaigns = ['Summer Sale', 'Product Launch', 'Brand Awareness', 'Lead Generation', 'Retargeting'];

  const rows: any[][] = [];

  for (let i = 0; i < rowCount; i++) {
    const budget = randomInt(1000, 50000);
    const impressions = randomInt(10000, 1000000);
    const clicks = Math.floor(impressions * randomFloat(0.01, 0.05));
    const conversions = Math.floor(clicks * randomFloat(0.01, 0.1));
    const ctr = ((clicks / impressions) * 100).toFixed(2);
    const conversionRate = ((conversions / clicks) * 100).toFixed(2);
    const cpc = (budget / clicks).toFixed(2);
    const revenue = conversions * randomInt(50, 500);
    const roi = (((revenue - budget) / budget) * 100).toFixed(2);

    rows.push([
      `CMP${String(i + 1).padStart(5, '0')}`,
      randomChoice(campaigns),
      randomChoice(channels),
      budget,
      impressions,
      clicks,
      conversions,
      ctr,
      conversionRate,
      cpc,
      roi
    ]);
  }

  return {
    columns,
    rows,
    metadata: {
      type: 'marketing',
      rowCount,
      generatedAt: new Date().toISOString()
    }
  };
};

/**
 * Generate IoT sensor data
 */
const generateIoTData = (rowCount: number): SyntheticDataset => {
  const columns = [
    'device_id',
    'timestamp',
    'temperature',
    'humidity',
    'pressure',
    'battery_level',
    'signal_strength',
    'location_lat',
    'location_lon',
    'status'
  ];

  const statuses = ['active', 'idle', 'warning', 'error'];

  const rows: any[][] = [];

  for (let i = 0; i < rowCount; i++) {
    rows.push([
      `DEV${String(randomInt(1, 100)).padStart(3, '0')}`,
      new Date(Date.now() - randomInt(0, 86400000)).toISOString(),
      randomFloat(15, 35).toFixed(2),
      randomFloat(30, 80).toFixed(2),
      randomFloat(980, 1020).toFixed(2),
      randomInt(0, 100),
      randomInt(-90, -30),
      randomFloat(25, 50).toFixed(6),
      randomFloat(-125, -70).toFixed(6),
      randomChoice(statuses)
    ]);
  }

  return {
    columns,
    rows,
    metadata: {
      type: 'iot',
      rowCount,
      generatedAt: new Date().toISOString()
    }
  };
};

/**
 * Generate social media data
 */
const generateSocialMediaData = (rowCount: number): SyntheticDataset => {
  const columns = [
    'post_id',
    'user_id',
    'platform',
    'post_type',
    'likes',
    'comments',
    'shares',
    'engagement_rate',
    'timestamp',
    'sentiment'
  ];

  const platforms = ['Facebook', 'Instagram', 'Twitter', 'LinkedIn', 'TikTok'];
  const postTypes = ['text', 'image', 'video', 'link', 'poll'];
  const sentiments = ['positive', 'neutral', 'negative'];

  const rows: any[][] = [];

  for (let i = 0; i < rowCount; i++) {
    const likes = randomInt(0, 10000);
    const comments = randomInt(0, 1000);
    const shares = randomInt(0, 500);
    const followers = randomInt(100, 50000);
    const engagementRate = (((likes + comments + shares) / followers) * 100).toFixed(2);

    rows.push([
      `POST${String(i + 1).padStart(6, '0')}`,
      `USER${randomInt(1000, 9999)}`,
      randomChoice(platforms),
      randomChoice(postTypes),
      likes,
      comments,
      shares,
      engagementRate,
      randomDate(new Date(2023, 0, 1), new Date()).toISOString(),
      randomChoice(sentiments)
    ]);
  }

  return {
    columns,
    rows,
    metadata: {
      type: 'social_media',
      rowCount,
      generatedAt: new Date().toISOString()
    }
  };
};

/**
 * Generate HR employee data
 */
const generateHRData = (rowCount: number): SyntheticDataset => {
  const columns = [
    'employee_id',
    'department',
    'job_title',
    'salary',
    'hire_date',
    'performance_rating',
    'training_hours',
    'projects_completed',
    'sick_days',
    'status'
  ];

  const departments = ['Engineering', 'Sales', 'Marketing', 'HR', 'Finance', 'Operations'];
  const jobTitles = ['Manager', 'Senior', 'Junior', 'Lead', 'Director', 'Analyst'];
  const statuses = ['active', 'on_leave', 'terminated'];

  const rows: any[][] = [];

  for (let i = 0; i < rowCount; i++) {
    rows.push([
      `EMP${String(i + 1).padStart(5, '0')}`,
      randomChoice(departments),
      randomChoice(jobTitles),
      randomInt(40000, 150000),
      randomDate(new Date(2015, 0, 1), new Date()).toISOString().split('T')[0],
      randomFloat(1, 5).toFixed(1),
      randomInt(0, 100),
      randomInt(0, 50),
      randomInt(0, 15),
      randomChoice(statuses)
    ]);
  }

  return {
    columns,
    rows,
    metadata: {
      type: 'hr',
      rowCount,
      generatedAt: new Date().toISOString()
    }
  };
};

/**
 * Generate education student data
 */
const generateEducationData = (rowCount: number): SyntheticDataset => {
  const columns = [
    'student_id',
    'grade_level',
    'subject',
    'test_score',
    'attendance_rate',
    'homework_completion',
    'participation_score',
    'gpa',
    'enrollment_date',
    'status'
  ];

  const gradeLevels = ['9th', '10th', '11th', '12th'];
  const subjects = ['Math', 'Science', 'English', 'History', 'Arts'];
  const statuses = ['enrolled', 'graduated', 'transferred', 'withdrawn'];

  const rows: any[][] = [];

  for (let i = 0; i < rowCount; i++) {
    rows.push([
      `STU${String(i + 1).padStart(6, '0')}`,
      randomChoice(gradeLevels),
      randomChoice(subjects),
      randomInt(50, 100),
      randomFloat(75, 100).toFixed(1),
      randomFloat(60, 100).toFixed(1),
      randomInt(1, 10),
      randomFloat(2.0, 4.0).toFixed(2),
      randomDate(new Date(2020, 0, 1), new Date()).toISOString().split('T')[0],
      randomChoice(statuses)
    ]);
  }

  return {
    columns,
    rows,
    metadata: {
      type: 'education',
      rowCount,
      generatedAt: new Date().toISOString()
    }
  };
};

// Helper functions
const randomInt = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

const randomFloat = (min: number, max: number): number => {
  return Math.random() * (max - min) + min;
};

const randomChoice = <T>(array: T[]): T => {
  return array[Math.floor(Math.random() * array.length)];
};

const randomDate = (start: Date, end: Date): Date => {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
};