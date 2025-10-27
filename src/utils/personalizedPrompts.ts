// Personalized AI Prompt Engine
// Tailors AI responses based on user profile (company, job title, use case, etc.)

import { Dataset } from '../types';

export interface UserProfile {
  full_name?: string;
  company?: string;
  job_title?: string;
  use_case?: string;
  linkedin_url?: string;
  email?: string;
}

export interface DatasetChatContext {
  dataset: Dataset;
  userProfile: UserProfile;
  conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>;
}

/**
 * Build a personalized system prompt based on user profile
 */
export const buildPersonalizedSystemPrompt = (context: DatasetChatContext): string => {
  const { dataset, userProfile } = context;
  
  // Base prompt
  let systemPrompt = `You are an expert data analyst and AI assistant helping with dataset analysis.

**Current Dataset:** "${dataset.name}"
**Description:** ${dataset.description || 'No description available'}
**Structure:** ${dataset.rows || 0} rows × ${dataset.columns || 0} columns
**File Type:** ${dataset.fileType || 'unknown'}
`;

  // Add dataset preview if available
  if (dataset.preview_data?.columns) {
    systemPrompt += `\n**Columns:** ${dataset.preview_data.columns.join(', ')}`;
    
    if (dataset.preview_data.rows && dataset.preview_data.rows.length > 0) {
      systemPrompt += `\n**Sample Data (first 3 rows):**\n`;
      dataset.preview_data.rows.slice(0, 3).forEach((row, idx) => {
        systemPrompt += `Row ${idx + 1}: ${JSON.stringify(row)}\n`;
      });
    }
  }

  systemPrompt += `\n---\n\n`;

  // Personalize based on user profile
  systemPrompt += buildPersonalizedContext(userProfile);

  // Add behavioral guidelines
  systemPrompt += `\n\n**Your Role:**
- Provide actionable insights about the dataset
- Suggest relevant analyses based on the user's industry and use case
- Explain technical concepts in terms relevant to their job role
- Be concise but thorough
- Use industry-specific examples when possible
- Proactively suggest next steps

**Response Style:**
- Start with a direct answer
- Use bullet points for clarity
- Include specific column names and data values
- Suggest visualizations or analyses when relevant
- Keep responses under 200 words unless asked for detail

**Capabilities:**
- Analyze data quality and completeness
- Suggest feature engineering approaches
- Recommend ML models for specific use cases
- Explain statistical patterns
- Help with data cleaning strategies
`;

  return systemPrompt;
};

/**
 * Build personalized context section based on user profile
 */
const buildPersonalizedContext = (profile: UserProfile): string => {
  let context = `**User Context:**\n`;
  
  // Add name
  if (profile.full_name) {
    context += `- Name: ${profile.full_name}\n`;
  }

  // Add job title with context
  if (profile.job_title) {
    context += `- Role: ${profile.job_title}\n`;
    context += getJobTitleContext(profile.job_title);
  }

  // Add company with context
  if (profile.company) {
    context += `- Company: ${profile.company}\n`;
    context += getCompanyContext(profile.company);
  }

  // Add use case with specific guidance
  if (profile.use_case) {
    context += `- Primary Use Case: ${formatUseCase(profile.use_case)}\n`;
    context += getUseCaseGuidance(profile.use_case);
  }

  // Add expertise level hint from LinkedIn
  if (profile.linkedin_url) {
    context += `- Has LinkedIn profile (likely professional)\n`;
    context += `- Adjust explanations: Assume moderate to advanced data literacy\n`;
  }

  return context;
};

/**
 * Get context and expectations based on job title
 */
const getJobTitleContext = (jobTitle: string): string => {
  const title = jobTitle.toLowerCase();
  
  if (title.includes('ceo') || title.includes('founder') || title.includes('executive')) {
    return `  → Focus on: Business impact, ROI, executive summaries\n  → Avoid: Deep technical jargon\n  → Emphasize: Strategic insights, high-level patterns\n`;
  }
  
  if (title.includes('data scientist') || title.includes('ml engineer') || title.includes('machine learning')) {
    return `  → Focus on: Technical accuracy, statistical rigor, ML algorithms\n  → Use: Advanced terminology, mathematical concepts\n  → Emphasize: Model performance, feature importance, optimization\n`;
  }
  
  if (title.includes('analyst') || title.includes('business intelligence')) {
    return `  → Focus on: Actionable insights, visualizations, trends\n  → Balance: Technical and business language\n  → Emphasize: Data quality, patterns, business metrics\n`;
  }
  
  if (title.includes('engineer') || title.includes('developer')) {
    return `  → Focus on: Implementation details, code examples, architecture\n  → Use: Technical language, APIs, integration approaches\n  → Emphasize: Data pipelines, automation, scalability\n`;
  }
  
  if (title.includes('manager') || title.includes('director')) {
    return `  → Focus on: Team enablement, process efficiency, outcomes\n  → Balance: Strategic and tactical insights\n  → Emphasize: Risk mitigation, resource optimization\n`;
  }
  
  if (title.includes('marketing')) {
    return `  → Focus on: Customer segments, campaign effectiveness, attribution\n  → Use: Marketing terminology, conversion metrics\n  → Emphasize: Customer behavior patterns, ROI analysis\n`;
  }

  return `  → Adjust tone based on their professional role\n`;
};

