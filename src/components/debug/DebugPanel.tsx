import React, { useState, useEffect } from 'react';
import { AlertCircle, Activity, X, Trash2, Download } from 'lucide-react';
import { getErrorLogs, clearErrorLogs } from '../../lib/errorHandling';
import { performanceMonitor } from '../../lib/performanceMonitor';

interface DebugPanelProps {
  defaultOpen?: boolean;
}

export const DebugPanel: React.FC<DebugPanelProps> = ({ defaultOpen = false }) => {
  const [show, setShow] = useState(defaultOpen);
  const [tab, setTab] = useState<'errors' | 'performance' | 'memory'>('errors');
  const [errorLogs, setErrorLogs] = useState(getErrorLogs());
  const [memoryInfo, setMemoryInfo] = useState<any>(null);

  // Toggle debug panel with Ctrl+Shift+D
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        e.preventDefault();
        setShow(prev => !prev);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Refresh logs periodically
  useEffect(() => {
    if (!show) return;
    
    const interval = setInterval(() => {
      setErrorLogs(getErrorLogs());
      
      // Update memory info if available
      if ((performance as any).memory) {
        setMemoryInfo((performance as any).memory);
      }
    }, 2000);
    
    return () => clearInterval(interval);
  }, [show]);

  const handleClearErrors = () => {
    clearErrorLogs();
    setErrorLogs([]);
  };

  const handleExportPerf = () => {
    const data = performanceMonitor.export();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `performance-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!show) {
    return (
      <button
        onClick={() => setShow(true)}
        className="fixed bottom-4 right-4 bg-gray-900 text-white p-3 rounded-full shadow-lg hover:bg-gray-800 z-40"
        title="Open Debug Panel (Ctrl+Shift+D)"
      >
        🐛
      </button>
    );
  }

  const perfMetrics = performanceMonitor.getAllMetrics();
  const slowOps = performanceMonitor.getSlowOperations(500);

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-900 text-white max-h-[500px] overflow-hidden z-50 shadow-2xl border-t-4 border-blue-500 flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center p-4 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🐛</span>
          <h2 className="text-lg font-bold">Debug Panel</h2>
          <span className="text-xs bg-gray-700 px-2 py-1 rounded">DEV MODE</span>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={() => setTab('errors')}
            className={`px-3 py-1 rounded text-sm transition-colors ${
              tab === 'errors' ? 'bg-red-600' : 'bg-gray-700 hover:bg-gray-600'
            }`}
          >
            <AlertCircle className="inline w-4 h-4 mr-1" />
            Errors ({errorLogs.length})
          </button>
          <button
            onClick={() => setTab('performance')}
            className={`px-3 py-1 rounded text-sm transition-colors ${
              tab === 'performance' ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'
            }`}
          >
            <Activity className="inline w-4 h-4 mr-1" />
            Performance
          </button>
          {memoryInfo && (
            <button
              onClick={() => setTab('memory')}
              className={`px-3 py-1 rounded text-sm transition-colors ${
                tab === 'memory' ? 'bg-green-600' : 'bg-gray-700 hover:bg-gray-600'
              }`}
            >
              Memory
            </button>
          )}
          <button
            onClick={() => setShow(false)}
            className="px-3 py-1 bg-gray-700 rounded hover:bg-gray-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {tab === 'errors' && (
          <div className="space-y-2">
            {errorLogs.length === 0 ? (
              <div className="text-center text-gray-400 py-8">
                <AlertCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No errors logged</p>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-center mb-4">
                  <p className="text-sm text-gray-400">
                    Showing last {errorLogs.length} errors
                  </p>
                  <button
                    onClick={handleClearErrors}
                    className="text-xs bg-red-600 hover:bg-red-700 px-3 py-1 rounded flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" />
                    Clear All
                  </button>
                </div>
                {errorLogs.map((log) => (
                  <div key={log.id} className="bg-red-900/30 p-3 rounded text-sm border border-red-700/50">
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-mono text-xs text-red-300">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </span>
                      {log.error.code && (
                        <span className="text-xs bg-red-700 px-2 py-0.5 rounded">
                          {log.error.code}
                        </span>
                      )}
                    </div>
                    <div className="text-red-100 font-medium mb-1">{log.error.message}</div>
                    {log.url && (
                      <div className="text-gray-400 text-xs truncate">{log.url}</div>
                    )}
                    {log.stack && (
                      <details className="mt-2">
                        <summary className="cursor-pointer text-xs text-gray-400 hover:text-gray-300">
                          Stack trace
                        </summary>
                        <pre className="text-xs bg-gray-950 p-2 rounded mt-1 overflow-x-auto">
                          {log.stack}
                        </pre>
                      </details>
                    )}
                  </div>
                ))}
              </>
            )}
          </div>
        )}

        {tab === 'performance' && (
          <div className="space-y-4">
            {slowOps.length > 0 && (
              <div className="bg-yellow-900/30 p-3 rounded border border-yellow-700/50">
                <h3 className="text-yellow-300 font-bold mb-2 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  Slow Operations (&gt;500ms)
                </h3>
                <div className="space-y-1">
                  {slowOps.map((op) => (
                    <div key={op.label} className="text-sm flex justify-between">
                      <span className="text-yellow-100">{op.label}</span>
                      <span className="font-mono text-yellow-300">
                        Avg: {op.avg.toFixed(2)}ms | Max: {op.max.toFixed(2)}ms
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-between items-center mb-2">
              <h3 className="text-blue-300 font-bold">All Performance Metrics</h3>
              <button
                onClick={handleExportPerf}
                className="text-xs bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded flex items-center gap-1"
              >
                <Download className="w-3 h-3" />
                Export JSON
              </button>
            </div>

            {Object.keys(perfMetrics).length === 0 ? (
              <div className="text-center text-gray-400 py-8">
                <Activity className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No performance data yet</p>
                <p className="text-xs mt-1">Navigate around the app to collect metrics</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-2">
                {Object.entries(perfMetrics).map(([label, metrics]) => {
                  if (!metrics) return null;
                  
                  const isGood = metrics.avg < 100;
                  const isOk = metrics.avg < 500;
                  const bgColor = isGood ? 'bg-green-900/30' : isOk ? 'bg-yellow-900/30' : 'bg-red-900/30';
                  const borderColor = isGood ? 'border-green-700/50' : isOk ? 'border-yellow-700/50' : 'border-red-700/50';
                  
                  return (
                    <div key={label} className={`p-3 rounded text-sm border ${bgColor} ${borderColor}`}>
                      <div className="font-bold text-blue-300 mb-2">{label}</div>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs font-mono">
                        <div>
                          <span className="text-gray-400">Avg:</span>
                          <span className="ml-1 text-white">{metrics.avg.toFixed(2)}ms</span>
                        </div>
                        <div>
                          <span className="text-gray-400">Min:</span>
                          <span className="ml-1 text-white">{metrics.min.toFixed(2)}ms</span>
                        </div>
                        <div>
                          <span className="text-gray-400">Max:</span>
                          <span className="ml-1 text-white">{metrics.max.toFixed(2)}ms</span>
                        </div>
                        <div>
                          <span className="text-gray-400">P95:</span>
                          <span className="ml-1 text-white">{metrics.p95.toFixed(2)}ms</span>
                        </div>
                        <div>
                          <span className="text-gray-400">Count:</span>
                          <span className="ml-1 text-white">{metrics.count}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {tab === 'memory' && memoryInfo && (
          <div className="space-y-4">
            <div className="bg-green-900/30 p-4 rounded border border-green-700/50">
              <h3 className="text-green-300 font-bold mb-3">Memory Usage</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-300">Heap Size Limit:</span>
                  <span className="font-mono text-white">
                    {(memoryInfo.jsHeapSizeLimit / 1024 / 1024).toFixed(2)} MB
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-300">Total Heap Size:</span>
                  <span className="font-mono text-white">
                    {(memoryInfo.totalJSHeapSize / 1024 / 1024).toFixed(2)} MB
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-300">Used Heap Size:</span>
                  <span className="font-mono text-white">
                    {(memoryInfo.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB
                  </span>
                </div>
                <div className="mt-3">
                  <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-green-500 to-green-600"
                      style={{
                        width: `${(memoryInfo.usedJSHeapSize / memoryInfo.jsHeapSizeLimit) * 100}%`
                      }}
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    {((memoryInfo.usedJSHeapSize / memoryInfo.jsHeapSizeLimit) * 100).toFixed(1)}% of limit
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-gray-700 px-4 py-2 text-xs text-gray-400 flex justify-between items-center">
        <span>Press Ctrl+Shift+D to toggle</span>
        <span>Console: window.__performanceMonitor.logMetrics()</span>
      </div>
    </div>
  );
};
