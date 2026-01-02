// Conversation Memory System
// Stores and retrieves conversation history for persistent AI context

import { supabase } from './supabase';

type ConversationStorageMode = 'supabase' | 'local-only';

let conversationStorageMode: ConversationStorageMode = 'supabase';
let hasLoggedMissingTableWarning = false;

const isMissingTableError = (error: any): boolean => {
  if (!error) return false;
  const code = String(error.code || error.status || error.statusCode || '').toUpperCase();
  if (code === 'PGRST205' || code === '42P01') {
    return true;
  }

  if (error?.status === 404 || error?.status === 406) {
    return true;
  }

  const message = String(error?.message || '').toLowerCase();
  const hint = String(error?.hint || '').toLowerCase();
  return message.includes('conversations') || hint.includes('conversations');
};

const disableSupabaseConversationStorage = (error?: any) => {
  conversationStorageMode = 'local-only';
  if (!hasLoggedMissingTableWarning) {
    console.warn(
      'Conversations table is not available in Supabase. Falling back to localStorage until the migration is applied.',
      error
    );
    hasLoggedMissingTableWarning = true;
  }
};

const shouldUseSupabaseStorage = () => conversationStorageMode === 'supabase';

export interface StoredConversation {
  id: string;
  user_id: string;
  dataset_id: string;
  dataset_name: string;
  messages: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
  }>;
  metadata?: {
    use_case?: string;
    topics?: string[];
    summary?: string;
  };
  created_at: string;
  updated_at: string;
}

export interface ConversationSummary {
  total_conversations: number;
  favorite_topics: string[];
  common_questions: string[];
  user_preferences: {
    preferred_chart_types?: string[];
    frequently_analyzed_columns?: string[];
    communication_style?: string;
  };
}

/**
 * Save conversation to database
 */
export const saveConversation = async (
  userId: string,
  datasetId: string,
  datasetName: string,
  messages: any[],
  metadata?: any
): Promise<string> => {
  if (!shouldUseSupabaseStorage()) {
    saveToLocalStorage(userId, datasetId, messages);
    return `local_${datasetId}`;
  }

  try {
    const { data, error } = await supabase
      .from('conversations')
      .upsert({
        user_id: userId,
        dataset_id: datasetId,
        dataset_name: datasetName,
        messages: messages,
        metadata: metadata,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,dataset_id',
        ignoreDuplicates: false
      })
      .select()
      .single();

    if (error) {
      if (isMissingTableError(error)) {
        disableSupabaseConversationStorage(error);
      } else {
        console.warn('Could not save conversation to Supabase, using localStorage:', error);
      }
      saveToLocalStorage(userId, datasetId, messages);
      return `local_${datasetId}`;
    }

    return data.id;
  } catch (error) {
    if (isMissingTableError(error)) {
      disableSupabaseConversationStorage(error);
    } else {
      console.error('Error saving conversation:', error);
    }
    // Fallback to localStorage
    saveToLocalStorage(userId, datasetId, messages);
    return `local_${datasetId}`;
  }
};

/**
 * Load conversation history for a dataset
 */
export const loadConversation = async (
  userId: string,
  datasetId: string
): Promise<any[]> => {
  if (!shouldUseSupabaseStorage()) {
    return loadFromLocalStorage(userId, datasetId);
  }

  try {
    const { data, error } = await supabase
      .from('conversations')
      .select('messages')
      .eq('user_id', userId)
      .eq('dataset_id', datasetId)
      .single();

    if (error || !data) {
      if (error && isMissingTableError(error)) {
        disableSupabaseConversationStorage(error);
      }
      // Try localStorage fallback
      return loadFromLocalStorage(userId, datasetId);
    }

    return data.messages || [];
  } catch (error) {
    if (isMissingTableError(error)) {
      disableSupabaseConversationStorage(error);
    } else {
      console.error('Error loading conversation:', error);
    }
    return loadFromLocalStorage(userId, datasetId);
  }
};

/**
 * Get all conversations for a user
 */
export const getUserConversations = async (
  userId: string
): Promise<StoredConversation[]> => {
  if (!shouldUseSupabaseStorage()) {
    return [];
  }

  try {
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (error || !data) {
      if (error && isMissingTableError(error)) {
        disableSupabaseConversationStorage(error);
      }
      return [];
    }

    return data;
  } catch (error) {
    if (isMissingTableError(error)) {
      disableSupabaseConversationStorage(error);
    } else {
      console.error('Error getting conversations:', error);
    }
    return [];
  }
};

/**
 * Generate conversation summary for personalization
 */
