// Marketing Intelligence Agent
// Specialized agent for marketing analytics, copywriting, and campaign strategy

import { ChatOpenAI } from "@langchain/openai";
import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { Dataset } from '../../types';
import { UserProfile } from '../../utils/personalizedPrompts';
import * as stats from 'simple-statistics';

// ============================================================================
// MARKETING FRAMEWORK TEMPLATES
// ============================================================================

const MARKETING_FRAMEWORKS = {
  AIDA: {
    name: "AIDA (Attention, Interest, Desire, Action)",
    structure: `
• ATTENTION: Grab attention with compelling hook
• INTEREST: Build interest with relevant benefits
• DESIRE: Create desire by showing transformation
• ACTION: Clear, urgent call-to-action
    `
  },
  PAS: {
    name: "PAS (Problem, Agitate, Solve)",
    structure: `
• PROBLEM: Identify the customer's pain point
• AGITATE: Make the problem feel urgent
• SOLVE: Present your solution
    `
  },
  FAB: {
    name: "FAB (Features, Advantages, Benefits)",
    structure: `
• FEATURES: What it is/does
• ADVANTAGES: Why it's better than alternatives
• BENEFITS: What the customer gains
    `
  },
  StoryBrand: {
    name: "StoryBrand Framework",
    structure: `
• CHARACTER: The customer (hero)
• PROBLEM: External, Internal, Philosophical
• GUIDE: You (the mentor)
• PLAN: Steps to success
• CALL TO ACTION: Direct and transitional
• SUCCESS: What victory looks like
• FAILURE: What's at stake
    `
  }
};

// ============================================================================
// CUSTOMER SEGMENTATION TOOLS
// ============================================================================

export const createCustomerSegmentationTool = (dataset: Dataset) => {
  return new DynamicStructuredTool({
    name: "segment_customers",
    description: "Segment customers based on behavior, demographics, or value",
    schema: z.object({
      segment_by: z.array(z.string()).describe("Columns to segment by (e.g., purchase_frequency, lifetime_value, location)"),
      num_segments: z.number().default(4).describe("Number of segments to create")
    }),
    func: async ({ segment_by, num_segments }) => {
      if (!dataset.preview_data?.columns || !dataset.preview_data?.rows) {
        return "No customer data available for segmentation";
      }

      const { columns, rows } = dataset.preview_data;
      
      // Simple segmentation based on provided columns
      const segments: Record<string, any[]> = {};
      
      rows.forEach(row => {
        const segmentKey = segment_by.map(col => {
          const colIdx = columns.indexOf(col);
          return Array.isArray(row) ? row[colIdx] : row[col];
        }).join('_');
        
        if (!segments[segmentKey]) {
          segments[segmentKey] = [];
        }
        segments[segmentKey].push(row);
      });

      // Get top segments
      const topSegments = Object.entries(segments)
        .map(([key, customerList]) => ({
          segment_name: key,
          customer_count: customerList.length,
          percentage: ((customerList.length / rows.length) * 100).toFixed(1)
        }))
        .sort((a, b) => b.customer_count - a.customer_count)
        .slice(0, num_segments);

      return JSON.stringify({
        total_customers: rows.length,
        segments: topSegments,
        recommendations: generateSegmentRecommendations(topSegments)
      }, null, 2);
    }
  });
};

const generateSegmentRecommendations = (segments: any[]) => {
  return segments.map((seg, idx) => {
    if (seg.percentage > 40) {
      return `Segment "${seg.segment_name}" is your largest (${seg.percentage}%) - focus retention efforts here`;
    } else if (seg.percentage < 10) {
      return `Segment "${seg.segment_name}" is small (${seg.percentage}%) - consider if worth targeting or merge with similar segment`;
    } else {
      return `Segment "${seg.segment_name}" (${seg.percentage}%) - balanced size, good for targeted campaigns`;
    }
  });
};

// ============================================================================
// PERSONA GENERATION TOOLS
// ============================================================================

