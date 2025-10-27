/**
 * Marketing Content Generation Bot
 * 
 * ⚠️ SECURITY WARNING: All functions now use secure backend Edge Functions
 * instead of direct OpenAI API calls from the client.
 * 
 * This prevents API key exposure and unauthorized usage.
 */

import { secureMarketingContent } from './secureAI';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface GeneratedContent {
  content: string;
  metadata?: any;
  image_suggestion?: string;
  best_time_to_post?: string;
  cta?: string;
}

// ============================================================================
// CONTENT GENERATION FUNCTIONS
// ============================================================================

/**
 * Generate Product Hunt Launch Post
 */
export const generateProductHuntPost = async (productDetails: {
  name: string;
  tagline: string;
  features: string[];
  uniqueValue: string;
}): Promise<string> => {
  const prompt = `Create a compelling Product Hunt launch post.

Product: ${productDetails.name}
Tagline: ${productDetails.tagline}

Key Features:
${productDetails.features.map((f, i) => `${i + 1}. ${f}`).join('\n')}

Unique Value: ${productDetails.uniqueValue}

Create a post that will get to #1 Product of the Day:

1. **Title** (60 chars max, compelling hook)
2. **Tagline** (60 chars, clear value prop)
3. **Description** (250 words):
   - Hook (problem statement)
   - Solution (how it works)
   - Unique features (what makes it special)
   - Social proof (if any)
   - Call to action

4. **First Comment** (Founder intro, builds rapport)

Make it:
- Specific (no vague claims)
- Exciting (create buzz)
- Authentic (real founder voice)
- Action-oriented (clear CTA)

Use emojis strategically.`;

  return await secureMarketingContent(prompt, 'product_hunt');
};

/**
 * Generate Twitter Thread
 */
export const generateTwitterThread = async (topic: string, numTweets: number = 7): Promise<string> => {
  const prompt = `Create a ${numTweets}-tweet thread about: ${topic}

Format:
1/X Hook tweet (grab attention, ask a question or make bold claim)
2/X Problem (what pain point exists)
3/X-N/X Solution points (tips, insights, examples)
X/X Call to action

Rules:
- Max 280 chars per tweet
- Use emojis for visual appeal
- Make tweet 1 ultra-compelling
- Include 1-2 hashtags in final tweet
- End with clear CTA`;

  return await secureMarketingContent(prompt, 'twitter');
};

/**
 * Generate Daily Social Media Content
 */
export const generateDailySocialContent = async (
  platform: 'twitter' | 'linkedin' | 'facebook',
  contentPillar: 'education' | 'product_update' | 'customer_story' | 'tips' | 'inspiration'
): Promise<string> => {
  const platformGuidelines = {
    twitter: 'Max 280 chars, casual tone, use emojis, 2-3 hashtags',
    linkedin: '150-300 words, professional tone, thought leadership, 3-5 hashtags',
    facebook: '100-200 words, conversational, encourage engagement, ask questions'
  };

  const prompt = `Create a ${platform} post for a SaaS AI data analytics tool.

Content Pillar: ${contentPillar}
Platform: ${platform}
Guidelines: ${platformGuidelines[platform]}

Product Context:
- DataFlowHub AI
- Transform data with natural language
- Voice-enabled
- $49/month
- For marketers, analysts, accountants, etc.

Create engaging content that:
1. Provides value (not just promotional)
2. Encourages engagement
3. Showcases unique features
4. Includes clear CTA

Also suggest:
- Best time to post
- Image/visual idea
- Engagement tactics`;

  return await secureMarketingContent(prompt, 'social');
};

/**
 * Generate Blog Post Outline
 */
export const generateBlogPost = async (
  topic: string,
  keywords: string[],
  wordCount: number = 1500
): Promise<string> => {
  const prompt = `Create a comprehensive blog post outline.

Topic: ${topic}
Target Keywords: ${keywords.join(', ')}
Word Count: ~${wordCount} words

Structure:
1. **Title** (SEO-optimized, includes primary keyword)
2. **Meta Description** (155 chars)
3. **Introduction** (Hook, problem, promise)
4. **Main Sections** (H2 headers with bullet points)
5. **Conclusion** (Summary + CTA)

Requirements:
- SEO-optimized headings
- Include all target keywords naturally
- Provide value upfront
- Clear next steps
- Include data/statistics placeholders`;

  return await secureMarketingContent(prompt, 'blog');
};

/**
 * Generate Ad Copy Variations
 */
export const generateAdCopy = async (
  platform: 'google' | 'facebook' | 'linkedin',
  objective: 'awareness' | 'conversion' | 'signup'
): Promise<string> => {
  const platformSpecs = {
    google: {
      headline_max: 30,
      description_max: 90,
      num_variations: 3
    },
    facebook: {
      headline_max: 40,
      description_max: 125,
      num_variations: 5
    },
    linkedin: {
      headline_max: 50,
      description_max: 150,
      num_variations: 3
    }
  };

  const specs = platformSpecs[platform];

  const prompt = `Create ${specs.num_variations} ad copy variations for ${platform} ads.

Product: DataFlowHub AI (AI-powered data analytics)
Objective: ${objective}
Target: Business professionals who work with data

For each variation, provide:
1. Headline (max ${specs.headline_max} chars)
2. Description (max ${specs.description_max} chars)
3. Call-to-Action

Test different angles:
- Pain point focus
- Benefit focus
- Feature focus
- Social proof focus
- Urgency focus

Make them:
- Specific (use numbers)
- Clear (no jargon)
- Compelling (strong hooks)
- Action-oriented (clear next step)

Platform best practices for ${platform}.`;

  return await secureMarketingContent(prompt, 'ad');
};

