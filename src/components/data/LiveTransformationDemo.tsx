// Live Transformation Component - Actually Working Version
// Real-time data transformation with natural language commands

import React, { useState, useRef } from 'react';
import { Play, RotateCw, Plus, Check, Loader2, Activity, Sparkles, Send } from 'lucide-react';
import toast from 'react-hot-toast';

interface DataRow {
  [key: string]: string | number;
}

interface TransformCommand {
  operation: string;
  parameters: any;
  description: string;
}

interface LiveTransformationDemoProps {
  initialData?: {
    columns: string[];
    rows: any[][];
  };
  onDataChange?: (data: { columns: string[]; rows: any[][] }) => void;
}

const SAMPLE_DATA = {
  columns: ['Product', 'Revenue', 'Category', 'Region', 'Status'],
  rows: [
    ['Laptop Pro', 1299, 'Electronics', 'West', 'Active'],
    ['Wireless Mouse', 29, 'Accessories', 'East', 'Active'],
    ['Monitor 4K', 599, 'Electronics', 'North', 'Active'],
    ['USB Cable', 12, 'Accessories', 'South', 'Active'],
    ['Keyboard Mech', 159, 'Accessories', 'West', 'Active'],
    ['Webcam HD', 89, 'Electronics', 'East', 'Active'],
    ['Mouse Pad', 15, 'Accessories', 'North', 'Discontinued'],
    ['Headphones', 249, 'Electronics', 'South', 'Active'],
  ]
};

const EXAMPLE_COMMANDS = [
  "Sort by revenue (highest first)",
  "Remove items where revenue < $50",
  "Filter by Electronics category",
  "Remove Discontinued status",
  "Rename 'Product' to 'Item Name'",
  "Keep only top 5 items",
];