export const createPersonaGeneratorTool = (dataset: Dataset) => {
  return new DynamicStructuredTool({
    name: "generate_customer_personas",
    description: "Create detailed buyer personas from customer data",
    schema: z.object({
      num_personas: z.number().default(3).describe("Number of personas to create"),
      focus_attributes: z.array(z.string()).optional().describe("Specific attributes to focus on")
    }),
    func: async ({ num_personas, focus_attributes }) => {
      if (!dataset.preview_data) {
        return "No customer data available";
      }

      const { columns, rows } = dataset.preview_data;
      
      // Analyze data to create personas
      const personas = [];
      
      for (let i = 0; i < Math.min(num_personas, 5); i++) {
        const sampleRows = rows.slice(i * Math.floor(rows.length / num_personas), (i + 1) * Math.floor(rows.length / num_personas));
        
        // Create persona from segment
        const persona = {
          name: `Persona ${i + 1}`,
          segment_size: sampleRows.length,
          percentage: ((sampleRows.length / rows.length) * 100).toFixed(1),
          characteristics: extractCharacteristics(sampleRows, columns, focus_attributes),
          messaging_angle: suggestMessagingAngle(sampleRows, columns)
        };
        
        personas.push(persona);
      }

      return JSON.stringify({
        personas,
        usage_tip: "Use these personas to tailor your marketing messages, ad targeting, and content strategy"
      }, null, 2);
    }
  });
};

const extractCharacteristics = (rows: any[], columns: string[], focusAttributes?: string[]) => {
  const attrs = focusAttributes || columns.slice(0, 5);
  const characteristics: Record<string, any> = {};
  
  attrs.forEach(attr => {
    const colIdx = columns.indexOf(attr);
    if (colIdx !== -1) {
      const values = rows.map(row => Array.isArray(row) ? row[colIdx] : row[attr]);
      const uniqueValues = [...new Set(values)].slice(0, 3);
      characteristics[attr] = uniqueValues.join(', ');
    }
  });
  
  return characteristics;
};

const suggestMessagingAngle = (rows: any[], columns: string[]) => {
  // Simple heuristic for messaging
  const angles = [
    "Value-focused: Emphasize cost savings and ROI",
    "Quality-focused: Highlight premium features and reliability",
    "Speed-focused: Emphasize quick results and efficiency",
    "Innovation-focused: Position as cutting-edge solution"
  ];
  
  return angles[Math.floor(Math.random() * angles.length)];
};

// ============================================================================
// COPYWRITING TOOLS
// ============================================================================