/**
 * Generate Email Campaign
 */
export const generateEmailCampaign = async (
  campaignType: 'onboarding' | 'nurture' | 'promotion' | 'reengagement',
  numEmails: number = 5
): Promise<string> => {
  const prompt = `Create a ${numEmails}-email ${campaignType} campaign for DataFlowHub AI.

For each email, provide:
1. **Subject Line** (compelling, 40-50 chars)
2. **Preview Text** (complements subject, 80-100 chars)
3. **Body Copy** (150-300 words)
4. **CTA Button Text**
5. **Optimal Send Time**

Campaign Flow:
${campaignType === 'onboarding' ? '- Welcome → Setup → First Win → Feature Discovery → Power User'
  : campaignType === 'nurture' ? '- Educational → Case Study → Comparison → Trial Offer → Follow-up'
  : campaignType === 'promotion' ? '- Teaser → Launch → Benefits → Urgency → Last Chance'
  : '- We Miss You → Value Reminder → Special Offer → Success Stories → Final Call'}

Make each email:
- Value-first (not salesy)
- Personalized
- Scannable (short paragraphs)
- Mobile-optimized
- Clear single CTA`;

  return await secureMarketingContent(prompt, 'email');
};

/**
 * Generate Customer Personas
 */
export const generateCustomerPersonas = async (
  industry: string,
  numPersonas: number = 3
): Promise<string> => {
  const prompt = `Create ${numPersonas} detailed customer personas for DataFlowHub AI in the ${industry} industry.

For each persona, include:
1. **Name & Role** (e.g., "Analytics Annie - Marketing Manager")
2. **Demographics** (Age, Location, Company Size)
3. **Goals** (What they want to achieve)
4. **Challenges** (Pain points & frustrations)
5. **Tech Stack** (Tools they currently use)
6. **Buying Behavior** (Decision criteria, objections)
7. **Messaging Angle** (How to position to them)
8. **Content Preferences** (Where they consume info)

Make them:
- Realistic and specific
- Based on real market data
- Actionable for marketing
- Different from each other`;

  return await secureMarketingContent(prompt, 'email'); // Using email as fallback
};

/**
 * Generate Landing Page Copy
 */
export const generateLandingPageCopy = async (
  productFeature: string,
  targetAudience: string
): Promise<string> => {
  const prompt = `Create high-converting landing page copy for: ${productFeature}

Target Audience: ${targetAudience}

Include:
1. **Hero Section**
   - Headline (10 words max, clear value prop)
   - Subheadline (20 words, expand on promise)
   - CTA button text

2. **Problem Section**
   - Headline
   - 3 pain points (short bullets)

3. **Solution Section**
   - Headline
   - How it works (3-4 steps)

4. **Benefits Section**
   - Headline
   - 3 key benefits with icons

5. **Social Proof Section**
   - Headline
   - Testimonial placeholder
   - Trust badges/stats

6. **CTA Section**
   - Headline
   - Risk reversal statement
   - Button text

Use persuasive copywriting techniques:
- AIDA framework
- Benefit-driven
- Specific numbers
- Active voice
- Urgency (subtle)`;

  return await secureMarketingContent(prompt, 'email'); // Using email as fallback
};

/**
 * Generate SEO Meta Tags
 */
export const generateSEOMetaTags = async (
  pageTitle: string,
  primaryKeyword: string
): Promise<string> => {
  const prompt = `Create SEO-optimized meta tags for a page about: ${pageTitle}

Primary Keyword: ${primaryKeyword}

Generate:
1. **Title Tag** (50-60 chars, includes keyword)
2. **Meta Description** (150-160 chars, compelling, includes keyword)
3. **H1 Heading** (Variation of title, natural language)
4. **5 Related Keywords** (LSI keywords for content)
5. **Open Graph Tags** (for social sharing)
6. **Schema Markup Suggestions**

Make them:
- Click-worthy
- Keyword-optimized
- User-intent focused
- Compliant with Google guidelines`;

  return await secureMarketingContent(prompt, 'blog');
};

/**
 * Generate Cold Email Outreach
 */
export const generateColdEmail = async (
  recipientRole: string,
  valueProposition: string
): Promise<string> => {
  const prompt = `Create a cold email for outreach to: ${recipientRole}

Value Proposition: ${valueProposition}

Structure:
1. **Subject Line** (Personalized, 5-7 words)
2. **Opening** (Pattern interrupt, about them not you)
3. **Value Prop** (One clear benefit, 2 sentences max)
4. **Proof** (Social proof or data point)
5. **CTA** (Low-friction ask)
6. **Signature** (Professional)

Follow best practices:
- Under 100 words total
- Personalized opening
- No buzzwords/jargon
- Single clear CTA
- Professional but casual tone
- Mobile-friendly format

Include 3 variations to A/B test.`;

  return await secureMarketingContent(prompt, 'email');
};

export default {
  generateProductHuntPost,
  generateTwitterThread,
  generateDailySocialContent,
  generateBlogPost,
  generateAdCopy,
  generateEmailCampaign,
  generateCustomerPersonas,
  generateLandingPageCopy,
  generateSEOMetaTags,
  generateColdEmail
};
