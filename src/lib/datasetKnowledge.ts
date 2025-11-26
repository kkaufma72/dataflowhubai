/**
 * Dataset Knowledge Base
 * 
 * Stores and retrieves rich context about datasets including:
 * - Data dictionaries (column definitions, data types, business meanings)
 * - User stories and notes
 * - Analysis history and insights
 * - Related datasets and relationships
 * - Business context and domain knowledge
 */

import { Dataset } from '../types';
import { supabase } from './supabase';

// ============================================================================
// TYPES
// ============================================================================

export interface ColumnDefinition {
  name: string;
  dataType: string;
  description: string;
  businessMeaning?: string;
  examples?: string[];
  validValues?: string[];
  isRequired?: boolean;
  isPrimaryKey?: boolean;
  isForeignKey?: boolean;
  relatedTo?: string; // e.g., "users.id"
}

export interface DataDictionary {
  columns: ColumnDefinition[];
  lastUpdated: string;
  updatedBy?: string;
}

export interface DatasetStory {
  id: string;
  title: string;
  content: string;
  category: 'context' | 'insight' | 'issue' | 'goal' | 'question' | 'note';
  createdAt: string;
  createdBy?: string;
  tags?: string[];
}

export interface DatasetRelationship {
  relatedDatasetId: string;
  relatedDatasetName: string;
  relationshipType: 'joins_to' | 'derives_from' | 'similar_to' | 'part_of';
  joinColumns?: { source: string; target: string }[];
  description?: string;
}

export interface AnalysisInsight {
  id: string;
  question: string;
  answer: string;
  timestamp: string;
  useful?: boolean;
}

export interface DatasetKnowledge {
  datasetId: string;
  datasetName: string;
  
  // Core metadata
  businessContext?: string; // What this data represents in business terms
  dataSource?: string; // Where the data comes from
  refreshFrequency?: string; // How often data is updated
  dataOwner?: string; // Who is responsible for this data
  
  // Structured knowledge
  dataDictionary?: DataDictionary;
  stories: DatasetStory[];
  relationships: DatasetRelationship[];
  analysisHistory: AnalysisInsight[];
  
  // Tags and categorization
  domain?: string; // e.g., 'finance', 'marketing', 'operations'
  tags?: string[];
  