export const createCopywritingTools = (userProfile: UserProfile) => {
  return [
    new DynamicStructuredTool({
      name: "generate_marketing_copy",
      description: "Generate marketing copy using proven frameworks (AIDA, PAS, FAB, StoryBrand)",
      schema: z.object({
        framework: z.enum(["AIDA", "PAS", "FAB", "StoryBrand"]).describe("Marketing framework to use"),
        content_type: z.enum(["email", "ad", "landing_page", "social_post", "blog_intro"]),
        product_name: z.string().describe("Product or service name"),
        key_benefit: z.string().describe("Main benefit or value proposition"),
        target_audience: z.string().describe("Who is this for?"),
        tone: z.enum(["professional", "casual", "urgent", "friendly", "authoritative"]).default("professional")
      }),
      func: async ({ framework, content_type, product_name, key_benefit, target_audience, tone }) => {
        const llm = new ChatOpenAI({ 
          modelName: "gpt-4o", 
          temperature: 0.8 // More creative for copywriting
        });

        const frameworkGuide = MARKETING_FRAMEWORKS[framework];
        
        const prompt = `You are an expert copywriter specializing in ${content_type} for ${userProfile.use_case || 'business'}.

Company: ${userProfile.company || 'the company'}
Industry: ${userProfile.use_case || 'general'}
Your Role: ${userProfile.job_title || 'marketing professional'}

Task: Write compelling ${content_type} copy

Details:
- Product: ${product_name}
- Key Benefit: ${key_benefit}
- Target Audience: ${target_audience}
- Tone: ${tone}

Framework: ${frameworkGuide.name}
${frameworkGuide.structure}

Requirements:
1. Follow the ${framework} framework structure strictly
2. Use ${tone} tone
3. Make it specific to ${target_audience}
4. Include emotional triggers
5. End with clear call-to-action
6. Keep it concise (${content_type === 'ad' ? '100-150 words' : content_type === 'email' ? '200-300 words' : '300-500 words'})

Write the ${content_type} now:`;

        const response = await llm.invoke(prompt);
        
        return JSON.stringify({
          framework_used: framework,
          copy: response.content,
          tips: [
            "Test this copy with A/B variations",
            "Personalize the opening for each segment",
            "Track click-through rates"
          ]
        }, null, 2);
      }
    }),

    new DynamicStructuredTool({
      name: "create_ab_test_variations",
      description: "Generate A/B test variations of marketing copy",
      schema: z.object({
        original_copy: z.string(),
        num_variations: z.number().default(3),
        test_element: z.enum(["headline", "cta", "body", "entire_copy"]).default("headline")
      }),
      func: async ({ original_copy, num_variations, test_element }) => {
        const llm = new ChatOpenAI({ modelName: "gpt-4o", temperature: 0.9 });

        const prompt = `Generate ${num_variations} A/B test variations.

Original Copy:
"${original_copy}"

Element to Test: ${test_element}

For each variation:
1. Change the ${test_element} significantly
2. Test different angles: emotional vs rational, benefit vs feature, urgency vs value
3. Keep other elements consistent
4. Explain your hypothesis for why this might perform better

Industry context: ${userProfile.use_case}
Brand voice: ${userProfile.company || 'Professional'}

Generate ${num_variations} distinct variations:`;

        const response = await llm.invoke(prompt);
        
        return JSON.stringify({
          original: original_copy,
          variations: response.content,
          testing_tip: "Run each variation to at least 100 users for statistical significance"
        }, null, 2);
      }
    })
  ];
};

// ============================================================================
// CAMPAIGN STRATEGY TOOLS
// ============================================================================

