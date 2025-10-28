import { createClient } from 'npm:@supabase/supabase-js@2.39.8';
import OpenAI from 'npm:openai@4.28.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AIChatRequest {
  question: string;
  dataset: {
    id: string;
    name: string;
    rows?: number;
    columns?: number;
    preview_data?: {
      columns: string[];
      rows: any[];
    };
    column_statistics?: any;
  };
  userProfile: {
    full_name?: string;
    email?: string;
    company?: string;
    job_title?: string;
    use_case?: string;
  };
  conversationHistory: Array<{
    role: string;
    content: string;
  }>;
  intent?: {
    needsMarketing?: boolean;
    needsChart?: boolean;
    needsInsights?: boolean;
    needsCleaning?: boolean;
  };
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get environment variables
    const openaiKey = Deno.env.get('OPENAI_API_KEY');
    
    if (!openaiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Parse request
    const body: AIChatRequest = await req.json();
    const { question, dataset, userProfile, conversationHistory, intent } = body;

    // Initialize OpenAI client
    const openai = new OpenAI({ apiKey: openaiKey });

    // Build system prompt based on user profile
    let systemPrompt = '';
    
    const isMarketingUser = ['marketing-analytics', 'customer-insights', 'sales-forecasting', 'business-analytics', 'real-estate', 'retail'].includes(userProfile?.use_case || '');
    
    if (intent?.needsMarketing || isMarketingUser) {
      systemPrompt = `You are a marketing strategist and expert copywriter with deep knowledge of:

**Marketing Frameworks:**
- AIDA (Attention, Interest, Desire, Action)
- PAS (Problem, Agitate, Solve)
- FAB (Features, Advantages, Benefits)
- StoryBrand (7-part framework)
- Value Proposition Canvas

**Current Context:**
- User: ${userProfile?.job_title || 'Marketing professional'} at ${userProfile?.company || 'their company'}
- Industry: ${userProfile?.use_case}
- Dataset: ${dataset?.name} (${dataset?.rows || 0} customers/records)
- Your Goal: Help them grow their business through data-driven marketing

Use their customer data to provide insights they can act on TODAY.`;
    } else {
      systemPrompt = `You are a data analyst and transformation expert helping ${userProfile?.job_title || 'a user'}.

Dataset: ${dataset?.name}
Columns: ${dataset?.preview_data?.columns?.join(', ') || 'unknown'}
User's focus: ${userProfile?.use_case || 'general analysis'}

${intent?.needsCleaning ? `
IMPORTANT: The user wants to CLEAN this data. You can:

1. **Analyze Quality Issues:**
   - Missing values (nulls, blanks)
   - Duplicate rows
   - Outliers (statistical anomalies)
   - Data type inconsistencies
   - Format issues

2. **Provide Cleaning Steps:**
   - Be specific about what to fix
   - Give exact column names
   - Explain why each fix matters
   - Prioritize by impact

3. **Suggest Transformations:**
   - Fill missing values (median for numeric, mode for categorical)
   - Remove duplicates
   - Handle outliers (cap or remove)
   - Standardize formats
   - Convert data types

Be actionable and specific. Reference actual data from the dataset.
` : ''}

Analyze the data and provide insights relevant to their role.
Be specific, use actual numbers, reference column names.`;
    }

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        ...conversationHistory.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
        { role: 'user', content: question }
      ],
      temperature: 0.7,
      max_tokens: 1000
    });

    const aiResponse = completion.choices[0]?.message?.content || 'No response generated';

    return new Response(
      JSON.stringify({ 
        text: aiResponse,
        usage: completion.usage
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error: any) {
    console.error('AI chat error:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to get AI response',
        details: error.toString()
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});
