// AI Marketing Bot - Automated Marketing Assistant
// Generates content, schedules posts, analyzes performance

import { buildMarketingSystemPrompt } from './agents/marketingAgentSimple';

export interface MarketingBotConfig {
  platform: string;
  brand_voice: string;
  target_audience: string;
  content_pillars: string[];
  posting_frequency: string;
}

export interface GeneratedContent {
  type: 'tweet' | 'linkedin_post' | 'blog_post' | 'product_hunt' | 'reddit_post' | 'email';
  platform: string;
  content: string;
  hashtags?: string[];
  image_suggestion?: string;
  best_time_to_post?: string;
  cta?: string;
}

// ============================================================================
// CONTENT GENERATION
// ============================================================================

/**
 * Generate Product Hunt Launch Post
 */
export const generateProductHuntPost = async (productDetails: {
  name: string;
  tagline: string;
  features: string[];
  uniqueValue: string;
}) => {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  if (!apiKey) throw new Error('OpenAI API key required');

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

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.8,
      max_tokens: 1000
    })
  });

  const data = await response.json();
  return data.choices[0]?.message?.content || '';
};

/**
 * Generate Twitter Thread
 */
export const generateTwitterThread = async (topic: string, numTweets: number = 7) => {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  if (!apiKey) throw new Error('OpenAI API key required');

  const prompt = `Create a ${numTweets}-tweet thread about: ${topic}

For a SaaS product launch (DataFlowHub AI - AI-powered data analytics)

Requirements:
- Tweet 1: Hook (surprising stat or bold claim)
- Tweet 2-5: Value props and features
- Tweet 6: Social proof or demo
- Tweet 7: CTA with link

Each tweet:
- Max 280 characters
- Include emojis
- No hashtags in thread (save for final tweet)
- Conversational tone
- Visual descriptions (for accompanying images)

Make it viral-worthy!`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.9,
      max_tokens: 1200
    })
  });

  const data = await response.json();
  return data.choices[0]?.message?.content || '';
};

/**
 * Generate Daily Social Media Content
 */
export const generateDailySocialContent = async (
  platform: 'twitter' | 'linkedin' | 'facebook',
  contentPillar: 'education' | 'product_update' | 'customer_story' | 'tips' | 'inspiration'
) => {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  if (!apiKey) throw new Error('OpenAI API key required');

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

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.8,
      max_tokens: 600
    })
  });

  const data = await response.json();
  return data.choices[0]?.message?.content || '';
};

/**
 * Generate Blog Post Outline
 */
export const generateBlogPost = async (
  topic: string,
  keywords: string[],
  wordCount: number = 1500
) => {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  if (!apiKey) throw new Error('OpenAI API key required');

  const prompt = `Write a comprehensive blog post:

Topic: ${topic}
Target Keywords: ${keywords.join(', ')}
Word Count: ~${wordCount} words

For: DataFlowHub AI blog (AI-powered data analytics platform)

Structure:
1. SEO Title (60 chars, includes primary keyword)
2. Meta Description (155 chars)
3. Introduction (hook + problem statement)
4. Main Content (H2 sections with examples)
5. How DataFlowHub Helps (product integration)
6. Conclusion + CTA

Make it:
- SEO-optimized
- Actionable (practical tips)
- Example-heavy (show, don't tell)
- Naturally mention DataFlowHub
- Include internal links suggestions
- Not overly promotional

Tone: Helpful expert, not salesy`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 2500
    })
  });

  const data = await response.json();
  return data.choices[0]?.message?.content || '';
};

/**
 * Generate Ad Copy Variations
 */
export const generateAdCopy = async (
  platform: 'google' | 'facebook' | 'linkedin',
  objective: 'awareness' | 'conversion' | 'signup'
) => {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  if (!apiKey) throw new Error('OpenAI API key required');

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

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.9,
      max_tokens: 1500
    })
  });

  const data = await response.json();
  return data.choices[0]?.message?.content || '';
};

/**
 * Generate Email Campaign
 */
export const generateEmailCampaign = async (
  campaignType: 'welcome' | 'onboarding' | 'engagement' | 'conversion',
  numEmails: number = 5
) => {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  if (!apiKey) throw new Error('OpenAI API key required');

  const prompt = `Create a ${numEmails}-email ${campaignType} campaign.

Product: DataFlowHub AI
Audience: New signups (free tier users)
Goal: ${campaignType === 'conversion' ? 'Convert to $49/mo Pro plan' : 'Engage and activate users'}

For each email provide:
1. **Day**: When to send (Day 0, 3, 7, etc.)
2. **Subject Line**: (50 chars max, high open rate)
3. **Preview Text**: (40 chars, appears in inbox)
4. **Body**: (200-300 words, conversational)
5. **CTA**: (Clear button text)
6. **Goal**: What this email accomplishes

Campaign arc:
- Email 1: Welcome, set expectations
- Email 2-4: Provide value, build trust
- Email 5: Strong conversion push

Tone: Helpful friend, not pushy salesperson

Include:
- Personalization tokens: {{name}}
- Feature highlights
- User success stories
- Upgrade benefits
- Urgency (subtle)`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 2000
    })
  });

  const data = await response.json();
  return data.choices[0]?.message?.content || '';
};

/**
 * Generate 30-Day Content Calendar
 */
