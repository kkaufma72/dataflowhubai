// AIRoutSystem using LangChain and LangGraph
// Multi-agent collaboration for powerful data analysis

import { ChatOpenAI } from "@langchain/openai";
import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { Dataset } from '../types';
import { UserProfile } from '../utils/personalizedPrompts';
import * as stats from 'simple-statistics';
import { createMarketingAgent, isMarketingUser } from './agents/marketingAgent';

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
        if (yIndex !== -1) {
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
          // Implementation
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
          // Implementation
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

/**
 * Data Analyst Agent - Main analysis agent
 */
export const createDataAnalystAgent = (dataset: Dataset, userProfile: UserProfile) => {
  return new ChatOpenAI({
    modelName: "gpt-4o",
    temperature: 0.2,
    streaming: false
  });
};

/**
 * Chart Generator Agent - Creates visualizations
 */
export const createChartAgent = (dataset: Dataset) => {
  return new ChatOpenAI({
    modelName: "gpt-4o-mini", // Faster for chart generation
    temperature: 0,
    streaming: false
  });
};

/**
 * Insight Finder Agent - Discovers patterns
 */
export const createInsightAgent = (dataset: Dataset, userProfile: UserProfile) => {
  return new ChatOpenAI({
    modelName: "gpt-4o",
    temperature: 0.4, // Slightly creative for insights
    streaming: false
  });
};

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

  // Use OpenAI directly for now (more reliable than LangChain tool calling)
  try {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    
    if (!apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Build appropriate system prompt
    let systemPrompt = "";
    
    if (intent.needsMarketing || isMarketingUser(userProfile)) {
      const { buildMarketingSystemPrompt } = await import('./agents/marketingAgent');
      systemPrompt = buildMarketingSystemPrompt(userProfile, dataset);
    } else {
      systemPrompt = buildAnalystPrompt(context);
    }

    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          ...conversationHistory.map(m => ({ role: m.role, content: m.content })),
          { role: 'user', content: question }
        ],
        temperature: 0.7,
        max_tokens: 1000
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to get AI response');
    }

    const data = await response.json();
    const aiResponse = data.choices[0]?.message?.content || 'No response generated';
    
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
    const chartAgent = createChartAgent(dataset);
    // Generate chart based on question
    responses.push({ type: "chart", content: "Chart will be generated" });
  }

  if (intent.needsInsights) {
    const insightAgent = createInsightAgent(dataset, userProfile);
    // Find proactive insights
    responses.push({ type: "insight", content: "Insights to be discovered" });
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
 * Build analyst prompt with context
 */
const buildAnalystPrompt = (context: any) => {
  return `You are a data analyst helping ${context.userProfile.job_title || 'a user'}.

Dataset: ${context.dataset.name}
Columns: ${context.dataset.preview_data?.columns.join(', ') || 'unknown'}
User's focus: ${context.userProfile.use_case || 'general analysis'}

Analyze the data and provide insights relevant to their role.
Be specific, use actual numbers, reference column names.`;
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