/**
 * Get context based on company (can be enhanced with company lookup)
 */
const getCompanyContext = (company: string): string => {
  const comp = company.toLowerCase();
  
  // Industry hints (basic - can be enhanced with API lookup)
  if (comp.includes('bank') || comp.includes('financial') || comp.includes('capital')) {
    return `  → Industry: Financial services\n  → Prioritize: Fraud detection, risk analysis, compliance\n`;
  }
  
  if (comp.includes('health') || comp.includes('medical') || comp.includes('pharma')) {
    return `  → Industry: Healthcare\n  → Prioritize: Patient outcomes, clinical metrics, HIPAA compliance\n`;
  }
  
  if (comp.includes('retail') || comp.includes('ecommerce') || comp.includes('shop')) {
    return `  → Industry: Retail/E-commerce\n  → Prioritize: Customer behavior, inventory, sales forecasting\n`;
  }
  
  if (comp.includes('tech') || comp.includes('software') || comp.includes('saas')) {
    return `  → Industry: Technology\n  → Prioritize: User analytics, churn prediction, product metrics\n`;
  }

  return '';
};

/**
 * Get specific guidance based on use case
 */
const getUseCaseGuidance = (useCase: string): string => {
  const useCaseMap: { [key: string]: string } = {
    // Business & Finance
    'accounting': `  → Focus on: General ledger, accounts payable/receivable, reconciliation\n  → Suggest: Variance analysis, expense categorization, audit trails\n  → Keywords: Debits, credits, balance sheets, P&L, GAAP compliance\n`,
    'financial-management': `  → Focus on: Cash flow, budgets, financial planning, ROI\n  → Suggest: Trend analysis, budget variance, financial ratios, forecasting\n  → Keywords: Revenue, expenses, profit margins, working capital\n`,
    'taxes': `  → Focus on: Tax calculations, deductions, compliance, reporting\n  → Suggest: Categorization, year-over-year comparisons, tax optimization\n  → Keywords: Deductions, credits, taxable income, quarterly estimates\n`,
    'budgeting': `  → Focus on: Expense tracking, budget allocation, variance analysis\n  → Suggest: Spending patterns, budget optimization, category breakdown\n  → Keywords: Actual vs budget, overspending, cost centers\n`,
    'invoicing': `  → Focus on: Payment tracking, outstanding invoices, revenue recognition\n  → Suggest: Aging reports, collection patterns, cash flow forecasting\n  → Keywords: Due dates, payment terms, receivables, collections\n`,
    'payroll': `  → Focus on: Payroll processing, tax withholding, compliance\n  → Suggest: Payroll trends, cost analysis, benefit calculations\n  → Keywords: Gross pay, deductions, overtime, tax withholding\n`,
    
    // Industry-Specific
    'real-estate': `  → Focus on: Property values, rental income, market trends, ROI\n  → Suggest: Comparable analysis, cap rate calculations, occupancy rates\n  → Keywords: Square footage, price per sqft, rental yield, appreciation\n`,
    'retail': `  → Focus on: Sales performance, inventory turnover, customer analytics\n  → Suggest: Product performance, seasonal trends, customer segmentation\n  → Keywords: SKU, inventory levels, sell-through rate, margins\n`,
    'healthcare': `  → Focus on: Patient outcomes, treatment effectiveness, operational metrics\n  → Suggest: Readmission rates, treatment costs, quality indicators\n  → Keywords: ICD codes, patient demographics, clinical outcomes, HIPAA\n`,
    'legal': `  → Focus on: Case management, billable hours, client tracking\n  → Suggest: Time analysis, case outcomes, revenue per matter\n  → Keywords: Billable hours, matter types, client retention, settlements\n`,
    'manufacturing': `  → Focus on: Production efficiency, quality control, inventory management\n  → Suggest: Defect rates, cycle time, yield analysis, throughput\n  → Keywords: Units produced, defects, downtime, OEE\n`,
    'construction': `  → Focus on: Project costs, timelines, resource allocation\n  → Suggest: Cost overruns, milestone tracking, labor productivity\n  → Keywords: Change orders, schedule variance, cost per sqft, labor hours\n`,
    
    // Analytics & Insights
    'business-analytics': `  → Focus on: KPIs, dashboards, performance metrics, trends\n  → Suggest: Time-series analysis, cohort analysis, funnel metrics\n  → Keywords: Metrics, benchmarks, growth rates, conversion rates\n`,
    'customer-insights': `  → Focus on: Customer segmentation, behavior patterns, lifetime value\n  → Suggest: RFM analysis, churn prediction, satisfaction scores\n  → Keywords: CLV, retention, segments, customer journey\n`,
    'sales-forecasting': `  → Focus on: Revenue predictions, pipeline analysis, quota attainment\n  → Suggest: Trend models, seasonality, win rate analysis\n  → Keywords: Pipeline, quotas, ARR, close rates, forecast accuracy\n`,
    'marketing-analytics': `  → Focus on: Campaign ROI, attribution, conversion optimization\n  → Suggest: Channel performance, A/B testing, customer acquisition cost\n  → Keywords: CTR, CAC, ROAS, conversion rate, attribution models\n`,
    'hr-analytics': `  → Focus on: Workforce planning, turnover, performance metrics\n  → Suggest: Retention analysis, hiring trends, productivity metrics\n  → Keywords: Headcount, attrition, time-to-hire, performance ratings\n`,
    
    // Personal Use
    'personal-finance': `  → Focus on: Expense tracking, savings, investment performance\n  → Suggest: Spending patterns, net worth tracking, budget adherence\n  → Keywords: Savings rate, debt-to-income, portfolio returns, expenses\n`,
    'personal-projects': `  → Focus on: General analysis, learning, experimentation\n  → Suggest: Exploratory analysis, visualizations, basic statistics\n  → Keywords: Trends, patterns, correlations, summaries\n`,
    'education': `  → Focus on: Learning data concepts, academic projects, research\n  → Suggest: Step-by-step explanations, educational examples\n  → Keywords: Explain like I'm learning, tutorials, examples\n`,
    
    // Advanced
    'predictive-analytics': `  → Focus on: Forecasting, predictive models, machine learning\n  → Suggest: Model selection, feature engineering, validation\n  → Keywords: Predictions, models, accuracy, cross-validation\n`,
    'fraud-detection': `  → Focus on: Anomaly detection, risk scoring, pattern recognition\n  → Suggest: Classification models, outlier detection, flagging rules\n  → Keywords: Anomalies, fraud scores, false positives, risk levels\n`,
    'risk-management': `  → Focus on: Risk assessment, mitigation strategies, compliance\n  → Suggest: Risk scoring, scenario analysis, probability distributions\n  → Keywords: Risk factors, probability, impact, mitigation\n`,
    'data-science': `  → Focus on: Advanced analytics, ML models, statistical analysis\n  → Suggest: Feature engineering, model optimization, validation\n  → Keywords: Algorithms, hyperparameters, metrics, pipelines\n`,
    'general': `  → Provide balanced, general-purpose data science guidance\n`
  };

  return useCaseMap[useCase] || useCaseMap['general'];
};

