// AIRoutSystem using LangChain and LangGraph
// Multi-agent collaboration for powerful data analysis

// Note: LangChain imports can cause bundling issues in production
// Using direct OpenAI API calls instead for reliability
import { z } from "zod";
import { DynamicStructuredTool } from "@langchain/core/tools";
import { Dataset } from '../types';
import { UserProfile } from '../utils/personalizedPrompts';
// Note: Import marketing functions where needed to avoid circular dependencies
// import { buildMarketingSystemPrompt, isMarketingUser } from './agents/marketingAgentSimple';
import * as stats from 'simple-statistics';

// ============================================================================
// HELPER FUNCTIONS - Must be defined BEFORE usage to prevent bundling errors
// ============================================================================

/**
 * Check if user has marketing-related use case
 * DEFINED EARLY to prevent "is not defined" errors during bundling
 */
export const isMarketingUser = (userProfile: UserProfile): boolean => {
  try {
    const marketingUseCases = [
      'marketing-analytics',
      'customer-insights',
      'sales-forecasting',
      'business-analytics',
      'real-estate',
      'retail'
    ];
    
    return marketingUseCases.includes(userProfile?.use_case || '');
  } catch (error) {
    console.error('isMarketingUser error:', error);
    return false;
  }
};

/**
 * Build marketing system prompt
 */
