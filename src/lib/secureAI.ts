/**
 * Secure AI API wrapper
 * 
 * This module provides secure access to AI features by routing all OpenAI API calls
 * through a backend Edge Function. NEVER call OpenAI API directly from client code.
 * 
 * WHY: Client-side API keys are visible to anyone who inspects the JavaScript bundle,
 * allowing unauthorized usage and potential abuse.
 */

import { supabase } from './supabase';

export interface SecureAIChatRequest {
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
  conversationHistory?: Array<{
    role: string;
    content: string;
  }>;
  intent?: {
    needsMarketing?: boolean;
    needsChart?: boolean;
    needsInsights?: boolean;
  };
}

export interface SecureAIChatResponse {
  text: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * Call AI chat securely through Edge Function
 * 
 * @param request - Chat request with question, dataset, and user context
 * @returns AI response text and usage statistics
 */
export const secureAIChat = async (
  request: SecureAIChatRequest
): Promise<SecureAIChatResponse> => {
  try {
    const { data, error } = await supabase.functions.invoke('ai-chat', {
      body: request
    });

    if (error) {
      throw new Error(error.message || 'Failed to get AI response');
    }

    return data as SecureAIChatResponse;
  } catch (error: any) {
    console.error('Secure AI chat error:', error);
    throw new Error(error.message || 'Failed to connect to AI service');
  }
};

/**
 * Generate marketing content securely
 * 
 * @param prompt - Marketing content prompt
 * @param contentType - Type of marketing content (email, social, ad, etc.)
 * @returns Generated marketing content
 */
export const secureMarketingContent = async (
  prompt: string,
  _contentType: 'email' | 'social' | 'ad' | 'blog' | 'product_hunt' | 'twitter'
): Promise<string> => {
  try {
    // Create a minimal dataset for marketing content
    const marketingRequest: SecureAIChatRequest = {
      question: prompt,
      dataset: {
        id: 'marketing',
        name: 'Marketing Content Generation',
      },
      userProfile: {
        use_case: 'marketing-analytics'
      },
      intent: {
        needsMarketing: true
      }
    };

    const response = await secureAIChat(marketingRequest);
    return response.text;
  } catch (error: any) {
    console.error('Marketing content generation error:', error);
    throw new Error(error.message || 'Failed to generate marketing content');
  }
};

/**
 * DEPRECATED: Do not use OpenAI API key from environment variables
 * 
 * This function will throw an error if called. Use secureAIChat() instead.
 * 
 * @deprecated Use secureAIChat() instead
 */
export const getOpenAIKey = (): never => {
  throw new Error(
    '🚨 SECURITY ERROR: Never use OpenAI API keys in client-side code! Use secureAIChat() instead.'
  );
};

export default {
  secureAIChat,
  secureMarketingContent,
};

