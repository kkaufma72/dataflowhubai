// Real Customer Testimonials
// IMPORTANT: Replace these with actual customer quotes once collected

export interface Testimonial {
  id: string;
  quote: string;
  author: string;
  role: string;
  company: string;
  avatar?: string;
  linkedIn?: string;
  verified: boolean;
  metrics?: {
    label: string;
    value: string;
  };
}

// TODO: Replace with REAL testimonials from actual customers
// Instructions:
// 1. Email your paying subscribers
// 2. Ask: "What problem did DataFlowHub solve? How much time/money did it save?"
// 3. Request permission to use their quote, name, company, and photo
// 4. Get specific metrics (e.g., "saved 10 hours per week", "reduced costs by $50K/year")
// 5. Ideally get video testimonials (even 30-second iPhone videos)

export const testimonials: Testimonial[] = [
  // TEMPLATE FOR REAL TESTIMONIALS:
  // {
  //   id: '1',
  //   quote: "We went from spending 6 hours manually cleaning customer data to 15 minutes with DataFlowHub's AI transformations. That's $50K in analyst time saved per year.",
  //   author: 'Jennifer Rodriguez',
  //   role: 'VP of Analytics',
  //   company: 'FinTech Startup (Series B)',
  //   avatar: '/testimonials/jennifer-rodriguez.jpg',
  //   linkedIn: 'https://linkedin.com/in/jrodriguez',
  //   verified: true,
  //   metrics: {
  //     label: 'Time Saved',
  //     value: '6 hours → 15 mins'
  //   }
  // },

  // PLACEHOLDER TESTIMONIALS (REMOVE ONCE YOU HAVE REAL ONES)
  {
    id: 'placeholder-1',
    quote: "DataFlowHub AI reduced our data analysis time from hours to minutes. The natural language queries are game-changing.",
    author: 'Sarah Mitchell',
    role: 'Data Analyst',
    company: 'TechCorp',
    verified: false,
    metrics: {
      label: 'Time Saved',
      value: 'Hours → Minutes'
    }
  },
  {
    id: 'placeholder-2',
    quote: "Finally, a tool that lets me focus on insights instead of wrestling with complex queries. Absolutely love it!",
    author: 'Mike Johnson',
    role: 'Marketing Director',
    company: 'StartupXYZ',
    verified: false
  },
  {
    id: 'placeholder-3',
    quote: "The AI-powered data quality scoring saved us weeks of manual data cleaning. ROI was immediate.",
    author: 'Alex Lee',
    role: 'Chief Data Officer',
    company: 'FinanceInc',
    verified: false,
    metrics: {
      label: 'ROI',
      value: 'Immediate'
    }
  }
];

// Instructions for collecting real testimonials:
// 
// EMAIL TEMPLATE:
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Subject: Quick question - How is DataFlowHub working for you?
// 
// Hi [Name],
// 
// I noticed you've been using DataFlowHub for [timeframe]. I'd love to
// hear how it's working for you!
// 
// Could you take 2 minutes to answer:
// 1. What problem were you trying to solve when you signed up?
// 2. How much time/money has DataFlowHub saved you? (specific numbers help!)
// 3. Would you recommend DataFlowHub to a colleague? Why/why not?
// 
// If you're happy with the platform, I'd love to feature your success
// story on our website (with your permission). It helps other businesses
// discover how DataFlowHub can help them.
// 
// Reply with your thoughts, or let me know if you'd prefer a quick
// 10-minute call to discuss.
// 
// Thanks!
// Kyle
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 
// WHAT TO LOOK FOR IN RESPONSES:
// ✅ Specific metrics ("saved 10 hours per week")
// ✅ Dollar amounts ("$50K annual savings")
// ✅ Before/after comparisons ("3 days → 30 minutes")
// ✅ Emotional language ("love it", "game-changer", "can't live without")
// ✅ Concrete use cases (not generic praise)
// 
// WHAT TO AVOID:
// ❌ Generic praise ("great product")
// ❌ No metrics or specifics
// ❌ Testimonials you wrote yourself
// ❌ Fake names/companies
// 
// BONUS - VIDEO TESTIMONIALS:
// Ask customers to record a 30-60 second video saying:
// - Their name and company
// - What problem DataFlowHub solved
// - One specific metric (time/money saved)
// - Would they recommend it?
// 
// Even an iPhone video adds 10x credibility vs. text.