export const createCampaignTools = (dataset: Dataset, userProfile: UserProfile) => {
  return [
    new DynamicStructuredTool({
      name: "create_campaign_strategy",
      description: "Generate complete marketing campaign strategy with timeline, channels, and budget",
      schema: z.object({
        campaign_goal: z.enum(["awareness", "lead_generation", "conversion", "retention", "expansion"]),
        budget: z.number().optional(),
        duration_days: z.number().default(30)
      }),
      func: async ({ campaign_goal, budget, duration_days }) => {
        const llm = new ChatOpenAI({ modelName: "gpt-4o", temperature: 0.7 });

        // Analyze dataset for insights
        const dataInsights = analyzeCustomerData(dataset);

        const prompt = `Create a comprehensive marketing campaign strategy:

Goal: ${campaign_goal}
Budget: ${budget ? `$${budget}` : 'To be determined'}
Duration: ${duration_days} days
Industry: ${userProfile.use_case}
Company: ${userProfile.company}

Data Insights from ${dataset.name}:
${JSON.stringify(dataInsights, null, 2)}

Provide a complete campaign strategy including:

1. **Campaign Objectives** (SMART goals)
2. **Target Audience** (based on data insights)
3. **Channel Strategy** (which platforms and why)
4. **Content Plan** (what to create, when to publish)
5. **Budget Allocation** (breakdown by channel)
6. **Timeline** (week-by-week plan)
7. **Success Metrics** (KPIs to track)
8. **A/B Testing Plan** (what to test)
9. **Risk Mitigation** (potential issues and solutions)

Make it actionable and specific to ${userProfile.use_case}.`;

        const response = await llm.invoke(prompt);
        
        return response.content;
      }
    }),

    new DynamicStructuredTool({
      name: "generate_email_drip_campaign",
      description: "Create multi-email drip campaign sequence",
      schema: z.object({
        campaign_type: z.enum(["onboarding", "nurture", "re_engagement", "upsell", "abandoned_cart"]),
        num_emails: z.number().default(5),
        days_between: z.number().default(3)
      }),
      func: async ({ campaign_type, num_emails, days_between }) => {
        const llm = new ChatOpenAI({ modelName: "gpt-4o", temperature: 0.8 });

        const prompt = `Create a ${num_emails}-email drip campaign:

Type: ${campaign_type}
Sending Schedule: Every ${days_between} days
Industry: ${userProfile.use_case}
Company: ${userProfile.company || 'Your Company'}

For each email, provide:
1. **Day**: When to send (Day 0, Day ${days_between}, etc.)
2. **Subject Line**: (compelling, under 50 chars)
3. **Preview Text**: (40 chars)
4. **Email Body**: (200-300 words, conversational)
5. **Call-to-Action**: (specific button text)
6. **Goal**: What this email accomplishes
7. **Success Metric**: How to measure

Make emails progressively build on each other.
Use ${campaign_type} best practices.
Personalize for ${userProfile.use_case} audience.`;

        const response = await llm.invoke(prompt);
        
        return response.content;
      }
    }),

    new DynamicStructuredTool({
      name: "generate_social_media_calendar",
      description: "Create 30-day social media content calendar",
      schema: z.object({
        platforms: z.array(z.enum(["linkedin", "twitter", "facebook", "instagram", "tiktok"])),
        posts_per_week: z.number().default(5),
        content_pillars: z.array(z.string()).optional()
      }),
      func: async ({ platforms, posts_per_week, content_pillars }) => {
        const llm = new ChatOpenAI({ modelName: "gpt-4o", temperature: 0.8 });

        const defaultPillars = ["education", "inspiration", "product_features", "customer_stories", "industry_news"];
        const pillars = content_pillars || defaultPillars;

        const prompt = `Create a 30-day social media content calendar:

Platforms: ${platforms.join(', ')}
Posting Frequency: ${posts_per_week} posts/week
Content Pillars: ${pillars.join(', ')}
Industry: ${userProfile.use_case}
Company: ${userProfile.company}

For each post, provide:
1. **Date**: (Day 1-30)
2. **Platform**: Which social network
3. **Content Pillar**: Which theme
4. **Post Copy**: Platform-optimized content
5. **Hashtags**: 3-5 relevant hashtags
6. **Visual Suggestion**: What image/video to use
7. **Best Time**: When to post (based on platform best practices)

Ensure:
- Mix of content types (educational, promotional, engaging)
- Platform-specific optimization (LinkedIn = professional, Instagram = visual)
- Consistent brand voice
- Strategic CTA placement

Provide as a table format for easy copy-paste.`;

        const response = await llm.invoke(prompt);
        
        return response.content;
      }
    })
  ];
};

// ============================================================================
// CAMPAIGN PERFORMANCE ANALYSIS TOOLS
// ============================================================================