  // Quality info
  knownIssues?: string[];
  dataQualityNotes?: string;
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// LOCAL STORAGE (for offline/quick access)
// ============================================================================

const KNOWLEDGE_STORAGE_KEY = 'dfh_dataset_knowledge';

const getLocalKnowledge = (): Record<string, DatasetKnowledge> => {
  try {
    const stored = localStorage.getItem(KNOWLEDGE_STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
};

const saveLocalKnowledge = (knowledge: Record<string, DatasetKnowledge>) => {
  try {
    localStorage.setItem(KNOWLEDGE_STORAGE_KEY, JSON.stringify(knowledge));
  } catch (e) {
    console.warn('Failed to save knowledge to localStorage:', e);
  }
};

// ============================================================================
// KNOWLEDGE OPERATIONS
// ============================================================================

/**
 * Get or create knowledge base for a dataset
 */
export const getDatasetKnowledge = async (datasetId: string, datasetName: string): Promise<DatasetKnowledge> => {
  // Check local storage first
  const localKnowledge = getLocalKnowledge();
  if (localKnowledge[datasetId]) {
    return localKnowledge[datasetId];
  }
  
  // Try to load from Supabase
  try {
    const { data, error } = await supabase
      .from('dataset_knowledge')
      .select('*')
      .eq('dataset_id', datasetId)
      .single();
    
    if (data && !error) {
      const knowledge = {
        datasetId: data.dataset_id,
        datasetName: data.dataset_name,
        businessContext: data.business_context,
        dataSource: data.data_source,
        refreshFrequency: data.refresh_frequency,
        dataOwner: data.data_owner,
        dataDictionary: data.data_dictionary,
        stories: data.stories || [],
        relationships: data.relationships || [],
        analysisHistory: data.analysis_history || [],
        domain: data.domain,
        tags: data.tags || [],
        knownIssues: data.known_issues || [],
        dataQualityNotes: data.data_quality_notes,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };
      
      // Cache locally
      localKnowledge[datasetId] = knowledge;
      saveLocalKnowledge(localKnowledge);
      
      return knowledge;
    }
  } catch (e) {
    console.warn('Failed to load knowledge from Supabase:', e);
  }
  
  // Create new knowledge base
  const newKnowledge: DatasetKnowledge = {
    datasetId,
    datasetName,
    stories: [],
    relationships: [],
    analysisHistory: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  // Save locally
  localKnowledge[datasetId] = newKnowledge;
  saveLocalKnowledge(localKnowledge);
  
  return newKnowledge;
};

/**
 * Update dataset knowledge
 */
export const updateDatasetKnowledge = async (
  datasetId: string,
  updates: Partial<DatasetKnowledge>
): Promise<DatasetKnowledge> => {
  const localKnowledge = getLocalKnowledge();
  const existing = localKnowledge[datasetId] || { 
    datasetId, 
    stories: [], 
    relationships: [], 
    analysisHistory: [],
    createdAt: new Date().toISOString()
  };
  
  const updated: DatasetKnowledge = {
    ...existing,
    ...updates,
    updatedAt: new Date().toISOString()
  };
  
  // Save locally
  localKnowledge[datasetId] = updated;
  saveLocalKnowledge(localKnowledge);
  
  // Try to save to Supabase
  try {
    await supabase
      .from('dataset_knowledge')
      .upsert({
        dataset_id: datasetId,
        dataset_name: updated.datasetName,
        business_context: updated.businessContext,
        data_source: updated.dataSource,
        refresh_frequency: updated.refreshFrequency,
        data_owner: updated.dataOwner,
        data_dictionary: updated.dataDictionary,
        stories: updated.stories,
        relationships: updated.relationships,
        analysis_history: updated.analysisHistory,
        domain: updated.domain,
        tags: updated.tags,
        known_issues: updated.knownIssues,
        data_quality_notes: updated.dataQualityNotes,
        updated_at: updated.updatedAt
      });
  } catch (e) {
    console.warn('Failed to save knowledge to Supabase:', e);
  }
  
  return updated;
};

/**
 * Add a story/note to a dataset
 */
export const addDatasetStory = async (
  datasetId: string,
  story: Omit<DatasetStory, 'id' | 'createdAt'>
): Promise<DatasetStory> => {
  const knowledge = await getDatasetKnowledge(datasetId, '');
  
  const newStory: DatasetStory = {
    ...story,
    id: `story_${Date.now()}`,
    createdAt: new Date().toISOString()
  };
  
  await updateDatasetKnowledge(datasetId, {
    stories: [...knowledge.stories, newStory]
  });
  
  return newStory;
};

/**
 * Update data dictionary
 */
export const updateDataDictionary = async (
  datasetId: string,
  dictionary: DataDictionary
): Promise<void> => {
  await updateDatasetKnowledge(datasetId, {
    dataDictionary: {
      ...dictionary,
      lastUpdated: new Date().toISOString()
    }
  });
};

/**
 * Add analysis insight from AI conversation
 */
export const addAnalysisInsight = async (
  datasetId: string,
  question: string,
  answer: string
): Promise<void> => {
  const knowledge = await getDatasetKnowledge(datasetId, '');
  
  const insight: AnalysisInsight = {
    id: `insight_${Date.now()}`,
    question,
    answer,
    timestamp: new Date().toISOString()
  };
  
  // Keep last 50 insights
  const updatedHistory = [...knowledge.analysisHistory, insight].slice(-50);
  
  await updateDatasetKnowledge(datasetId, {
    analysisHistory: updatedHistory
  });
};

// ============================================================================
// AUTO-GENERATE KNOWLEDGE FROM DATASET
// ============================================================================

/**
 * Auto-generate initial data dictionary from dataset preview
 */
export const autoGenerateDataDictionary = (dataset: Dataset): DataDictionary => {
  const columns = dataset.preview_data?.columns || [];
  const rows = dataset.preview_data?.rows || [];
  
  const columnDefs: ColumnDefinition[] = columns.map((colName, idx) => {
    // Infer data type from sample values
    const sampleValues = rows.slice(0, 10).map(row => row[idx]).filter(Boolean);
    const dataType = inferDataType(sampleValues);
    
    // Generate description based on column name
    const description = generateColumnDescription(colName);
    
    return {
      name: colName,
      dataType,
      description,
      examples: sampleValues.slice(0, 3).map(String)
    };
  });
  
  return {
    columns: columnDefs,
    lastUpdated: new Date().toISOString()
  };
};

const inferDataType = (values: any[]): string => {
  if (values.length === 0) return 'unknown';
  
  const sample = values[0];
  
  if (typeof sample === 'number' || !isNaN(Number(sample))) {
    const hasDecimals = values.some(v => String(v).includes('.'));
    return hasDecimals ? 'decimal' : 'integer';
  }
  
  if (typeof sample === 'boolean' || ['true', 'false', '0', '1'].includes(String(sample).toLowerCase())) {
    return 'boolean';
  }
  
  // Check for date patterns
  const datePatterns = [/^\d{4}-\d{2}-\d{2}/, /^\d{2}\/\d{2}\/\d{4}/, /^\d{1,2}-\w{3}-\d{4}/];
  if (datePatterns.some(p => p.test(String(sample)))) {
    return 'date';
  }
  
  // Check for email
  if (String(sample).includes('@') && String(sample).includes('.')) {
    return 'email';
  }
  
  return 'string';
};

const generateColumnDescription = (columnName: string): string => {
  const name = columnName.toLowerCase().replace(/[_-]/g, ' ');
  
  const descriptions: Record<string, string> = {
    'id': 'Unique identifier',
    'name': 'Name or title',
    'email': 'Email address',
    'phone': 'Phone number',
    'date': 'Date value',
    'created': 'Creation timestamp',
    'updated': 'Last update timestamp',
    'amount': 'Monetary amount',
    'price': 'Price value',
    'quantity': 'Quantity or count',
    'total': 'Total value',
    'status': 'Current status',
    'type': 'Category or type',
    'description': 'Description text',
    'address': 'Address information',
    'city': 'City name',
    'state': 'State or province',
    'country': 'Country name',
    'zip': 'Postal/ZIP code',
    'revenue': 'Revenue amount',
    'cost': 'Cost amount',
    'profit': 'Profit amount',
    'margin': 'Margin percentage',
    'customer': 'Customer information',
    'user': 'User information',
    'product': 'Product information',
    'category': 'Category classification',
    'region': 'Geographic region',
    'channel': 'Sales or marketing channel',
    'source': 'Data source',
    'value': 'Numeric value'
  };
  
  for (const [key, desc] of Object.entries(descriptions)) {
    if (name.includes(key)) {
      return desc;
    }
  }
  
  return `${columnName} field`;
};

// ============================================================================
// BUILD AI CONTEXT
// ============================================================================

/**
 * Build comprehensive AI context from dataset knowledge
 */
export const buildKnowledgeContext = async (dataset: Dataset): Promise<string> => {
  const knowledge = await getDatasetKnowledge(dataset.id, dataset.name);
  
  let context = `\n\n## Dataset Knowledge Base: ${dataset.name}\n`;
  
  // Business context
  if (knowledge.businessContext) {
    context += `\n### Business Context\n${knowledge.businessContext}\n`;
  }
  
  // Data source info
  if (knowledge.dataSource || knowledge.refreshFrequency || knowledge.dataOwner) {
    context += `\n### Data Source Information\n`;
    if (knowledge.dataSource) context += `- **Source**: ${knowledge.dataSource}\n`;
    if (knowledge.refreshFrequency) context += `- **Refresh Frequency**: ${knowledge.refreshFrequency}\n`;
    if (knowledge.dataOwner) context += `- **Data Owner**: ${knowledge.dataOwner}\n`;
  }
  
  // Data dictionary
  if (knowledge.dataDictionary?.columns?.length) {
    context += `\n### Data Dictionary\n`;
    knowledge.dataDictionary.columns.forEach(col => {
      context += `- **${col.name}** (${col.dataType}): ${col.description}`;
      if (col.businessMeaning) context += ` - ${col.businessMeaning}`;
      context += '\n';
    });
  }
  
  // Stories and notes
  if (knowledge.stories.length > 0) {
    context += `\n### User Notes & Context\n`;
    knowledge.stories.slice(-5).forEach(story => {
      context += `- [${story.category.toUpperCase()}] ${story.title}: ${story.content}\n`;
    });
  }
  
  // Known issues
  if (knowledge.knownIssues?.length) {
    context += `\n### Known Data Issues\n`;
    knowledge.knownIssues.forEach(issue => {
      context += `- ⚠️ ${issue}\n`;
    });
  }
  
  // Recent analysis insights (for continuity)
  if (knowledge.analysisHistory.length > 0) {
    context += `\n### Recent Analysis (for continuity)\n`;
    knowledge.analysisHistory.slice(-3).forEach(insight => {
      context += `Q: ${insight.question.substring(0, 100)}...\n`;
      context += `A: ${insight.answer.substring(0, 200)}...\n\n`;
    });
  }
  
  // Domain-specific guidance
  if (knowledge.domain) {
    context += `\n### Domain: ${knowledge.domain}\n`;
    context += getDomainGuidance(knowledge.domain);
  }
  
  return context;
};

const getDomainGuidance = (domain: string): string => {
  const guidance: Record<string, string> = {
    'finance': 'Consider financial metrics like ROI, margins, cash flow. Watch for currency and fiscal year considerations.',
    'marketing': 'Focus on conversion rates, CAC, LTV, attribution. Consider campaign timing and seasonality.',
    'sales': 'Look at pipeline stages, win rates, deal sizes, sales cycles. Consider territory and rep performance.',
    'operations': 'Analyze throughput, cycle times, defect rates, capacity utilization. Consider supply chain factors.',
    'hr': 'Consider headcount, turnover, hiring metrics, compensation bands. Watch for privacy concerns.',
    'healthcare': 'Follow HIPAA guidelines. Consider patient outcomes, readmission rates, length of stay.',
    'retail': 'Focus on same-store sales, inventory turns, basket size, foot traffic. Consider seasonality.',
    'ecommerce': 'Analyze conversion funnels, cart abandonment, AOV, repeat purchase rates.',
    'real-estate': 'Consider property values, rental yields, vacancy rates, market comparables.',
    'economic': 'Reference economic cycles, Fed policy, leading/lagging indicators. Use YoY comparisons.'
  };
  
  return guidance[domain.toLowerCase()] || '';
};

export default {
  getDatasetKnowledge,
  updateDatasetKnowledge,
  addDatasetStory,
  updateDataDictionary,
  addAnalysisInsight,
  autoGenerateDataDictionary,
  buildKnowledgeContext
};