/**
 * Format use case for display
 */
const formatUseCase = (useCase: string): string => {
  const formatted = useCase.replace(/-/g, ' ');
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
};

/**
 * Build a user message with context
 */
export const buildUserMessage = (
  question: string,
  context: DatasetChatContext
): string => {
  return question; // User message stays as-is, context is in system prompt
};

/**
 * Get example questions tailored to user's role and use case
 */
export const getSuggestedQuestions = (
  dataset: Dataset,
  userProfile: UserProfile
): string[] => {
  const suggestions: string[] = [];
  
  // Role-specific questions
  if (userProfile.job_title?.toLowerCase().includes('ceo') || 
      userProfile.job_title?.toLowerCase().includes('executive')) {
    suggestions.push(
      "What are the key business insights from this data?",
      "What trends should I be aware of?",
      "What's the ROI potential of this dataset?"
    );
  } else if (userProfile.job_title?.toLowerCase().includes('data scientist')) {
    suggestions.push(
      "What's the data quality score and main issues?",
      "Which features have the highest predictive power?",
      "What ML models would work best for this data?"
    );
  } else if (userProfile.job_title?.toLowerCase().includes('analyst')) {
    suggestions.push(
      "What are the main patterns in this data?",
      "Are there any outliers or anomalies?",
      "What visualizations would be most insightful?"
    );
  }

  // Use case-specific questions
  const useCaseQuestions: { [key: string]: string[] } = {
    'accounting': [
      "What are the top expense categories?",
      "Are there any reconciliation discrepancies?",
      "Show me the monthly expense trends"
    ],
    'financial-management': [
      "What's my current cash flow situation?",
      "Which areas are over/under budget?",
      "What are my key financial ratios?"
    ],
    'taxes': [
      "What deductions can I identify in this data?",
      "Show me year-over-year tax liability changes",
      "Which categories have the most tax implications?"
    ],
    'real-estate': [
      "What's the average price per square foot?",
      "Which properties have the best ROI?",
      "Show me rental income trends"
    ],
    'budgeting': [
      "Where am I overspending?",
      "What's my spending pattern by category?",
      "How can I optimize my budget allocation?"
    ],
    'invoicing': [
      "Which invoices are overdue?",
      "What's my average days to payment?",
      "Show me revenue by customer"
    ],
    'payroll': [
      "What are the total payroll costs?",
      "Show me overtime trends",
      "Which departments have the highest labor costs?"
    ],
    'retail': [
      "Which products are top sellers?",
      "What's my inventory turnover rate?",
      "Show me seasonal sales patterns"
    ],
    'customer-insights': [
      "What customer segments exist?",
      "Who are my most valuable customers?",
      "What's driving customer churn?"
    ],
    'sales-forecasting': [
      "What's next quarter's revenue forecast?",
      "Which products will perform best?",
      "What factors affect our sales?"
    ],
    'personal-finance': [
      "Where do I spend the most money?",
      "Am I on track with my savings goals?",
      "What's my monthly spending trend?"
    ],
    'fraud-detection': [
      "Are there any suspicious transactions?",
      "What patterns indicate potential fraud?",
      "Which records should I investigate?"
    ]
  };

  const useCaseSuggestions = useCaseQuestions[userProfile.use_case || ''];
  if (useCaseSuggestions) {
    suggestions.push(...useCaseSuggestions);
  }

  // Dataset-specific questions
  if (dataset.preview_data?.columns) {
    const columns = dataset.preview_data.columns;
    
    // Find potential target columns
    const targetKeywords = ['churn', 'fraud', 'target', 'outcome', 'revenue', 'sales'];
    const targetCol = columns.find(col => 
      targetKeywords.some(keyword => col.toLowerCase().includes(keyword))
    );
    
    if (targetCol) {
      suggestions.push(`What predicts ${targetCol} in this dataset?`);
    }
    
    // Find date columns
    const dateCol = columns.find(col => 
      col.toLowerCase().includes('date') || col.toLowerCase().includes('time')
    );
    
    if (dateCol) {
      suggestions.push(`Show me trends over time using ${dateCol}`);
    }
  }

  // Generic fallbacks
  suggestions.push(
    "Summarize this dataset for me",
    "What should I do with this data first?",
    "What's the data quality like?"
  );

  // Return unique suggestions (max 6)
  return Array.from(new Set(suggestions)).slice(0, 6);
};