export const createCampaignAnalysisTools = (dataset: Dataset) => {
  return [
    new DynamicStructuredTool({
      name: "analyze_campaign_roi",
      description: "Analyze marketing campaign performance and calculate ROI",
      schema: z.object({
        spend_column: z.string().describe("Column with marketing spend data"),
        revenue_column: z.string().describe("Column with revenue/conversion data"),
        campaign_column: z.string().optional().describe("Column identifying different campaigns")
      }),
      func: async ({ spend_column, revenue_column, campaign_column }) => {
        if (!dataset.preview_data) {
          return "No campaign data available";
        }

        const { columns, rows } = dataset.preview_data;
        const spendIdx = columns.indexOf(spend_column);
        const revenueIdx = columns.indexOf(revenue_column);
        const campaignIdx = campaign_column ? columns.indexOf(campaign_column) : -1;

        if (spendIdx === -1 || revenueIdx === -1) {
          return "Required columns not found";
        }

        // Calculate ROI by campaign or overall
        const campaigns: Record<string, { spend: number; revenue: number; count: number }> = {};
        
        rows.forEach(row => {
          const campaignName = campaignIdx !== -1 
            ? String(Array.isArray(row) ? row[campaignIdx] : row[campaign_column!])
            : 'Overall';
          
          const spend = parseFloat(String(Array.isArray(row) ? row[spendIdx] : row[spend_column])) || 0;
          const revenue = parseFloat(String(Array.isArray(row) ? row[revenueIdx] : row[revenue_column])) || 0;
          
          if (!campaigns[campaignName]) {
            campaigns[campaignName] = { spend: 0, revenue: 0, count: 0 };
          }
          
          campaigns[campaignName].spend += spend;
          campaigns[campaignName].revenue += revenue;
          campaigns[campaignName].count++;
        });

        // Calculate metrics
        const results = Object.entries(campaigns).map(([name, data]) => {
          const roi = data.spend > 0 ? ((data.revenue - data.spend) / data.spend) * 100 : 0;
          const roas = data.spend > 0 ? data.revenue / data.spend : 0;
          const cpa = data.count > 0 ? data.spend / data.count : 0;
          
          return {
            campaign: name,
            spend: `$${data.spend.toFixed(2)}`,
            revenue: `$${data.revenue.toFixed(2)}`,
            roi: `${roi.toFixed(1)}%`,
            roas: `${roas.toFixed(2)}x`,
            cpa: `$${cpa.toFixed(2)}`,
            conversions: data.count,
            performance: roi > 100 ? "Excellent" : roi > 50 ? "Good" : roi > 0 ? "Profitable" : "Needs Improvement"
          };
        });

        // Sort by ROI
        results.sort((a, b) => parseFloat(b.roi) - parseFloat(a.roi));

        return JSON.stringify({
          campaign_performance: results,
          best_performer: results[0],
          worst_performer: results[results.length - 1],
          recommendations: generateCampaignRecommendations(results)
        }, null, 2);
      }
    }),

    new DynamicStructuredTool({
      name: "suggest_budget_optimization",
      description: "Analyze campaign data and suggest budget reallocation for better ROI",
      schema: z.object({
        current_budget: z.number(),
        target_roi: z.number().default(200).describe("Target ROI percentage")
      }),
      func: async ({ current_budget, target_roi }) => {
        const llm = new ChatOpenAI({ modelName: "gpt-4o", temperature: 0.5 });

        const dataInsights = analyzeCustomerData(dataset);

        const prompt = `Analyze marketing budget allocation:

Current Total Budget: $${current_budget}
Target ROI: ${target_roi}%
Current Data Insights: ${JSON.stringify(dataInsights)}

Based on the performance data, provide:

1. **Current Allocation Analysis**
   - Which channels are over/under-performing
   - Actual ROI vs target
   - Wasted spend estimate

2. **Recommended Reallocation**
   - Increase budget to: [high-performing channels]
   - Decrease budget from: [low-performing channels]
   - Pause/eliminate: [negative ROI channels]

3. **Expected Impact**
   - Projected ROI improvement
   - Additional revenue potential
   - Risk assessment

4. **Implementation Timeline**
   - Phase 1: Quick wins (Week 1)
   - Phase 2: Testing period (Week 2-4)
   - Phase 3: Scale winners (Week 5+)

Provide specific dollar amounts and percentages.`;

        const response = await llm.invoke(prompt);
        return response.content;
      }
    })
  ];
};