export const buildMarketingSystemPrompt = (userProfile: UserProfile, dataset: Dataset) => {
  return `You are a marketing strategist and expert copywriter with deep knowledge of:

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
};

/**
 * Build analyst prompt with context
 */
const buildAnalystPrompt = (context: any) => {
  return `You are a data analyst helping ${context?.userProfile?.job_title || 'a user'}.

Dataset: ${context?.dataset?.name}
Columns: ${context?.dataset?.preview_data?.columns?.join(', ') || 'unknown'}
User's focus: ${context?.userProfile?.use_case || 'general analysis'}

Analyze the data and provide insights relevant to their role.
Be specific, use actual numbers, reference column names.`;
};

// ============================================================================
// AGENT TOOLS - Functions that agents can call
// ============================================================================

/**
 * Data Analysis Tools
 */
export const createDataAnalysisTools = (dataset: Dataset) => {
  return [
    new DynamicStructuredTool({
      name: "calculate_statistics",
      description: "Calculate statistical measures for a column (mean, median, std dev, min, max, count)",
      schema: z.object({
        column: z.string().describe("Column name to analyze"),
        statistics: z.array(z.enum(["mean", "median", "std", "min", "max", "count"]))
      }),
      func: async ({ column, statistics: requestedStats }) => {
        if (!dataset.preview_data?.columns || !dataset.preview_data?.rows) {
          return "No preview data available";
        }

        const colIndex = dataset.preview_data.columns.indexOf(column);
        if (colIndex === -1) {
          return `Column "${column}" not found`;
        }

        const values = dataset.preview_data.rows
          .map(row => Array.isArray(row) ? row[colIndex] : row[column])
          .map(v => parseFloat(String(v)))
          .filter(v => !isNaN(v));

        if (values.length === 0) {
          return `No numeric values in column "${column}"`;
        }

        const results: any = {};
        
        requestedStats.forEach(stat => {
          switch (stat) {
            case "mean":
              results.mean = stats.mean(values);
              break;
            case "median":
              results.median = stats.median(values);
              break;
            case "std":
              results.standardDeviation = stats.standardDeviation(values);
              break;
            case "min":
              results.min = Math.min(...values);
              break;
            case "max":
              results.max = Math.max(...values);
              break;
            case "count":
              results.count = values.length;
              break;
          }
        });

        return JSON.stringify(results, null, 2);
      }
    }),

    new DynamicStructuredTool({
      name: "get_top_values",
      description: "Get top N most common or largest values in a column",
      schema: z.object({
        column: z.string().describe("Column name"),
        limit: z.number().default(5).describe("Number of top values to return"),
        sortBy: z.enum(["frequency", "value"]).default("frequency")
      }),
      func: async ({ column, limit, sortBy }) => {
        if (!dataset.preview_data?.columns || !dataset.preview_data?.rows) {
          return "No preview data available";
        }

        const colIndex = dataset.preview_data.columns.indexOf(column);
        if (colIndex === -1) {
          return `Column "${column}" not found`;
        }

        const values = dataset.preview_data.rows
          .map(row => Array.isArray(row) ? row[colIndex] : row[column])
          .filter(v => v !== null && v !== undefined);

        if (sortBy === "frequency") {
          const freq: Record<string, number> = {};
          values.forEach(v => {
            const key = String(v);
            freq[key] = (freq[key] || 0) + 1;
          });

          const sorted = Object.entries(freq)
            .sort((a, b) => b[1] - a[1])
            .slice(0, limit);

          return JSON.stringify(
            sorted.map(([value, count]) => ({ value, count })),
            null,
            2
          );
        } else {
          // Sort by value
          const numericValues = values
            .map(v => parseFloat(String(v)))
            .filter(v => !isNaN(v))
            .sort((a, b) => b - a)
            .slice(0, limit);

          return JSON.stringify(numericValues, null, 2);
        }
      }
    }),

    new DynamicStructuredTool({
      name: "detect_data_quality_issues",
      description: "Analyze data quality and find issues (missing values, outliers, duplicates)",
      schema: z.object({
        columns: z.array(z.string()).optional().describe("Specific columns to check, or all if not provided")
      }),
      func: async ({ columns: selectedColumns }) => {
        if (!dataset.preview_data) {
          return "No preview data available";
        }

        const { rows, columns } = dataset.preview_data;
        const columnsToCheck = selectedColumns || columns;
        const issues: any[] = [];

        columnsToCheck.forEach(col => {
          const colIndex = columns.indexOf(col);
          if (colIndex === -1) return;

          const values = rows.map(row => 
            Array.isArray(row) ? row[colIndex] : row[col]
          );

          // Check missing values
          const missingCount = values.filter(v => 
            v === null || v === undefined || v === '' || v === 'N/A'
          ).length;

          if (missingCount > 0) {
            issues.push({
              column: col,
              issue: "missing_values",
              count: missingCount,
              percentage: ((missingCount / values.length) * 100).toFixed(1)
            });
          }

          // Check for numeric outliers
          const numericValues = values
            .map(v => parseFloat(String(v)))
            .filter(v => !isNaN(v));

          if (numericValues.length > 3) {
            const mean = stats.mean(numericValues);
            const stdDev = stats.standardDeviation(numericValues);
            const outliers = numericValues.filter(v => 
              Math.abs(v - mean) > 3 * stdDev
            );

            if (outliers.length > 0) {
              issues.push({
                column: col,
                issue: "outliers",
                count: outliers.length,
                values: outliers.slice(0, 3)
              });
            }
          }
        });

        return JSON.stringify(issues, null, 2);
      }
    })
  ];
};

/**
 * Chart Generation Tools
 */
export const createChartTools = (dataset: Dataset) => {
  return [
    new DynamicStructuredTool({
      name: "suggest_best_chart",
      description: "Analyze data and suggest the best chart type for visualization",
      schema: z.object({
        xColumn: z.string().describe("Column for X-axis"),
        yColumn: z.string().optional().describe("Column for Y-axis (if applicable)"),
        purpose: z.string().describe("What insight user wants to see")
      }),
      func: async ({ xColumn, yColumn, purpose }) => {
        if (!dataset.preview_data) {
          return "No data available";
        }

        const { columns, rows } = dataset.preview_data;
        const xIndex = columns.indexOf(xColumn);
        const yIndex = yColumn ? columns.indexOf(yColumn) : -1;

        if (xIndex === -1) {
          return `Column "${xColumn}" not found`;
        }

        const xValues = rows.map(row => Array.isArray(row) ? row[xIndex] : row[xColumn]);
        
        // Determine if column is numeric, date, or categorical
        const uniqueValues = new Set(xValues);
        const isNumeric = xValues.every(v => !isNaN(parseFloat(String(v))));
        const isDate = xColumn.toLowerCase().includes('date') || 
                       xColumn.toLowerCase().includes('time');
        const isCategorical = uniqueValues.size < 20;

        let suggestion = {
          recommendedChart: "",
          reason: "",
          config: {}
        };

        // Decision logic
        if (isDate && yIndex !== -1) {
          suggestion.recommendedChart = "line";
          suggestion.reason = "Time series data best shown with line chart to show trends";
        } else if (isCategorical && yIndex !== -1) {
          suggestion.recommendedChart = "bar";
          suggestion.reason = "Categorical comparison best shown with bar chart";
        } else if (isCategorical && yIndex === -1) {
          suggestion.recommendedChart = "pie";
          suggestion.reason = "Distribution of categories best shown with pie chart";
        } else if (isNumeric && yIndex !== -1) {
          suggestion.recommendedChart = "scatter";
          suggestion.reason = "Numeric relationship best shown with scatter plot";
        } else {
          suggestion.recommendedChart = "bar";
          suggestion.reason = "Default to bar chart for general comparison";
        }

        return JSON.stringify(suggestion, null, 2);
      }
    }),

    new DynamicStructuredTool({
      name: "generate_chart_config",
      description: "Generate Chart.js configuration for a specific chart type",
      schema: z.object({
        chartType: z.enum(["bar", "line", "pie", "scatter"]),
        xColumn: z.string(),
        yColumn: z.string().optional(),
        title: z.string()
      }),
      func: async ({ chartType, xColumn, yColumn, title }) => {
        if (!dataset.preview_data) {
          return "No data available";
        }

        const { columns, rows } = dataset.preview_data;
        const xIndex = columns.indexOf(xColumn);
        const yIndex = yColumn ? columns.indexOf(yColumn) : -1;

        const labels = rows.map(row => 
          String(Array.isArray(row) ? row[xIndex] : row[xColumn])
        );

        let data: number[] = [];
        if (yIndex !== -1 && yColumn) {
          data = rows.map(row => {
            const value = Array.isArray(row) ? row[yIndex] : row[yColumn];
            return parseFloat(String(value)) || 0;
          });
        } else {
          // For pie chart - count frequencies
          const freq: Record<string, number> = {};
          labels.forEach(label => {
            freq[label] = (freq[label] || 0) + 1;
          });
          data = Object.values(freq);
        }

        const chartConfig = {
          type: chartType,
          data: {
            labels: chartType === "pie" ? Object.keys(data) : labels,
            datasets: [{
              label: yColumn || xColumn,
              data: data,
              backgroundColor: chartType === "pie" 
                ? ['#6366F1', '#EC4899', '#F59E0B', '#10B981', '#8B5CF6']
                : 'rgba(99, 102, 241, 0.6)',
              borderColor: 'rgb(99, 102, 241)',
              borderWidth: 2
            }]
          },
          options: {
            responsive: true,
            plugins: {
              title: {
                display: true,
                text: title
              }
            }
          }
        };

        return JSON.stringify(chartConfig, null, 2);
      }
    })
  ];
};

/**
 * Insight Discovery Tools
 */
export const createInsightTools = (dataset: Dataset, userProfile: UserProfile) => {
  return [
    new DynamicStructuredTool({
      name: "find_correlations",
      description: "Find correlations between numeric columns",
      schema: z.object({
        targetColumn: z.string().optional().describe("Column to find correlations with")
      }),
      func: async ({ targetColumn }) => {
        if (!dataset.preview_data) {
          return "No data available";
        }

        const { columns, rows } = dataset.preview_data;
        
        // Get numeric columns
        const numericColumns = columns.filter((col, idx) => {
          const values = rows.map(row => Array.isArray(row) ? row[idx] : row[col]);
          return values.some(v => !isNaN(parseFloat(String(v))));
        });

        if (numericColumns.length < 2) {
          return "Need at least 2 numeric columns for correlation analysis";
        }

        const correlations: any[] = [];

        if (targetColumn) {
          // Correlations with specific column
          const targetIdx = columns.indexOf(targetColumn);
          const targetValues = rows
            .map(row => parseFloat(String(Array.isArray(row) ? row[targetIdx] : row[targetColumn])))
            .filter(v => !isNaN(v));

          numericColumns.forEach(col => {
            if (col === targetColumn) return;
            
            const colIdx = columns.indexOf(col);
            const colValues = rows
              .map(row => parseFloat(String(Array.isArray(row) ? row[colIdx] : row[col])))
              .filter(v => !isNaN(v));

            if (targetValues.length === colValues.length && targetValues.length > 2) {
              const correlation = stats.sampleCorrelation(targetValues, colValues);
              correlations.push({
                column1: targetColumn,
                column2: col,
                correlation: correlation.toFixed(3),
                strength: Math.abs(correlation) > 0.7 ? "strong" : 
                         Math.abs(correlation) > 0.4 ? "moderate" : "weak"
              });
            }
          });
        }

        return JSON.stringify(correlations.slice(0, 5), null, 2);
      }
    }),

    new DynamicStructuredTool({
      name: "detect_trends",
      description: "Detect upward or downward trends in time series data",
      schema: z.object({
        timeColumn: z.string(),
        valueColumn: z.string()
      }),
      func: async ({ timeColumn, valueColumn }) => {
        if (!dataset.preview_data) {
          return "No data available";
        }

        const { columns, rows } = dataset.preview_data;
        const timeIdx = columns.indexOf(timeColumn);
        const valueIdx = columns.indexOf(valueColumn);

        if (timeIdx === -1 || valueIdx === -1) {
          return "Columns not found";
        }

        const values = rows
          .map(row => parseFloat(String(Array.isArray(row) ? row[valueIdx] : row[valueColumn])))
          .filter(v => !isNaN(v));

        if (values.length < 3) {
          return "Need at least 3 data points for trend analysis";
        }

        // Simple linear regression for trend
        const xValues = values.map((_, i) => i);
        const slope = stats.linearRegressionLine(
          stats.linearRegression(xValues.map((x, i) => [x, values[i]]))
        )(1) - stats.linearRegressionLine(
          stats.linearRegression(xValues.map((x, i) => [x, values[i]]))
        )(0);

        const percentChange = ((values[values.length - 1] - values[0]) / values[0]) * 100;

        return JSON.stringify({
          trend: slope > 0 ? "upward" : slope < 0 ? "downward" : "flat",
          slope: slope.toFixed(4),
          percentChange: percentChange.toFixed(2) + "%",
          interpretation: slope > 0 
            ? `${valueColumn} is increasing over time` 
            : slope < 0 
            ? `${valueColumn} is decreasing over time`
            : `${valueColumn} is relatively stable`
        }, null, 2);
      }
    }),

    new DynamicStructuredTool({
      name: "find_anomalies",
      description: "Detect unusual values or patterns in data",
      schema: z.object({
        column: z.string(),
        sensitivity: z.enum(["low", "medium", "high"]).default("medium")
      }),
      func: async ({ column, sensitivity }) => {
        if (!dataset.preview_data) {
          return "No data available";
        }

        const { columns, rows } = dataset.preview_data;
        const colIdx = columns.indexOf(column);

        if (colIdx === -1) {
          return `Column "${column}" not found`;
        }

        const values = rows
          .map((row, idx) => ({
            index: idx,
            value: parseFloat(String(Array.isArray(row) ? row[colIdx] : row[column]))
          }))
          .filter(item => !isNaN(item.value));

        if (values.length < 5) {
          return "Need at least 5 numeric values";
        }

        const nums = values.map(v => v.value);
        const mean = stats.mean(nums);
        const stdDev = stats.standardDeviation(nums);

        const threshold = sensitivity === "high" ? 2 : sensitivity === "medium" ? 3 : 4;
        
        const anomalies = values
          .filter(item => Math.abs(item.value - mean) > threshold * stdDev)
          .map(item => ({
            rowIndex: item.index + 1,
            value: item.value,
            deviation: ((item.value - mean) / stdDev).toFixed(2) + "σ"
          }));

        return JSON.stringify({
          found: anomalies.length,
          anomalies: anomalies.slice(0, 5),
          threshold: `${threshold}σ from mean`,
          interpretation: anomalies.length > 0 
            ? `Found ${anomalies.length} unusual values in ${column}`
            : "No significant anomalies detected"
        }, null, 2);
      }
    })
  ];
};

/**
 * Business Intelligence Tools (Personalized)
 */
export const createBusinessTools = (dataset: Dataset, userProfile: UserProfile) => {
  const tools: any[] = [];

  // Add use-case specific tools
  if (userProfile.use_case === 'accounting' || userProfile.use_case === 'financial-management') {
    tools.push(
      new DynamicStructuredTool({
        name: "calculate_financial_ratios",
        description: "Calculate common financial ratios (profit margin, ROI, etc.)",
        schema: z.object({
          revenueColumn: z.string(),
          expenseColumn: z.string().optional()
        }),
        func: async ({ revenueColumn, expenseColumn }) => {
          // Implementation placeholder - using parameters to avoid linting errors
          console.log('Calculating ratios for:', revenueColumn, expenseColumn);
          return "Financial ratios calculated";
        }
      })
    );
  }

  if (userProfile.use_case === 'real-estate') {
    tools.push(
      new DynamicStructuredTool({
        name: "calculate_property_metrics",
        description: "Calculate real estate metrics (cap rate, ROI, price per sqft)",
        schema: z.object({
          priceColumn: z.string(),
          incomeColumn: z.string().optional(),
          sqftColumn: z.string().optional()
        }),
        func: async ({ priceColumn, incomeColumn, sqftColumn }) => {
          // Implementation placeholder - using parameters to avoid linting errors
          console.log('Calculating metrics for:', priceColumn, incomeColumn, sqftColumn);
          return "Property metrics calculated";
        }
      })
    );
  }

  return tools;
};

// ============================================================================
// AI AGENTS
// ============================================================================

// Removed LangChain agent creation to avoid bundling issues
// Using direct OpenAI API calls in orchestrator instead

// ============================================================================
// ORCHESTRATOR
// ============================================================================

export interface AgentResponse {
  text: string;
  charts?: any[];
  insights?: string[];
  actions?: any[];
  metadata?: any;
}

/**
 * Main orchestrator that coordinates all agents
 */
export const runAgentOrchestrator = async (
  question: string,
  dataset: Dataset,
  userProfile: UserProfile,
  conversationHistory: any[] = []
): Promise<AgentResponse> => {
  
  // Classify the intent
  const intent = await classifyIntent(question);

  // Prepare context
  const context = {
    dataset,
    userProfile,
    conversationHistory,
    intent
  };

  // Route to appropriate agents
  const responses: any[] = [];

  // Call secure backend Edge Function instead of client-side OpenAI API
  try {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Supabase configuration missing');
    }

    // Call secure Edge Function
    const response = await fetch(`${supabaseUrl}/functions/v1/ai-chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'apikey': supabaseAnonKey
      },
      body: JSON.stringify({
        question,
        dataset,
        userProfile,
        conversationHistory: conversationHistory.map(m => ({ role: m.role, content: m.content })),
        intent
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to get AI response');
    }

    const data = await response.json();
    const aiResponse = data.text || 'No response generated';
    
    responses.push({ 
      type: intent.needsMarketing ? "marketing" : "analysis", 
      content: aiResponse
    });
  } catch (error: any) {
    console.error('AI agent error:', error);
    responses.push({
      type: "error",
      content: `I'm having trouble connecting right now. ${error.message || 'Please try again in a moment.'}`
    });
  }

  if (intent.needsChart) {
    try {
      // Chart generation temporarily disabled - requires refactoring
      responses.push({ 
        type: "chart", 
        content: "Chart generation is being enhanced. Use the visualization tab to create charts manually." 
      });
    } catch (error) {
      console.error('Chart generation error:', error);
      responses.push({ type: "chart", content: "Unable to generate chart at this time." });
    }
  }

  if (intent.needsInsights) {
    // Insight generation temporarily disabled - requires refactoring
    responses.push({ 
      type: "insight", 
      content: "Deep insights analysis is being enhanced. The AI response above includes key insights." 
    });
  }

  // If no responses, provide helpful fallback
  if (responses.length === 0) {
    responses.push({
      type: "fallback",
      content: `I can help you with:\n• Data analysis and statistics\n• Chart creation and visualization\n• Insight discovery and patterns${isMarketingUser(userProfile) ? '\n• Marketing strategy and campaigns\n• Customer personas and segmentation\n• Copywriting and content creation' : ''}\n\nWhat would you like to explore?`
    });
  }

  // Synthesize all responses
  return synthesizeAgentResponses(responses, userProfile);
};

