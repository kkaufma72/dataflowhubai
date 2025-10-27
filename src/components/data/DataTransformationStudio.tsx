// Data Transformation Studio - Natural Language Data Editing
// Transform tables with commands like "remove low ROI categories" or "rename headers"

import React, { useState, useEffect, useRef } from 'react';
import { Dataset } from '../../types';
import { 
  Send, 
  Wand2, 
  Undo, 
  Redo, 
  Download, 
  Save, 
  X, 
  Edit3, 
  Trash2, 
  Filter,
  SortAsc,
  Columns,
  Sparkles,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';
import Card from '../common/Card';
import Button from '../common/Button';
import toast from 'react-hot-toast';

interface TransformationStep {
  id: string;
  command: string;
  description: string;
  timestamp: Date;
  changes: {
    type: 'remove_column' | 'rename_column' | 'filter_rows' | 'sort' | 'transform_values';
    details: any;
  };
}

interface DataTransformationStudioProps {
  dataset: Dataset;
  onSave?: (transformedDataset: Dataset) => void;
  onClose?: () => void;
  isModal?: boolean;
}

const DataTransformationStudio: React.FC<DataTransformationStudioProps> = ({
  dataset: initialDataset,
  onSave,
  onClose,
  isModal = true
}) => {
  const [dataset, setDataset] = useState(initialDataset);
  const [command, setCommand] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [transformHistory, setTransformHistory] = useState<TransformationStep[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [editingColumn, setEditingColumn] = useState<string | null>(null);
  const [newColumnName, setNewColumnName] = useState('');
  const commandRef = useRef<HTMLInputElement>(null);

  // Example commands shown to user
  const exampleCommands = [
    "Remove columns with less than 50% non-null values",
    "Filter rows where ROI > 10%",
    "Rename 'cust_id' to 'Customer ID'",
    "Sort by revenue descending",
    "Remove duplicates",
    "Keep only top 10 rows by sales",
    "Remove categories: ['Electronics', 'Books']",
    "Convert dates to YYYY-MM-DD format",
    "Calculate total as price × quantity",
    "Group by category and sum revenue"
  ];

  const handleNaturalLanguageCommand = async (userCommand: string) => {
    if (!userCommand.trim() || isProcessing) return;

    setIsProcessing(true);
    toast.loading('Processing transformation...', { id: 'transform' });

    try {
      // Parse command using OpenAI
      const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
      
      if (!apiKey) {
        throw new Error('OpenAI API key not configured');
      }

      const systemPrompt = `You are a data transformation expert. Parse natural language commands into structured operations.

Available operations:
1. REMOVE_COLUMN: Remove specified columns
2. RENAME_COLUMN: Rename column headers
3. FILTER_ROWS: Filter rows based on conditions
4. SORT: Sort data by column
5. REMOVE_DUPLICATES: Remove duplicate rows
6. TRANSFORM_VALUES: Change cell values
7. CALCULATE: Add calculated column

Dataset context:
Columns: ${dataset.preview_data?.columns.join(', ') || 'unknown'}
Rows: ${dataset.rows || 0}

Parse this command and return JSON:
{
  "operation": "OPERATION_TYPE",
  "parameters": { ... },
  "description": "Human-readable explanation"
}`;

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
            { role: 'user', content: userCommand }
          ],
          temperature: 0.3,
          response_format: { type: "json_object" }
        })
      });

      if (!response.ok) {
        throw new Error('Failed to parse command');
      }

      const data = await response.json();
      const parsedCommand = JSON.parse(data.choices[0]?.message?.content || '{}');

      // Execute the transformation
      const result = await executeTransformation(parsedCommand, dataset);

      if (result.success) {
        // Update dataset
        setDataset(result.dataset);

        // Add to history
        const step: TransformationStep = {
          id: `transform_${Date.now()}`,
          command: userCommand,
          description: parsedCommand.description || 'Transformation applied',
          timestamp: new Date(),
          changes: {
            type: parsedCommand.operation.toLowerCase(),
            details: parsedCommand.parameters
          }
        };

        setTransformHistory(prev => [...prev, step]);
        setHistoryIndex(transformHistory.length);

        toast.success(
          <div>
            <p className="font-semibold">✨ Transformation complete!</p>
            <p className="text-sm">{parsedCommand.description}</p>
          </div>,
          { id: 'transform', duration: 4000 }
        );

        setCommand('');
      } else {
        throw new Error(result.error || 'Transformation failed');
      }

    } catch (error: any) {
      console.error('Transformation error:', error);
      toast.error(error.message || 'Failed to apply transformation', { id: 'transform' });
    } finally {
      setIsProcessing(false);
    }
  };

  const executeTransformation = async (parsedCommand: any, currentDataset: Dataset) => {
    if (!currentDataset.preview_data) {
      return { success: false, error: 'No preview data available' };
    }

    let { columns, rows } = currentDataset.preview_data;
    let transformedDataset = { ...currentDataset };

    try {
      switch (parsedCommand.operation) {
        case 'REMOVE_COLUMN':
          const columnsToRemove = parsedCommand.parameters.columns || [];
          columns = columns.filter(col => !columnsToRemove.includes(col));
          rows = rows.map(row => 
            Array.isArray(row) 
              ? row.filter((_, idx) => !columnsToRemove.includes(currentDataset.preview_data!.columns[idx]))
              : Object.fromEntries(Object.entries(row).filter(([key]) => !columnsToRemove.includes(key)))
          );
          break;

        case 'RENAME_COLUMN':
          const { oldName, newName } = parsedCommand.parameters;
          const colIndex = columns.indexOf(oldName);
          if (colIndex !== -1) {
            columns[colIndex] = newName;
          }
          break;

        case 'FILTER_ROWS':
          const { column, operator, value } = parsedCommand.parameters;
          const filterIdx = columns.indexOf(column);
          
          if (filterIdx !== -1) {
            rows = rows.filter(row => {
              const cellValue = Array.isArray(row) ? row[filterIdx] : row[column];
              
              switch (operator) {
                case '>':
                  return parseFloat(cellValue) > parseFloat(value);
                case '<':
                  return parseFloat(cellValue) < parseFloat(value);
                case '>=':
                  return parseFloat(cellValue) >= parseFloat(value);
                case '<=':
                  return parseFloat(cellValue) <= parseFloat(value);
                case '==':
                  return String(cellValue) === String(value);
                case '!=':
                  return String(cellValue) !== String(value);
                case 'contains':
                  return String(cellValue).toLowerCase().includes(String(value).toLowerCase());
                default:
                  return true;
              }
            });
          }
          break;

        case 'SORT':
          const { column: sortColumn, direction } = parsedCommand.parameters;
          const sortIdx = columns.indexOf(sortColumn);
          
          if (sortIdx !== -1) {
            rows = [...rows].sort((a, b) => {
              const aVal = Array.isArray(a) ? a[sortIdx] : a[sortColumn];
              const bVal = Array.isArray(b) ? b[sortIdx] : b[sortColumn];
              
              const aNum = parseFloat(aVal);
              const bNum = parseFloat(bVal);
              
              if (!isNaN(aNum) && !isNaN(bNum)) {
                return direction === 'desc' ? bNum - aNum : aNum - bNum;
              }
              
              return direction === 'desc' 
                ? String(bVal).localeCompare(String(aVal))
                : String(aVal).localeCompare(String(bVal));
            });
          }
          break;

        case 'REMOVE_DUPLICATES':
          const uniqueRows = Array.from(
            new Set(rows.map(row => JSON.stringify(row)))
          ).map(str => JSON.parse(str));
          rows = uniqueRows;
          break;
      }

      transformedDataset = {
        ...currentDataset,
        preview_data: { columns, rows },
        rows: rows.length,
        columns: columns.length
      };

      return { success: true, dataset: transformedDataset };

    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      // Reapply transformations up to new index
      reapplyTransformations(historyIndex - 1);
    }
  };

  const handleRedo = () => {
    if (historyIndex < transformHistory.length - 1) {
      setHistoryIndex(historyIndex + 1);
      reapplyTransformations(historyIndex + 1);
    }
  };

  const reapplyTransformations = async (upToIndex: number) => {
    let current = initialDataset;
    
    for (let i = 0; i <= upToIndex; i++) {
      const step = transformHistory[i];
      // Re-execute transformation
      // (implementation would replay each step)
    }
    
    setDataset(current);
  };

  const handleManualRename = (oldName: string) => {
    setEditingColumn(oldName);
    setNewColumnName(oldName);
  };

  const saveColumnRename = () => {
    if (!editingColumn || !newColumnName || !dataset.preview_data) return;

    const newDataset = { ...dataset };
    const colIndex = newDataset.preview_data.columns.indexOf(editingColumn);
    
    if (colIndex !== -1) {
      newDataset.preview_data.columns[colIndex] = newColumnName;
      setDataset(newDataset);
      
      // Add to history
      const step: TransformationStep = {
        id: `rename_${Date.now()}`,
        command: `Rename "${editingColumn}" to "${newColumnName}"`,
        description: `Column renamed: ${editingColumn} → ${newColumnName}`,
        timestamp: new Date(),
        changes: {
          type: 'rename_column',
          details: { oldName: editingColumn, newName: newColumnName }
        }
      };
      
      setTransformHistory(prev => [...prev, step]);
      setHistoryIndex(transformHistory.length);
      
      toast.success(`Column renamed to "${newColumnName}"`);
    }

    setEditingColumn(null);
    setNewColumnName('');
  };

  const handleSave = () => {
    if (onSave) {
      onSave(dataset);
      toast.success('Dataset saved!');
    }
  };

  const handleExport = () => {
    if (!dataset.preview_data) return;

    const csv = [
      dataset.preview_data.columns.join(','),
      ...dataset.preview_data.rows.map(row => 
        (Array.isArray(row) ? row : Object.values(row)).join(',')
      )
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${dataset.name}_transformed.csv`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast.success('Dataset exported!');
  };

  const StudioContent = () => (
    <>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-white/20 backdrop-blur rounded-lg flex items-center justify-center">
            <Wand2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Data Transformation Studio</h3>
            <p className="text-sm text-white/80">{dataset.name}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Undo/Redo */}
          <button
            onClick={handleUndo}
            disabled={historyIndex <= 0}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition"
            title="Undo"
          >
            <Undo className="w-4 h-4" />
          </button>
          <button
            onClick={handleRedo}
            disabled={historyIndex >= transformHistory.length - 1}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition"
            title="Redo"
          >
            <Redo className="w-4 h-4" />
          </button>

          {/* Save/Export */}
          <button
            onClick={handleSave}
            className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span className="text-sm">Save</span>
          </button>
          <button
            onClick={handleExport}
            className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span className="text-sm">Export</span>
          </button>

          {onClose && (
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel - Data Table */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Table Stats */}
          <div className="px-4 py-3 bg-gray-50 border-b flex items-center justify-between">
            <div className="flex items-center gap-6 text-sm text-gray-600">
              <span className="flex items-center gap-1">
                <Columns className="w-4 h-4" />
                {dataset.preview_data?.columns.length || 0} columns
              </span>
              <span className="flex items-center gap-1">
                <Filter className="w-4 h-4" />
                {dataset.preview_data?.rows.length || 0} rows
              </span>
              {transformHistory.length > 0 && (
                <span className="flex items-center gap-1 text-indigo-600 font-medium">
                  <Sparkles className="w-4 h-4" />
                  {transformHistory.length} transformations applied
                </span>
              )}
            </div>
          </div>

          {/* Data Table */}
          <div className="flex-1 overflow-auto p-4">
            {dataset.preview_data ? (
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50 sticky top-0 z-10">
                    <tr>
                      {dataset.preview_data.columns.map((col, idx) => (
                        <th
                          key={idx}
                          className="group px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider"
                        >
                          {editingColumn === col ? (
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                value={newColumnName}
                                onChange={(e) => setNewColumnName(e.target.value)}
                                onKeyPress={(e) => {
                                  if (e.key === 'Enter') saveColumnRename();
                                  if (e.key === 'Escape') setEditingColumn(null);
                                }}
                                className="px-2 py-1 border border-indigo-500 rounded text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                autoFocus
                              />
                              <button
                                onClick={saveColumnRename}
                                className="p-1 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                              >
                                <CheckCircle className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => setEditingColumn(null)}
                                className="p-1 bg-gray-400 text-white rounded hover:bg-gray-500"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span>{col}</span>
                              <button
                                onClick={() => handleManualRename(col)}
                                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 rounded transition"
                                title="Rename column"
                              >
                                <Edit3 className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {dataset.preview_data.rows.slice(0, 100).map((row, rowIdx) => (
                      <tr key={rowIdx} className="hover:bg-gray-50">
                        {dataset.preview_data!.columns.map((col, colIdx) => {
                          const value = Array.isArray(row) ? row[colIdx] : row[col];
                          return (
                            <td
                              key={colIdx}
                              className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap"
                            >
                              {String(value)}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                No preview data available
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Commands & History */}
        <div className="w-96 border-l border-gray-200 flex flex-col bg-gray-50">
          {/* Natural Language Command Input */}
          <div className="p-4 border-b border-gray-200 bg-white">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              ✨ Transform with Natural Language
            </label>
            <div className="flex gap-2">
              <input
                ref={commandRef}
                type="text"
                value={command}
                onChange={(e) => setCommand(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') handleNaturalLanguageCommand(command);
                }}
                placeholder="Remove low ROI categories..."
                disabled={isProcessing}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
              />
              <Button
                onClick={() => handleNaturalLanguageCommand(command)}
                disabled={!command.trim() || isProcessing}
                icon={isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                className="px-3"
              />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Type commands in plain English - AI will understand!
            </p>
          </div>

          {/* Example Commands */}
          <div className="p-4 border-b border-gray-200 bg-white">
            <p className="text-sm font-semibold text-gray-700 mb-2">💡 Try these commands:</p>
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {exampleCommands.slice(0, 6).map((example, idx) => (
                <button
                  key={idx}
                  onClick={() => setCommand(example)}
                  className="w-full text-left text-xs px-3 py-2 bg-gray-50 hover:bg-indigo-50 rounded border border-gray-200 hover:border-indigo-300 transition text-gray-700 hover:text-indigo-700"
                >
                  {example}
                </button>
              ))}
            </div>
          </div>

          {/* Transformation History */}
          <div className="flex-1 overflow-y-auto p-4">
            <p className="text-sm font-semibold text-gray-700 mb-3">📜 Transformation History</p>
            
            {transformHistory.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No transformations yet</p>
                <p className="text-xs mt-1">Start with a command above</p>
              </div>
            ) : (
              <div className="space-y-2">
                {transformHistory.map((step, idx) => (
                  <div
                    key={step.id}
                    className={`p-3 rounded-lg border ${
                      idx <= historyIndex
                        ? 'bg-white border-indigo-200'
                        : 'bg-gray-100 border-gray-200 opacity-50'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-1">
                      <div className="flex items-center gap-2">
                        {idx <= historyIndex ? (
                          <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        )}
                        <p className="text-xs font-medium text-gray-900">{step.description}</p>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 ml-6">
                      {step.command}
                    </p>
                    <p className="text-xs text-gray-400 ml-6 mt-1">
                      {step.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="p-4 border-t border-gray-200 bg-white">
            <p className="text-xs font-semibold text-gray-700 mb-2">⚡ Quick Actions:</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleNaturalLanguageCommand("Remove all duplicate rows")}
                className="text-xs px-3 py-2 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition border border-purple-200"
              >
                Remove Duplicates
              </button>
              <button
                onClick={() => handleNaturalLanguageCommand("Remove columns with >30% missing values")}
                className="text-xs px-3 py-2 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition border border-purple-200"
              >
                Clean Missing
              </button>
              <button
                onClick={() => handleNaturalLanguageCommand("Sort by first numeric column descending")}
                className="text-xs px-3 py-2 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition border border-purple-200"
              >
                Auto Sort
              </button>
              <button
                onClick={() => handleNaturalLanguageCommand("Standardize all column names to Title Case")}
                className="text-xs px-3 py-2 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition border border-purple-200"
              >
                Format Headers
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );

  if (isModal) {
    return (
      <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-7xl h-[90vh] flex flex-col overflow-hidden">
          <StudioContent />
        </div>
      </div>
    );
  }

  return (
    <Card className="h-full flex flex-col overflow-hidden">
      <StudioContent />
    </Card>
  );
};

export default DataTransformationStudio;