const generateCampaignRecommendations = (results: any[]) => {
  const recommendations = [];
  
  const best = results[0];
  const worst = results[results.length - 1];
  
  if (parseFloat(best.roi) > 100) {
    recommendations.push(`🎯 Scale "${best.campaign}" - it's delivering ${best.roi} ROI! Increase budget by 30-50%.`);
  }
  
  if (parseFloat(worst.roi) < 0) {
    recommendations.push(`🚨 Pause "${worst.campaign}" immediately - it's losing money (${worst.roi} ROI). Investigate or eliminate.`);
  }
  
  const profitable = results.filter(r => parseFloat(r.roi) > 0);
  if (profitable.length > 1) {
    recommendations.push(`💰 You have ${profitable.length} profitable campaigns. Consolidate learnings and double down on winners.`);
  }
  
  return recommendations;
};

// ============================================================================
// CONTENT GENERATION TOOLS
// ============================================================================

export const createContentTools = (userProfile: UserProfile) => {
  return [
    new DynamicStructuredTool({
      name: "generate_blog_outline",
      description: "Create SEO-optimized blog post outline",
      schema: z.object({
        topic: z.string(),
        target_keywords: z.array(z.string()),
        word_count_target: z.number().default(1500)
      }),
      func: async ({ topic, target_keywords, word_count_target }) => {
        const llm = new ChatOpenAI({ modelName: "gpt-4o", temperature: 0.7 });

        const prompt = `Create SEO-optimized blog post outline:

Topic: ${topic}
Keywords: ${target_keywords.join(', ')}
Target Length: ${word_count_target} words
Industry: ${userProfile.use_case}

Provide:
1. **SEO Title** (60 chars, includes primary keyword)
2. **Meta Description** (155 chars, compelling)
3. **Introduction** (Hook + thesis, 100-150 words)
4. **H2 Sections** (5-7 sections with keyword integration)
5. **H3 Subsections** (2-3 per H2)
6. **Conclusion** (Summary + CTA)
7. **Internal Link Opportunities** (3-5 suggestions)
8. **External Link Opportunities** (authoritative sources)

Optimize for search intent and user engagement.`;

        const response = await llm.invoke(prompt);
        return response.content;
      }
    }),

    new DynamicStructuredTool({
      name: "create_case_study",
      description: "Generate customer case study or success story",
      schema: z.object({
        customer_name: z.string(),
        problem_solved: z.string(),
        results_achieved: z.string()
      }),
      func: async ({ customer_name, problem_solved, results_achieved }) => {
        const llm = new ChatOpenAI({ modelName: "gpt-4o", temperature: 0.7 });

        const prompt = `Write a compelling customer case study:

Customer: ${customer_name}
Problem: ${problem_solved}
Results: ${results_achieved}
Your Product/Service: ${userProfile.company || 'Our Solution'}

Structure:
1. **Challenge**: What was the customer struggling with?
2. **Solution**: How did they use your product?
3. **Results**: Quantifiable outcomes (use specific numbers!)
4. **Quote**: Create realistic customer testimonial
5. **Key Takeaways**: 3 bullet points

Make it:
- Specific (numbers, timelines, details)
- Authentic (realistic challenges and wins)
- Relatable (other customers see themselves)
- Actionable (clear path to similar success)

Length: 500-700 words`;

        const response = await llm.invoke(prompt);
        return response.content;
      }
    })
  ];
};

// ============================================================================
// MAIN MARKETING AGENT
// ============================================================================

export const createMarketingAgent = (dataset: Dataset, userProfile: UserProfile) => {
  // Only create for marketing-related use cases
  const marketingUseCases = [
    'marketing-analytics',
    'customer-insights',
    'sales-forecasting',
    'business-analytics',
    'real-estate',
    'retail',
    'customer-insights'
  ];

  if (!marketingUseCases.includes(userProfile.use_case || '')) {
    return null; // Not a marketing user
  }

  const tools = [
    ...createCopywritingTools(userProfile),
    ...createCampaignTools(dataset, userProfile),
    ...createCampaignAnalysisTools(dataset),
    createCustomerSegmentationTool(dataset),
    createPersonaGeneratorTool(dataset),
    ...createContentTools(userProfile)
  ];

  return new ChatOpenAI({
    modelName: "gpt-4o",
    temperature: 0.7,
    streaming: false
  });
};