/**
 * Format AI response for better readability
 */
export const formatAIResponse = (response: string, userProfile: UserProfile): string => {
  // Add personalized greeting for first message
  if (userProfile.full_name && response.length < 100) {
    const firstName = userProfile.full_name.split(' ')[0];
    return `Hi ${firstName}! ${response}`;
  }
  
  return response;
};

/**
 * Get expertise level from profile
 */
export const getUserExpertiseLevel = (profile: UserProfile): 'beginner' | 'intermediate' | 'advanced' => {
  const title = (profile.job_title || '').toLowerCase();
  
  if (title.includes('data scientist') || 
      title.includes('ml engineer') || 
      title.includes('machine learning') ||
      title.includes('phd') ||
      title.includes('research')) {
    return 'advanced';
  }
  
  if (title.includes('analyst') || 
      title.includes('engineer') || 
      title.includes('developer') ||
      profile.linkedin_url) {
    return 'intermediate';
  }
  
  return 'beginner';
};

/**
 * Get communication style based on role
 */
export const getCommunicationStyle = (profile: UserProfile): {
  tone: string;
  detailLevel: string;
  terminology: string;
} => {
  const title = (profile.job_title || '').toLowerCase();
  
  if (title.includes('ceo') || title.includes('executive') || title.includes('founder')) {
    return {
      tone: 'executive-friendly, concise, business-focused',
      detailLevel: 'high-level overview with optional deep-dives',
      terminology: 'business metrics over technical jargon'
    };
  }
  
  if (title.includes('data scientist') || title.includes('ml engineer')) {
    return {
      tone: 'technical, precise, statistical',
      detailLevel: 'detailed with mathematical rigor',
      terminology: 'use statistical terms, algorithms, metrics freely'
    };
  }
  
  if (title.includes('analyst')) {
    return {
      tone: 'balanced, practical, insight-driven',
      detailLevel: 'moderate detail with visualizations',
      terminology: 'blend of business and technical terms'
    };
  }
  
  if (title.includes('marketing')) {
    return {
      tone: 'results-oriented, campaign-focused',
      detailLevel: 'actionable insights with examples',
      terminology: 'marketing metrics (CTR, conversion, ROI)'
    };
  }
  
  return {
    tone: 'friendly, educational, clear',
    detailLevel: 'explain concepts as you go',
    terminology: 'avoid jargon, define technical terms'
  };
};

