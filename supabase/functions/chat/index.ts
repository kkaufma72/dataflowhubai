import { createClient } from 'npm:@supabase/supabase-js@2.39.8';
import OpenAI from 'npm:openai@4.28.0';
import { aiLogger } from '../_shared/logger.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ChatRequest {
  messages: Array<{role: string; content: string}>;
  datasetIds?: string[];
  includeModels?: boolean;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const openaiKey = Deno.env.get('OPENAI_API_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY');

    if (!openaiKey || !supabaseUrl || !supabaseKey) {
      throw new Error('Missing required environment variables');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const openai = new OpenAI({ apiKey: openaiKey });

    const { messages, datasetIds, includeModels }: ChatRequest = await req.json();

    aiLogger.info('Chat orchestration request', {
      messageCount: messages?.length || 0,
      datasetIdsCount: datasetIds?.length || 0,
      includeModels,
    });

    // Fetch selected datasets or all if none specified
    let query = supabase.from('datasets').select('*');
    if (datasetIds && datasetIds.length > 0) {
      query = query.in('id', datasetIds);
    }
    
    const { data: datasets, error: datasetsError } = await query;

    if (datasetsError) throw new Error('Failed to fetch datasets');

    // Optionally fetch models
    let modelsContext = '';
    if (includeModels) {
      const { data: models } = await supabase.from('models').select('*');
      if (models && models.length > 0) {
        modelsContext = `\n\nAvailable Models:\n${models.map(m => 
          `- ${m.name} (${m.algorithm}, Status: ${m.status})`
        ).join('\n')}`;
      }
    }

    // Build rich context
    const datasetContext = datasets?.map(dataset => {
      return `Dataset: ${dataset.name}
Description: ${dataset.description || 'No description'}
Rows: ${dataset.row_count || 'Unknown'}
Columns: ${dataset.preview_data?.columns?.join(', ') || 'No columns'}
Sample Data: ${JSON.stringify(dataset.preview_data?.rows?.slice(0, 3) || [])}
Statistics: ${JSON.stringify(dataset.column_statistics || {})}
---`;
    }).join('\n') || 'No datasets available';

    const systemPrompt = `You are an AI assistant for DataFlowHub, an enterprise AutoML platform. 
    
You have access to the following datasets:
${datasetContext}
${modelsContext}

You can help users:
1. Analyze data across multiple datasets
2. Identify patterns and correlations
3. Suggest machine learning models
4. Create visualizations
5. Answer questions about data quality
6. Provide insights and recommendations
7. Explain ML concepts

When answering:
- Be specific and actionable
- Reference actual data from the datasets
- Suggest concrete next steps
- Use bullet points for clarity
- Highlight important insights`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages
      ],
      temperature: 0.7,
      max_tokens: 1000
    });

    const response = completion.choices[0]?.message?.content || 'No response';
    aiLogger.info('Chat orchestration response generated', {
      tokens: completion.usage,
      datasetsUsed: datasets?.length || 0,
    });

    return new Response(
      JSON.stringify({ response }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error: any) {
    aiLogger.error('Chat error', error);
    return new Response(
      JSON.stringify({ error: error.message }),
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