// Build marketing system prompt (used separately)
export const buildMarketingSystemPrompt = (userProfile: UserProfile, dataset: Dataset) => {
  return `You are a marketing strategist and expert copywriter with deep knowledge of:

**Marketing Frameworks:**
- AIDA (Attention, Interest, Desire, Action)
- PAS (Problem, Agitate, Solve)
- FAB (Features, Advantages, Benefits)
- StoryBrand (7-part framework)
- Value Proposition Canvas
- Jobs-to-be-Done (JTBD)

**Your Expertise:**
• Strategic campaign planning
• Customer segmentation and personas
• Conversion copywriting
• Content marketing
• Email marketing and automation
• Social media strategy
• A/B testing and optimization
• ROI analysis and budget optimization

**Current Context:**
- User: ${userProfile.job_title || 'Marketing professional'} at ${userProfile.company || 'their company'}
- Industry: ${userProfile.use_case}
- Dataset: ${dataset.name} (${dataset.rows || 0} customers/records)
- Your Goal: Help them grow their business through data-driven marketing

**Communication Style:**
- Be actionable (specific tactics, not theory)
- Be data-driven (use numbers from their data)
- Be creative (unique angles and ideas)
- Be clear (explain frameworks simply)
- Be encouraging (celebrate wins, support through challenges)

Use their customer data to provide insights they can act on TODAY.`;
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const analyzeCustomerData = (dataset: Dataset) => {
  if (!dataset.preview_data) {
    return { summary: "Limited data available" };
  }

  const { rows, columns } = dataset.preview_data;
  
  return {
    total_records: rows.length,
    available_attributes: columns.slice(0, 10),
    sample_size: `Analyzing ${rows.length} records`,
    data_quality: "Good" // Could use health score here
  };
};

// ============================================================================
// MARKETING QUICK ACTIONS
// ============================================================================

export const getMarketingQuickActions = (userProfile: UserProfile) => {
  const actions = [
    {
      label: "🎯 Create Customer Personas",
      prompt: "Analyze my customer data and create 3 detailed buyer personas with demographics, pain points, goals, and messaging angles"
    },
    {
      label: "📧 Generate Email Campaign",
      prompt: "Create a 5-email drip campaign for customer onboarding with subject lines, preview text, body copy, and CTAs"
    },
    {
      label: "📱 Social Media Calendar",
      prompt: "Generate a 30-day social media content calendar for LinkedIn and Twitter with specific post copy"
    },
    {
      label: "💰 Analyze Campaign ROI",
      prompt: "Analyze my marketing campaign performance, calculate ROI for each channel, and suggest budget optimizations"
    },
    {
      label: "✍️ Write Ad Copy (AIDA)",
      prompt: "Write 3 variations of Google/Facebook ad copy using the AIDA framework, optimized for my industry"
    },
    {
      label: "📊 Campaign Strategy",
      prompt: "Create a complete 30-day marketing campaign strategy with goals, channels, content plan, and success metrics"
    }
  ];

  // Customize based on use case
  if (userProfile.use_case === 'real-estate') {
    actions.push({
      label: "🏠 Property Listing Copy",
      prompt: "Write compelling property listing descriptions for my top 5 properties using StoryBrand framework"
    });
  }

  if (userProfile.use_case === 'retail') {
    actions.push({
      label: "🛍️ Product Descriptions",
      prompt: "Generate conversion-optimized product descriptions for my top-selling items"
    });
  }

  return actions;
};

// Export for use in agent orchestrator
export const isMarketingUser = (userProfile: UserProfile): boolean => {
  const marketingUseCases = [
    'marketing-analytics',
    'customer-insights',
    'sales-forecasting',
    'business-analytics',
    'real-estate',
    'retail'
  ];
  
  return marketingUseCases.includes(userProfile.use_case || '');
};

