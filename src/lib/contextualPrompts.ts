/**
 * Contextual Prompts - Generate personalized AI prompts based on user profile
 * 
 * This file provides industry-specific and role-specific context to AI assistants
 * to make responses more relevant and actionable.
 */

interface UserContext {
  useCase?: string;
  profession?: string;
  industry?: string;
  objectives?: string[];
}

/**
 * Get base system prompt with user context
 */
export const getContextualSystemPrompt = (userContext: UserContext): string => {
  const { useCase, profession, industry, objectives } = userContext;

  let prompt = `You are an expert AI assistant for DataFlowHub AI, an enterprise AutoML platform. `;

  // Add profession context
  if (profession) {
    const professionContext = getProfessionContext(profession);
    prompt += professionContext + ' ';
  }

  // Add industry context
  if (industry) {
    const industryContext = getIndustryContext(industry);
    prompt += industryContext + ' ';
  }

  // Add use case context
  if (useCase) {
    const useCaseContext = getUseCaseContext(useCase);
    prompt += useCaseContext + ' ';
  }

  // Add objectives context
  if (objectives && objectives.length > 0) {
    prompt += `The user's primary objectives are: ${objectives.join(', ')}. Frame your responses to help achieve these goals. `;
  }

  // Add general guidelines
  prompt += `\n\nGuidelines:
- Provide actionable, specific recommendations
- Use industry-standard terminology appropriate for their profession
- Reference relevant metrics and KPIs for their industry
- Suggest best practices tailored to their use case
- Keep explanations clear but don't oversimplify
- When discussing models or metrics, relate them to their business objectives`;

  return prompt;
};

/**
 * Get profession-specific context
 */
const getProfessionContext = (profession: string): string => {
  const contexts: Record<string, string> = {
    'Data Analyst': 'The user is a Data Analyst who understands data but may need help with advanced ML concepts. Focus on data quality, visualization insights, and how to interpret model outputs. Use statistical terminology and explain ML metrics in terms of business impact.',
    
    'Business Analyst': 'The user is a Business Analyst focused on business value. Emphasize ROI, business metrics, and how ML insights translate to actionable business decisions. Avoid overly technical jargon and focus on practical applications.',
    
    'Product Manager': 'The user is a Product Manager making data-driven product decisions. Focus on user behavior patterns, feature performance, and how ML can improve product metrics. Emphasize A/B testing insights and predictive analytics for product planning.',
    
    'Marketing Manager': 'The user is a Marketing Manager optimizing campaigns and customer engagement. Focus on customer segmentation, campaign performance, conversion optimization, and customer lifetime value predictions. Use marketing metrics like CAC, ROAS, and conversion rates.',
    
    'Sales Manager': 'The user is a Sales Manager focused on pipeline and revenue. Emphasize lead scoring, sales forecasting, deal win probability, and territory optimization. Use sales metrics like win rate, deal velocity, and quota attainment.',
    
    'Operations Manager': 'The user is an Operations Manager optimizing processes and efficiency. Focus on process optimization, resource allocation, inventory management, and operational KPIs. Emphasize cost reduction and efficiency gains.',
    
    'Executive / C-Suite': 'The user is an executive making strategic decisions. Provide high-level insights with clear business impact. Focus on strategic metrics, competitive advantage, and how ML drives business outcomes. Keep technical details minimal unless requested.',
    
    'Data Scientist': 'The user is a Data Scientist with deep technical knowledge. You can use technical terminology freely. Discuss model architectures, hyperparameter tuning strategies, feature engineering techniques, and statistical rigor. Reference academic concepts when relevant.',
    
    'Developer / Engineer': 'The user is a Developer integrating ML into applications. Focus on API usage, deployment strategies, model serving, performance optimization, and technical implementation details. Provide code examples and technical documentation.',
    
    'Consultant': 'The user is a Consultant advising clients on ML strategy. Provide comprehensive analysis with both technical depth and business context. Include industry benchmarks, best practices, and frameworks for client presentations.',
    
    'Entrepreneur': 'The user is an Entrepreneur building an ML-powered product or business. Focus on practical implementation, cost considerations, competitive differentiation, and how to achieve MVP quickly. Balance technical feasibility with business viability.',
    
    'Student': 'The user is a Student learning about ML and data science. Provide educational explanations with clear examples. Explain concepts from first principles, relate to real-world applications, and suggest learning resources.',
    
    'Other': 'The user has a unique role. Provide balanced explanations that combine technical accuracy with business relevance. Ask clarifying questions when needed to better understand their context.',
  };

  return contexts[profession] || contexts['Other'];
};