export const generateConversationSummary = async (
  userId: string
): Promise<ConversationSummary> => {
  const conversations = await getUserConversations(userId);
  
  if (conversations.length === 0) {
    return {
      total_conversations: 0,
      favorite_topics: [],
      common_questions: [],
      user_preferences: {}
    };
  }

  // Analyze all messages to find patterns
  const allMessages = conversations.flatMap(c => c.messages);
  const userMessages = allMessages.filter(m => m.role === 'user');

  // Extract topics (simple keyword extraction)
  const topics: Record<string, number> = {};
  userMessages.forEach(msg => {
    const words = msg.content.toLowerCase().split(' ');
    words.forEach(word => {
      if (word.length > 4) { // Filter short words
        topics[word] = (topics[word] || 0) + 1;
      }
    });
  });

  const favoriteTopics = Object.entries(topics)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([topic]) => topic);

  // Find common questions
  const commonQuestions = userMessages
    .filter(m => m.content.includes('?'))
    .map(m => m.content)
    .slice(0, 5);

  return {
    total_conversations: conversations.length,
    favorite_topics: favoriteTopics,
    common_questions: commonQuestions,
    user_preferences: extractPreferences(allMessages)
  };
};

/**
 * Extract user preferences from conversation history
 */
const extractPreferences = (messages: any[]) => {
  const preferences: any = {};
  
  // Look for patterns in questions
  const chartMentions = messages.filter(m => 
    m.content.toLowerCase().includes('chart') || 
    m.content.toLowerCase().includes('visualiz')
  );

  if (chartMentions.length > 3) {
    preferences.preferred_chart_types = ['bar', 'line', 'pie']; // Could be more sophisticated
  }

  return preferences;
};

/**
 * Build enhanced prompt with conversation memory
 */
export const buildPromptWithMemory = async (
  userId: string,
  datasetId: string,
  currentQuestion: string,
  basePrompt: string
): Promise<string> => {
  const summary = await generateConversationSummary(userId);
  
  if (summary.total_conversations === 0) {
    return basePrompt;
  }

  // Enhance prompt with learned preferences
  let enhancedPrompt = basePrompt + `\n\n**User Context from ${summary.total_conversations} previous conversations:**\n`;

  if (summary.favorite_topics.length > 0) {
    enhancedPrompt += `\nTopics user frequently explores: ${summary.favorite_topics.join(', ')}`;
  }

  if (summary.user_preferences.preferred_chart_types) {
    enhancedPrompt += `\nUser likes these visualizations: ${summary.user_preferences.preferred_chart_types.join(', ')}`;
  }

  enhancedPrompt += `\n\nUse this context to provide more relevant and personalized responses.`;

  return enhancedPrompt;
};

// ============================================================================
// LOCALSTORAGE FALLBACK
// ============================================================================

const STORAGE_KEY_PREFIX = 'conversation_';

const saveToLocalStorage = (userId: string, datasetId: string, messages: any[]) => {
  try {
    const key = `${STORAGE_KEY_PREFIX}${userId}_${datasetId}`;
    localStorage.setItem(key, JSON.stringify({
      messages,
      updated_at: new Date().toISOString()
    }));
  } catch (error) {
    console.error('localStorage save error:', error);
  }
};

const loadFromLocalStorage = (userId: string, datasetId: string): any[] => {
  try {
    const key = `${STORAGE_KEY_PREFIX}${userId}_${datasetId}`;
    const stored = localStorage.getItem(key);
    
    if (stored) {
      const parsed = JSON.parse(stored);
      return parsed.messages || [];
    }
  } catch (error) {
    console.error('localStorage load error:', error);
  }
  
  return [];
};

const deleteFromLocalStorage = (userId: string, datasetId: string) => {
  try {
    const key = `${STORAGE_KEY_PREFIX}${userId}_${datasetId}`;
    localStorage.removeItem(key);
  } catch (error) {
    console.error('localStorage delete error:', error);
  }
};

/**
 * Delete a specific conversation
 */
export const deleteConversation = async (userId: string, datasetId: string): Promise<void> => {
  // Always delete from localStorage
  deleteFromLocalStorage(userId, datasetId);

  if (!shouldUseSupabaseStorage()) {
    return;
  }

  try {
    await supabase
      .from('conversations')
      .delete()
      .eq('user_id', userId)
      .eq('dataset_id', datasetId);
  } catch (error) {
    if (isMissingTableError(error)) {
      disableSupabaseConversationStorage(error);
    } else {
      console.error('Error deleting conversation:', error);
      throw error;
    }
  }
};

/**
 * Clear old conversations (cleanup)
 */
export const clearOldConversations = async (userId: string, daysOld: number = 90) => {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);

  if (!shouldUseSupabaseStorage()) {
    return;
  }

  try {
    await supabase
      .from('conversations')
      .delete()
      .eq('user_id', userId)
      .lt('updated_at', cutoffDate.toISOString());
  } catch (error) {
    if (isMissingTableError(error)) {
      disableSupabaseConversationStorage(error);
    } else {
      console.error('Error clearing old conversations:', error);
    }
  }
};