export const generateContentCalendar = async (
  platforms: string[],
  startDate: Date
) => {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  if (!apiKey) throw new Error('OpenAI API key required');

  const prompt = `Create a 30-day content calendar for DataFlowHub AI launch.

Platforms: ${platforms.join(', ')}
Start Date: ${startDate.toLocaleDateString()}

Content Pillars:
1. Education (how-to, tips)
2. Product features (showcase capabilities)
3. Customer success (testimonials, case studies)
4. Industry insights (data trends)
5. Behind-the-scenes (founder story)

For each day, provide:
- Date
- Platform
- Content type
- Post topic/angle
- Key message
- CTA
- Hashtags (if applicable)

Balance:
- 40% educational
- 30% product
- 20% social proof
- 10% promotional

Mix formats:
- Text posts
- Videos
- Images
- Polls
- Threads

Optimize posting times for each platform.`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 3000
    })
  });

  const data = await response.json();
  return data.choices[0]?.message?.content || '';
};

/**
 * Analyze Competition
 */
export const analyzeCompetition = async (competitors: string[]) => {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  if (!apiKey) throw new Error('OpenAI API key required');

  const prompt = `Analyze these competitors for DataFlowHub AI:

Competitors: ${competitors.join(', ')}

For each, identify:
1. **Positioning**: How they position themselves
2. **Pricing**: Their pricing strategy
3. **Key Features**: What they emphasize
4. **Messaging**: Taglines, value props
5. **Gaps**: What they're missing (our opportunities)

Then provide:
**Differentiation Strategy**: How to position DataFlowHub
**Messaging Angles**: What to emphasize
**Target Customers**: Who to focus on (underserved by competitors)
**Marketing Channels**: Where they're weak

Be specific and actionable.`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.6,
      max_tokens: 2000
    })
  });

  const data = await response.json();
  return data.choices[0]?.message?.content || '';
};

/**
 * Generate Response to Comments/Feedback
 */
export const generateCommentResponse = async (
  originalComment: string,
  context: 'product_hunt' | 'reddit' | 'twitter' | 'support'
) => {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  if (!apiKey) throw new Error('OpenAI API key required');

  const toneGuide = {
    product_hunt: 'Friendly, grateful, helpful. Engage authentically.',
    reddit: 'Casual, transparent, avoid marketing speak.',
    twitter: 'Brief, witty, conversational.',
    support: 'Professional, helpful, solution-oriented.'
  };

  const prompt = `Generate a response to this ${context} comment:

Comment: "${originalComment}"

Context: DataFlowHub AI (AI data analytics platform)
Tone: ${toneGuide[context]}

Response should:
- Thank them for feedback
- Address their point directly
- Provide value (answer, tip, or insight)
- Invite continued conversation
- Include CTA if appropriate (subtle!)

Keep it authentic and helpful, not salesy.
Max 200 words.`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 300
    })
  });

  const data = await response.json();
  return data.choices[0]?.message?.content || '';
};

/**
 * Generate Launch Week Content Bundle
 */
export const generateLaunchWeekBundle = async () => {
  const bundle = {
    productHunt: '',
    twitterThread: '',
    linkedinPost: '',
    redditPost: '',
    blogPost: '',
    emailAnnouncement: ''
  };

  // Generate all content in parallel
  const [ph, twitter, linkedin, reddit, blog, email] = await Promise.all([
    generateProductHuntPost({
      name: 'DataFlowHub AI',
      tagline: 'Talk to your data - Get AI insights',
      features: [
        'Natural language data transformation',
        'Voice-enabled AI chat',
        '27 industry personalizations',
        'Multi-agent AI system',
        'Conversation memory'
      ],
      uniqueValue: 'Only platform combining voice, natural language, and industry-specific AI'
    }),
    generateTwitterThread('Launching DataFlowHub AI - AI that understands YOUR industry', 8),
    generateLinkedInLaunchPost(),
    generateRedditLaunchPost(),
    generateBlogPost('How We Built an AI Data Platform in 5 Hours', ['AI', 'data analytics', 'SaaS'], 1200),
    generateEmailCampaign('welcome', 1)
  ]);

  bundle.productHunt = ph;
  bundle.twitterThread = twitter;
  bundle.linkedinPost = linkedin;
  bundle.redditPost = reddit;
  bundle.blogPost = blog;
  bundle.emailAnnouncement = email;

  return bundle;
};

// Helper functions
const generateLinkedInLaunchPost = async () => {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [{
        role: 'user',
        content: `Write a LinkedIn launch post for DataFlowHub AI.

Professional tone, 200-250 words.
Highlight: Voice input, natural language, 27 industry personalizations
Include: Personal founder story, vision, CTA
Hashtags: #AI #DataAnalytics #SaaS #ProductLaunch #Startup`
      }],
      temperature: 0.7,
      max_tokens: 500
    })
  });
  const data = await response.json();
  return data.choices[0]?.message?.content || '';
};

const generateRedditLaunchPost = async () => {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [{
        role: 'user',
        content: `Write a Reddit r/SideProject launch post for DataFlowHub AI.

Casual tone, transparent, technical details welcomed.
Title: Catchy, specific
Body: 300 words
Include: Tech stack, unique features, asking for feedback
No marketing speak!
Link to interactive demo`
      }],
      temperature: 0.8,
      max_tokens: 600
    })
  });
  const data = await response.json();
  return data.choices[0]?.message?.content || '';
};

// ============================================================================
// AUTOMATION
// ============================================================================

/**
 * Auto-generate weekly content
 */
export const runWeeklyContentGeneration = async () => {
  console.log('🤖 Marketing Bot: Generating weekly content...');
  
  const calendar = await generateContentCalendar(
    ['twitter', 'linkedin'],
    new Date()
  );
  
  console.log('✅ Content calendar generated for next 7 days');
  console.log(calendar);
  
  return calendar;
};

/**
 * Save generated content to file
 */
export const saveMarketingContent = (content: string, filename: string) => {
  // In a real app, you'd save to database or file system
  // For now, log and allow download
  console.log('📝 Generated content saved:', filename);
  
  // Create downloadable file
  const blob = new Blob([content], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