/**
 * Get industry-specific context
 */
const getIndustryContext = (industry: string): string => {
  const contexts: Record<string, string> = {
    'Technology / SaaS': 'In the tech/SaaS industry, focus on user behavior analytics, churn prediction, usage patterns, feature adoption, and subscription metrics. Reference metrics like MRR, ARR, CAC, LTV, and NPS.',
    
    'Financial Services / Fintech': 'In financial services, emphasize fraud detection, credit risk scoring, transaction patterns, regulatory compliance (know your regulations like GDPR, FCRA), and explainable AI for audit trails. Discuss precision vs. recall tradeoffs in fraud detection.',
    
    'E-commerce / Retail': 'In e-commerce/retail, focus on demand forecasting, inventory optimization, customer segmentation, product recommendations, basket analysis, and conversion optimization. Reference metrics like AOV, conversion rate, and inventory turnover.',
    
    'Healthcare / Biotech': 'In healthcare, prioritize patient safety, regulatory compliance (HIPAA), interpretable models for clinical decisions, readmission prediction, and risk stratification. Always emphasize the importance of model explainability and validation.',
    
    'Manufacturing': 'In manufacturing, focus on predictive maintenance, quality control, supply chain optimization, production forecasting, and defect detection. Discuss IoT sensor data, anomaly detection, and process optimization.',
    
    'Marketing / Advertising': 'In marketing/advertising, emphasize campaign optimization, audience segmentation, attribution modeling, ad spend ROI, and customer journey analytics. Reference metrics like ROAS, CTR, CPA, and conversion rates.',
    
    'Education': 'In education, focus on student performance prediction, dropout risk identification, personalized learning paths, and resource allocation. Consider privacy concerns and ethical implications of student data usage.',
    
    'Consulting': 'In consulting, provide analysis frameworks that can be presented to clients. Include industry benchmarks, competitive insights, and strategic recommendations. Balance technical depth with executive-friendly summaries.',
    
    'Real Estate': 'In real estate, focus on property valuation, market trend analysis, investment opportunity scoring, and tenant risk assessment. Consider location-based features and market dynamics.',
    
    'Insurance': 'In insurance, emphasize risk assessment, claims prediction, fraud detection, pricing optimization, and customer lifetime value. Discuss actuarial concepts and regulatory compliance.',
    
    'Telecommunications': 'In telecommunications, focus on churn prediction, network optimization, service quality monitoring, and usage pattern analysis. Discuss customer segmentation and retention strategies.',
    
    'Transportation / Logistics': 'In transportation/logistics, emphasize route optimization, demand forecasting, fleet management, and delivery time prediction. Discuss supply chain efficiency and cost optimization.',
    
    'Other': 'Provide industry-agnostic advice while being ready to adapt recommendations based on specific industry requirements the user mentions.',
  };

  return contexts[industry] || contexts['Other'];
};

/**
 * Get use case-specific context
 */
const getUseCaseContext = (useCase: string): string => {
  const contexts: Record<string, string> = {
    'predictive_analytics': 'For predictive analytics, focus on forecasting accuracy, feature importance, model interpretability, and actionable insights. Recommend appropriate algorithms based on the prediction type (regression vs. classification).',
    
    'customer_insights': 'For customer insights and segmentation, emphasize clustering techniques, RFM analysis, behavioral patterns, and persona development. Discuss how to translate segments into marketing strategies.',
    
    'fraud_detection': 'For fraud detection, prioritize recall over precision (catching fraudsters is more important than false alarms), real-time detection capabilities, anomaly detection techniques, and explainability for investigations. Discuss class imbalance handling.',
    
    'sales_forecasting': 'For sales forecasting, focus on time series analysis, seasonality detection, trend identification, and confidence intervals. Discuss how to handle external factors like promotions and market conditions.',
    
    'churn_prediction': 'For churn prediction, emphasize early warning indicators, customer health scores, intervention strategies, and measuring model impact on retention. Discuss the cost-benefit analysis of retention campaigns.',
    
    'lead_scoring': 'For lead scoring, focus on identifying high-value leads, optimizing sales team efficiency, and measuring conversion improvements. Discuss feature engineering from CRM data and integration with sales workflows.',
    
    'inventory_optimization': 'For inventory optimization, emphasize demand forecasting, safety stock calculations, reorder point optimization, and cost minimization. Discuss handling stockouts vs. overstocking tradeoffs.',
    
    'sentiment_analysis': 'For sentiment analysis, focus on NLP techniques, handling context and sarcasm, multi-class classification, and extracting actionable insights from customer feedback. Discuss data sources like reviews, social media, and support tickets.',
    
    'other': 'For exploring the platform, provide a balanced introduction to various ML capabilities. Suggest starting with simpler use cases and gradually moving to more complex analyses.',
  };

  return contexts[useCase] || contexts['other'];
};

