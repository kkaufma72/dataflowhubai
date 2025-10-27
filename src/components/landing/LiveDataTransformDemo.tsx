// Live Data Transformation Demo
// Shows natural language transformation in real-time

import React, { useState, useEffect } from 'react';
import { Wand2, Check, RotateCcw } from 'lucide-react';

interface DataRow {
  id: string;
  product: string;
  revenue: number;
  category: string;
  status: 'visible' | 'removing' | 'removed';
}

const INITIAL_DATA: DataRow[] = [
  { id: '1', product: 'Laptop Pro', revenue: 1299, category: 'Electronics', status: 'visible' },
  { id: '2', product: 'Wireless Mouse', revenue: 29, category: 'Accessories', status: 'visible' },
  { id: '3', product: 'Monitor 4K', revenue: 599, category: 'Electronics', status: 'visible' },
  { id: '4', product: 'USB Cable', revenue: 12, category: 'Accessories', status: 'visible' },
  { id: '5', product: 'Keyboard Mech', revenue: 159, category: 'Accessories', status: 'visible' },
  { id: '6', product: 'Webcam HD', revenue: 89, category: 'Electronics', status: 'visible' },
  { id: '7', product: 'Mouse Pad', revenue: 15, category: 'Accessories', status: 'visible' },
  { id: '8', product: 'Headphones', revenue: 249, category: 'Electronics', status: 'visible' },
];

const COMMANDS = [
  {
    text: "Remove items with revenue < $50",
    action: (data: DataRow[]) => data.map(row => 
      row.revenue < 50 ? { ...row, status: 'removing' as const } : row
    ),
    description: "Filtering low-value items..."
  },
  {
    text: "Sort by revenue (highest first)",
    action: (data: DataRow[]) => [...data].sort((a, b) => b.revenue - a.revenue),
    description: "Sorting data..."
  },
  {
    text: "Keep only Electronics category",
    action: (data: DataRow[]) => data.map(row =>
      row.category !== 'Electronics' ? { ...row, status: 'removing' as const } : row
    ),
    description: "Filtering by category..."
  }
];

const LiveDataTransformDemo: React.FC = () => {
  const [data, setData] = useState<DataRow[]>(INITIAL_DATA);
  const [currentCommand, setCurrentCommand] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [commandText, setCommandText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const runDemo = async () => {
    setIsAnimating(true);
    const command = COMMANDS[currentCommand];
    
    // Type out command
    setIsTyping(true);
    for (let i = 0; i <= command.text.length; i++) {
      setCommandText(command.text.slice(0, i));
      await new Promise(resolve => setTimeout(resolve, 30));
    }
    setIsTyping(false);
    
    // Wait a bit
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Apply transformation
    const newData = command.action(data);
    setData(newData);
    
    // Animate removals
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Actually remove
    setData(prev => prev.filter(row => row.status !== 'removing'));
    
    // Reset for next
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsAnimating(false);
    setCommandText('');
    
    // Move to next command
    setTimeout(() => {
      setCurrentCommand((prev) => (prev + 1) % COMMANDS.length);
    }, 1000);
  };

  // Auto-run demo in loop
  useEffect(() => {
    if (!isAnimating) {
      const timer = setTimeout(runDemo, 2000);
      return () => clearTimeout(timer);
    }
  }, [currentCommand, isAnimating]);

  const resetDemo = () => {
    setData(INITIAL_DATA);
    setCurrentCommand(0);
    setCommandText('');
    setIsAnimating(false);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-5 py-3 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wand2 className="w-5 h-5" />
            <span className="font-semibold text-sm">Live Transformation Demo</span>
          </div>
          <button
            onClick={resetDemo}
            className="p-1.5 hover:bg-white/20 rounded transition-colors"
            title="Reset"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Command Input (simulated) */}
      <div className="px-5 py-4 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 font-medium">COMMAND:</span>
          <div className="flex-1 font-mono text-sm text-gray-900">
            {commandText}
            {isTyping && <span className="inline-block w-2 h-4 bg-indigo-600 ml-1 animate-pulse" />}
          </div>
          {!isTyping && commandText && (
            <Check className="w-4 h-4 text-green-500" />
          )}
        </div>
        {commandText && !isTyping && (
          <p className="text-xs text-indigo-600 mt-2">
            {COMMANDS[currentCommand].description}
          </p>
        )}
      </div>

      {/* Data Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Product</th>
              <th className="px-4 py-2 text-right text-xs font-semibold text-gray-600 uppercase">Revenue</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Category</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {data.map((row) => (
              <tr
                key={row.id}
                className={`transition-all duration-500 ${
                  row.status === 'removing'
                    ? 'opacity-0 bg-red-50 scale-95'
                    : row.status === 'removed'
                    ? 'hidden'
                    : 'opacity-100'
                }`}
              >
                <td className="px-4 py-3 text-sm text-gray-900">{row.product}</td>
                <td className="px-4 py-3 text-sm text-right font-mono text-gray-900">
                  ${row.revenue.toLocaleString()}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">{row.category}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer Stats */}
      <div className="px-5 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
        <div className="text-xs text-gray-600">
          <span className="font-semibold">{data.filter(r => r.status === 'visible').length}</span> rows shown
        </div>
        <div className="text-xs text-gray-500">
          Updates in real-time as you command
        </div>
      </div>
    </div>
  );
};

export default LiveDataTransformDemo;

