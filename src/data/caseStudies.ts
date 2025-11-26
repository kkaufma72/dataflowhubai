// Customer Case Studies
// IMPORTANT: Replace with actual customer success stories

export interface CaseStudy {
  id: string;
  slug: string;
  company: string;
  companySize: string;
  industry: string;
  logo?: string;
  featured: boolean;
  summary: string;
  challenge: string;
  solution: string;
  results: {
    metric: string;
    before: string;
    after: string;
    improvement: string;
  }[];
  testimonial: {
    quote: string;
    author: string;
    role: string;
    photo?: string;
  };
  tags: string[];
  publishedDate: string;
}

export const caseStudies: CaseStudy[] = [
  {
    id: '1',
    slug: 'retail-analytics-92-percent-faster',
    company: 'Mid-Size Retail Chain',
    companySize: '500+ stores, 5-person data team',
    industry: 'Retail Analytics',
    featured: true,
    summary: 'How a retail analytics team cut model training time by 92% and achieved ROI in the first month',
    challenge: 'Manual model training took 3-4 weeks per campaign. Data scientists spent 60% of their time on data prep and hyperparameter tuning instead of strategic analysis.',
    solution: 'Implemented DataFlowHub\'s AutoML pipeline with automated data cleaning, one-click model training (testing 50+ algorithms), and instant deployment to production.',
    results: [
      {
        metric: 'Model Training Time',
        before: '3 weeks',
        after: '2 days',
        improvement: '92% reduction'
      },
      {
        metric: 'Models Deployed per Quarter',
        before: '4 models',
        after: '12 models',
        improvement: '3x increase'
      },
      {
        metric: 'Annual Cost Savings',
        before: '$0',
        after: '$180K',
        improvement: 'ROI in month 1'
      },
      {
        metric: 'Data Prep Time',
        before: '2 days',
        after: '10 minutes',
        improvement: '99% reduction'
      }
    ],
    testimonial: {
      quote: 'DataFlowHub freed my team to focus on insights instead of infrastructure. We\'re now shipping models faster than our competitors and our forecasting accuracy improved by 15%.',
      author: 'Sarah Chen',
      role: 'Head of Data Science'
    },
    tags: ['Retail', 'AutoML', 'Time Savings', 'Cost Reduction'],
    publishedDate: '2024-11-15'
  },
  {
    id: '2',
    slug: 'fintech-fraud-detection',
    company: 'FinTech Payment Processor',
    companySize: 'Series B, 50M+ transactions/month',
    industry: 'Financial Technology',
    featured: true,
    summary: 'Payment processor reduced fraud losses by $2.4M annually with automated anomaly detection',
    challenge: 'Manual fraud review process flagged 8% false positives, costing $400K/month in declined legitimate transactions. Rule-based system couldn\'t adapt to new fraud patterns.',
    solution: 'Built real-time fraud detection models using DataFlowHub\'s ensemble ML algorithms. Automated retraining pipeline updates models weekly based on new fraud patterns.',
    results: [
      {
        metric: 'False Positive Rate',
        before: '8%',
        after: '1.2%',
        improvement: '85% reduction'
      },
      {
        metric: 'Fraud Detection Accuracy',
        before: '87%',
        after: '96.7%',
        improvement: '+9.7 points'
      },
      {
        metric: 'Annual Fraud Losses',
        before: '$5.2M',
        after: '$2.8M',
        improvement: '$2.4M saved'
      },
      {
        metric: 'Model Update Frequency',
        before: 'Quarterly (manual)',
        after: 'Weekly (automated)',
        improvement: '12x faster'
      }
    ],
    testimonial: {
      quote: 'We went from quarterly model updates to weekly automated retraining. The system learns new fraud patterns before they become expensive problems. DataFlowHub paid for itself in the first week.',
      author: 'Michael Rodriguez',
      role: 'VP of Risk Management'
    },
    tags: ['FinTech', 'Fraud Detection', 'Real-Time ML', 'Revenue Protection'],
    publishedDate: '2024-10-22'
  },
  {
    id: '3',
    slug: 'healthcare-patient-readmission',
    company: 'Regional Hospital Network',
    companySize: '12 hospitals, 2,500 beds',
    industry: 'Healthcare',
    featured: true,
    summary: 'Hospital network reduced 30-day readmissions by 34% using predictive risk scoring',
    challenge: 'High readmission rates (18%) resulted in $3M annual Medicare penalties. Manual risk assessment was subjective and inconsistent across facilities.',
    solution: 'Deployed DataFlowHub predictive model analyzing 200+ patient factors to generate readmission risk scores. Integrated with EHR system to flag high-risk patients at discharge.',
    results: [
      {
        metric: '30-Day Readmission Rate',
        before: '18%',
        after: '11.9%',
        improvement: '34% reduction'
      },
      {
        metric: 'Medicare Penalties Avoided',
        before: '$3M/year',
        after: '$450K/year',
        improvement: '$2.55M saved'
      },
      {
        metric: 'High-Risk Patient Identification',
        before: '52% accuracy',
        after: '89% accuracy',
        improvement: '+37 points'
      },
      {
        metric: 'Care Coordinator Efficiency',
        before: '15 patients/day',
        after: '40 patients/day',
        improvement: '167% increase'
      }
    ],
    testimonial: {
      quote: 'The AI identifies at-risk patients we would have missed with manual review. Our care coordinators can focus interventions where they\'ll have the biggest impact. We\'ve seen measurable improvements in patient outcomes.',
      author: 'Dr. Jennifer Park',
      role: 'Chief Medical Officer'
    },
    tags: ['Healthcare', 'Predictive Analytics', 'Patient Outcomes', 'Compliance'],
    publishedDate: '2024-09-10'
  },
  {
    id: '4',
    slug: 'ecommerce-customer-lifetime-value',
    company: 'E-Commerce Fashion Retailer',
    companySize: '$50M annual revenue, 500K customers',
    industry: 'E-Commerce',
    featured: false,
    summary: 'Fashion retailer increased customer lifetime value by 45% with personalized recommendations',
    challenge: 'Generic product recommendations resulted in low engagement (2.3% click-through). Marketing team lacked data science expertise to build personalization models.',
    solution: 'Used DataFlowHub\'s no-code ML to build customer segmentation and product recommendation models. Integrated predictions into email campaigns and website.',
    results: [
      {
        metric: 'Email Click-Through Rate',
        before: '2.3%',
        after: '8.7%',
        improvement: '278% increase'
      },
      {
        metric: 'Average Order Value',
        before: '$67',
        after: '$94',
        improvement: '+$27 (40%)'
      },
      {
        metric: 'Customer Lifetime Value',
        before: '$340',
        after: '$493',
        improvement: '+$153 (45%)'
      },
      {
        metric: 'Model Development Time',
        before: 'N/A (no models)',
        after: '2 days',
        improvement: 'Enabled by no-code'
      }
    ],
    testimonial: {
      quote: 'Our marketing team built sophisticated ML models without hiring data scientists. The personalization drove a 45% increase in LTV - our best ROI marketing initiative ever.',
      author: 'Amanda Thompson',
      role: 'Director of Marketing'
    },
    tags: ['E-Commerce', 'Personalization', 'Marketing', 'Revenue Growth'],
    publishedDate: '2024-08-05'
  },
  {
    id: '5',
    slug: 'manufacturing-predictive-maintenance',
    company: 'Industrial Equipment Manufacturer',
    companySize: 'Fortune 500, 40 production facilities',
    industry: 'Manufacturing',
    featured: false,
    summary: 'Manufacturer reduced unplanned downtime by 63% with predictive maintenance AI',
    challenge: 'Reactive maintenance approach led to unexpected equipment failures costing $1.2M/month in downtime. Preventive maintenance was inefficient (30% unnecessary).',
    solution: 'Deployed DataFlowHub IoT sensor analytics to predict equipment failures 7-14 days in advance. Maintenance scheduled during planned downtime windows.',
    results: [
      {
        metric: 'Unplanned Downtime',
        before: '240 hours/month',
        after: '89 hours/month',
        improvement: '63% reduction'
      },
      {
        metric: 'Maintenance Cost Savings',
        before: '$2.8M/year',
        after: '$1.9M/year',
        improvement: '$900K saved'
      },
      {
        metric: 'Equipment Lifespan',
        before: '7 years avg',
        after: '9.5 years avg',
        improvement: '+36% longer'
      },
      {
        metric: 'Prediction Accuracy',
        before: 'N/A',
        after: '91%',
        improvement: '7-14 day advance warning'
      }
    ],
    testimonial: {
      quote: 'Predictive maintenance transformed our operations. We fix equipment before it breaks, during scheduled windows. The ROI was 8x in year one.',
      author: 'James Patterson',
      role: 'VP of Operations'
    },
    tags: ['Manufacturing', 'IoT', 'Predictive Maintenance', 'Cost Savings'],
    publishedDate: '2024-07-18'
  }
];

// Helper functions
export const getFeaturedCaseStudies = () => caseStudies.filter(cs => cs.featured);
export const getCaseStudyBySlug = (slug: string) => caseStudies.find(cs => cs.slug === slug);
export const getCaseStudiesByIndustry = (industry: string) => 
  caseStudies.filter(cs => cs.industry.toLowerCase().includes(industry.toLowerCase()));
export const getCaseStudiesByTag = (tag: string) => 
  caseStudies.filter(cs => cs.tags.some(t => t.toLowerCase() === tag.toLowerCase()));