/**
 * Get contextual example for data analysis
 */
export const getContextualDataExample = (userContext: UserContext): string => {
  const { useCase, industry } = userContext;

  // Use case specific examples
  if (useCase === 'fraud_detection' && industry === 'Financial Services / Fintech') {
    return 'For example, in fraud detection for financial services, you might analyze transaction patterns like: transaction amount, location, time of day, merchant category, and frequency. A sudden large transaction in a foreign country at an unusual hour would be a strong fraud indicator.';
  }

  if (useCase === 'churn_prediction' && industry === 'Technology / SaaS') {
    return 'For SaaS churn prediction, key features include: login frequency, feature usage depth, support ticket count, billing issues, NPS scores, and days since last activity. Users showing declining engagement combined with recent support issues have high churn risk.';
  }

  if (useCase === 'sales_forecasting' && industry === 'E-commerce / Retail') {
    return 'For retail sales forecasting, consider: historical sales trends, seasonality patterns, promotional calendar, inventory levels, and external factors like weather or holidays. December typically shows 3-4x normal sales due to holiday shopping.';
  }

  // Generic example
  return 'For example, when analyzing your data, look for patterns in key metrics over time, correlations between features, and outliers that might indicate interesting behaviors or opportunities.';
};

/**
 * Get recommended metrics based on context
 */
export const getRecommendedMetrics = (userContext: UserContext): string[] => {
  const { useCase, profession, objectives } = userContext;

  const metrics: string[] = [];

  // Use case-specific metrics
  if (useCase === 'churn_prediction') {
    metrics.push('Churn Rate', 'Customer Lifetime Value', 'Retention Rate', 'Days to Churn');
  } else if (useCase === 'fraud_detection') {
    metrics.push('Fraud Detection Rate', 'False Positive Rate', 'Investigation Cost', 'Financial Loss Prevented');
  } else if (useCase === 'sales_forecasting') {
    metrics.push('Forecast Accuracy', 'MAPE', 'Revenue Growth', 'Pipeline Velocity');
  } else if (useCase === 'lead_scoring') {
    metrics.push('Conversion Rate', 'Lead Quality Score', 'Sales Cycle Length', 'Win Rate');
  }

  // Profession-specific metrics
  if (profession === 'Marketing Manager') {
    metrics.push('CAC', 'ROAS', 'Conversion Rate', 'CTR');
  } else if (profession === 'Product Manager') {
    metrics.push('Active Users', 'Feature Adoption', 'User Satisfaction', 'Engagement Rate');
  } else if (profession === 'Executive / C-Suite') {
    metrics.push('ROI', 'Revenue Impact', 'Cost Savings', 'Market Share');
  }

  // Objective-specific metrics
  if (objectives?.includes('Reduce costs')) {
    metrics.push('Cost per Transaction', 'Operational Efficiency', 'Resource Utilization');
  }
  if (objectives?.includes('Increase revenue')) {
    metrics.push('Revenue Growth', 'Average Deal Size', 'Customer Lifetime Value');
  }

  // Remove duplicates and return
  return [...new Set(metrics)];
};

/**
 * Generate a welcome message based on user context
 */
export const getContextualWelcomeMessage = (userContext: UserContext): string => {
  const { profession, industry, useCase } = userContext;

  let message = `Welcome! `;

  if (profession && industry) {
    message += `As a ${profession} in ${industry}, `;
  } else if (profession) {
    message += `As a ${profession}, `;
  }

  if (useCase === 'predictive_analytics') {
    message += `I can help you build predictive models to forecast trends and make data-driven decisions.`;
  } else if (useCase === 'customer_insights') {
    message += `I can help you understand your customers better through segmentation and behavior analysis.`;
  } else if (useCase === 'fraud_detection') {
    message += `I can help you detect fraudulent patterns and protect your business from financial loss.`;
  } else if (useCase === 'sales_forecasting') {
    message += `I can help you forecast sales trends and optimize your revenue planning.`;
  } else if (useCase === 'churn_prediction') {
    message += `I can help you identify at-risk customers and improve retention strategies.`;
  } else {
    message += `I'm here to help you leverage machine learning for your business goals.`;
  }

  message += ` Let's get started!`;

  return message;
};