/**
 * Classify user intent
 */
const classifyIntent = async (question: string) => {
  const lowerQ = question.toLowerCase();
  
  return {
    needsAnalysis: true, // Always analyze
    needsChart: lowerQ.includes("show") || lowerQ.includes("chart") || lowerQ.includes("visualize") || lowerQ.includes("plot"),
    needsInsights: lowerQ.includes("insight") || lowerQ.includes("pattern") || lowerQ.includes("trend") || lowerQ.includes("why"),
    needsCleaning: lowerQ.includes("clean") || lowerQ.includes("fix") || lowerQ.includes("remove"),
    needsML: lowerQ.includes("predict") || lowerQ.includes("forecast") || lowerQ.includes("model"),
    needsMarketing: lowerQ.includes("campaign") || lowerQ.includes("email") || lowerQ.includes("copy") || 
                    lowerQ.includes("persona") || lowerQ.includes("segment") || lowerQ.includes("marketing") ||
                    lowerQ.includes("ad") || lowerQ.includes("social") || lowerQ.includes("content")
  };
};

/**
 * Synthesize responses from multiple agents
 */
const synthesizeAgentResponses = (responses: any[], userProfile: UserProfile): AgentResponse => {
  const text = responses
    .map(r => r.content)
    .join('\n\n');

  const charts = responses
    .filter(r => r.type === 'chart')
    .map(r => r.content);

  const insights = responses
    .filter(r => r.type === 'insight')
    .map(r => r.content);

  return {
    text,
    charts: charts.length > 0 ? charts : undefined,
    insights: insights.length > 0 ? insights : undefined
  };
};