const LiveTransformationDemo: React.FC<LiveTransformationDemoProps> = ({ 
  initialData = SAMPLE_DATA,
  onDataChange 
}) => {
  const [columns, setColumns] = useState(initialData.columns);
  const [rows, setRows] = useState(initialData.rows);
  const [command, setCommand] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const [removingRows, setRemovingRows] = useState<Set<number>>(new Set());
  const inputRef = useRef<HTMLInputElement>(null);

  // Parse natural language command
  const parseCommand = (cmd: string): TransformCommand | null => {
    const lower = cmd.toLowerCase().trim();

    // SORT operation
    if (lower.includes('sort')) {
      const column = columns.find(col => lower.includes(col.toLowerCase()));
      const descending = lower.includes('highest') || lower.includes('descending') || lower.includes('desc');
      
      return {
        operation: 'SORT',
        parameters: { column, descending },
        description: `Sorted by ${column} ${descending ? 'descending' : 'ascending'}`
      };
    }

    // FILTER by value operation
    if (lower.includes('remove') && (lower.includes('<') || lower.includes('less than'))) {
      const match = lower.match(/(\d+)/);
      const value = match ? parseInt(match[1]) : 0;
      const column = columns.find(col => lower.includes(col.toLowerCase()));
      
      return {
        operation: 'FILTER_LESS_THAN',
        parameters: { column, value },
        description: `Removed rows where ${column} < ${value}`
      };
    }

    // FILTER by category/value operation
    if ((lower.includes('filter') || lower.includes('keep only')) && lower.includes('by')) {
      const column = columns.find(col => lower.includes(col.toLowerCase()));
      // Extract value after "by" or category name
      const words = lower.split(/by|where/);
      const valueWord = words[1]?.trim().split(/\s+/)[0];
      const value = columns.includes(valueWord.charAt(0).toUpperCase() + valueWord.slice(1)) 
        ? valueWord.charAt(0).toUpperCase() + valueWord.slice(1)
        : valueWord;
      
      return {
        operation: 'FILTER_EQUALS',
        parameters: { column, value },
        description: `Filtered to show only ${column} = ${value}`
      };
    }

    // REMOVE by status/value
    if (lower.includes('remove') && !lower.includes('<')) {
      const value = lower.split('remove')[1]?.trim().split(/\s+/)[0];
      const capitalizedValue = value ? value.charAt(0).toUpperCase() + value.slice(1) : '';
      const column = columns.find(col => 
        rows.some(row => row.includes(capitalizedValue))
      );
      
      return {
        operation: 'REMOVE_VALUE',
        parameters: { value: capitalizedValue, column },
        description: `Removed rows with ${capitalizedValue}`
      };
    }

    // RENAME column
    if (lower.includes('rename')) {
      const fromMatch = lower.match(/'([^']+)'|"([^"]+)"|(\w+)/);
      const toMatch = lower.match(/to ['"]?([^'"]+)['"]?$/);
      
      const from = fromMatch ? (fromMatch[1] || fromMatch[2] || fromMatch[3]) : '';
      const to = toMatch ? toMatch[1].trim() : '';
      
      return {
        operation: 'RENAME',
        parameters: { from, to },
        description: `Renamed '${from}' to '${to}'`
      };
    }

    // KEEP TOP N
    if (lower.includes('top') || lower.includes('first')) {
      const match = lower.match(/(\d+)/);
      const count = match ? parseInt(match[1]) : 5;
      
      return {
        operation: 'KEEP_TOP',
        parameters: { count },
        description: `Kept top ${count} rows`
      };
    }

    return null;
  };

  // Execute transformation
  const executeTransform = async (parsedCmd: TransformCommand) => {
    let newColumns = [...columns];
    let newRows = [...rows];

    switch (parsedCmd.operation) {
      case 'SORT':
        const { column: sortCol, descending } = parsedCmd.parameters;
        const colIndex = newColumns.findIndex(c => c.toLowerCase() === sortCol?.toLowerCase());
        
        if (colIndex !== -1) {
          newRows = newRows.sort((a, b) => {
            const aVal = typeof a[colIndex] === 'number' ? a[colIndex] : String(a[colIndex]);
            const bVal = typeof b[colIndex] === 'number' ? b[colIndex] : String(b[colIndex]);
            
            if (typeof aVal === 'number' && typeof bVal === 'number') {
              return descending ? bVal - aVal : aVal - bVal;
            }
            return descending 
              ? String(bVal).localeCompare(String(aVal))
              : String(aVal).localeCompare(String(bVal));
          });
        }
        break;

      case 'FILTER_LESS_THAN':
        const { column: filterCol, value: filterVal } = parsedCmd.parameters;
        const filterIndex = newColumns.findIndex(c => c.toLowerCase() === filterCol?.toLowerCase());
        
        if (filterIndex !== -1) {
          // Mark rows for removal with animation
          const rowsToRemove = new Set<number>();
          newRows.forEach((row, idx) => {
            const cellValue = typeof row[filterIndex] === 'number' 
              ? row[filterIndex] 
              : parseFloat(String(row[filterIndex]).replace(/[^0-9.]/g, ''));
            
            if (cellValue < filterVal) {
              rowsToRemove.add(idx);
            }
          });
          
          setRemovingRows(rowsToRemove);
          await new Promise(resolve => setTimeout(resolve, 600));
          
          newRows = newRows.filter((row, idx) => !rowsToRemove.has(idx));
          setRemovingRows(new Set());
        }
        break;

      case 'FILTER_EQUALS':
        const { column: eqCol, value: eqVal } = parsedCmd.parameters;
        const eqIndex = newColumns.findIndex(c => c.toLowerCase() === eqCol?.toLowerCase());
        
        if (eqIndex !== -1) {
          const rowsToRemove = new Set<number>();
          newRows.forEach((row, idx) => {
            if (String(row[eqIndex]).toLowerCase() !== String(eqVal).toLowerCase()) {
              rowsToRemove.add(idx);
            }
          });
          
          setRemovingRows(rowsToRemove);
          await new Promise(resolve => setTimeout(resolve, 600));
          
          newRows = newRows.filter((row, idx) => !rowsToRemove.has(idx));
          setRemovingRows(new Set());
        }
        break;

      case 'REMOVE_VALUE':
        const { value: removeVal } = parsedCmd.parameters;
        const rowsToRemove = new Set<number>();
        
        newRows.forEach((row, idx) => {
          if (row.some(cell => String(cell).toLowerCase() === String(removeVal).toLowerCase())) {
            rowsToRemove.add(idx);
          }
        });
        
        setRemovingRows(rowsToRemove);
        await new Promise(resolve => setTimeout(resolve, 600));
        
        newRows = newRows.filter((row, idx) => !rowsToRemove.has(idx));
        setRemovingRows(new Set());
        break;

      case 'RENAME':
        const { from, to } = parsedCmd.parameters;
        const renameIndex = newColumns.findIndex(c => c.toLowerCase() === from.toLowerCase());
        
        if (renameIndex !== -1) {
          newColumns[renameIndex] = to;
        }
        break;

      case 'KEEP_TOP':
        const { count } = parsedCmd.parameters;
        if (newRows.length > count) {
          const rowsToRemove = new Set<number>();
          for (let i = count; i < newRows.length; i++) {
            rowsToRemove.add(i);
          }
          
          setRemovingRows(rowsToRemove);
          await new Promise(resolve => setTimeout(resolve, 600));
          
          newRows = newRows.slice(0, count);
          setRemovingRows(new Set());
        }
        break;
    }

    return { columns: newColumns, rows: newRows };
  };

  // Handle command submission
  const handleSubmit = async () => {
    if (!command.trim() || isProcessing) return;

    setIsProcessing(true);

    try {
      const parsedCmd = parseCommand(command);

      if (!parsedCmd) {
        toast.error('Could not understand that command. Try one of the examples!');
        setIsProcessing(false);
        return;
      }

      // Execute transformation
      const result = await executeTransform(parsedCmd);

      // Update state
      setColumns(result.columns);
      setRows(result.rows);
      setHistory(prev => [...prev, `${command} → ${parsedCmd.description}`]);
      
      // Notify parent
      if (onDataChange) {
        onDataChange(result);
      }

      toast.success(
        <div>
          <p className="font-semibold">✨ Transformation complete!</p>
          <p className="text-sm">{parsedCmd.description}</p>
        </div>,
        { duration: 3000 }
      );

      setCommand('');
      inputRef.current?.focus();
    } catch (error: any) {
      console.error('Transform error:', error);
      toast.error('Failed to apply transformation');
    } finally {
      setIsProcessing(false);
    }
  };

  // Reset to initial state
  const handleReset = () => {
    setColumns(initialData.columns);
    setRows(initialData.rows);
    setCommand('');
    setHistory([]);
    setRemovingRows(new Set());
    toast.success('Reset to original data');
  };

  return (
    <div className="bg-white rounded-xl border-2 border-gray-200 shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-4 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Activity className="w-6 h-6" />
            <div>
              <h3 className="font-bold text-lg">Live Transformation Demo</h3>
              <p className="text-sm text-purple-100">Transform data with natural language</p>
            </div>
          </div>
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-all"
            title="Reset to original data"
          >
            <RotateCw className="w-4 h-4" />
            <span className="text-sm font-medium">Reset</span>
          </button>
        </div>
      </div>

      {/* Command Input */}
      <div className="px-6 py-4 bg-gradient-to-br from-gray-50 to-purple-50 border-b border-gray-200">
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2">
              <Sparkles className="w-5 h-5 text-purple-500" />
            </div>
            <input
              ref={inputRef}
              type="text"
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
              placeholder="Sort by revenue (highest first)"
              disabled={isProcessing}
              className="w-full pl-11 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm font-mono disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
          </div>
          <button
            onClick={handleSubmit}
            disabled={!command.trim() || isProcessing}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all flex items-center gap-2 shadow-md hover:shadow-lg"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                <span>Transform</span>
              </>
            )}
          </button>
        </div>

        {/* Example Commands */}
        <div className="mt-3 flex flex-wrap gap-2">
          <span className="text-xs font-semibold text-gray-600">Try:</span>
          {EXAMPLE_COMMANDS.slice(0, 3).map((example, idx) => (
            <button
              key={idx}
              onClick={() => setCommand(example)}
              className="text-xs px-3 py-1.5 bg-white border border-purple-200 text-purple-700 rounded-full hover:bg-purple-50 hover:border-purple-300 transition-all"
            >
              {example}
            </button>
          ))}
        </div>
      </div>

      {/* Data Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-100 border-b-2 border-gray-300">
            <tr>
              {columns.map((col, idx) => (
                <th
                  key={idx}
                  className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {rows.map((row, rowIdx) => (
              <tr
                key={rowIdx}
                className={`transition-all duration-500 ${
                  removingRows.has(rowIdx)
                    ? 'opacity-0 scale-95 bg-red-50'
                    : 'opacity-100 scale-100 hover:bg-gray-50'
                }`}
              >
                {row.map((cell, cellIdx) => (
                  <td
                    key={cellIdx}
                    className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap"
                  >
                    {typeof cell === 'number' && cellIdx === 1
                      ? `$${cell.toLocaleString()}`
                      : String(cell)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer Stats & History */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-4">
            <div className="text-sm">
              <span className="font-bold text-gray-900">{rows.length}</span>
              <span className="text-gray-600"> rows</span>
            </div>
            <div className="text-sm">
              <span className="font-bold text-gray-900">{columns.length}</span>
              <span className="text-gray-600"> columns</span>
            </div>
            <div className="text-xs text-gray-500">
              Updates in real-time as you command
            </div>
          </div>
          <div className="flex items-center gap-3">
            {history.length > 0 && (
              <div className="text-xs text-purple-600 font-medium">
                {history.length} transformation{history.length !== 1 ? 's' : ''} applied
              </div>
            )}
            {onDataChange && history.length > 0 && (
              <button
                onClick={() => onDataChange({ columns, rows })}
                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-sm font-semibold rounded-lg shadow-md hover:shadow-lg transition-all flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                Save Changes
              </button>
            )}
          </div>
        </div>

        {/* History */}
        {history.length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <p className="text-xs font-semibold text-gray-700 mb-2">📜 History:</p>
            <div className="space-y-1">
              {history.slice(-3).map((item, idx) => (
                <div key={idx} className="flex items-start gap-2 text-xs text-gray-600">
                  <Check className="w-3 h-3 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LiveTransformationDemo;
