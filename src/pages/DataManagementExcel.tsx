/**
 * Excel-Style Data Management
 * 
 * Tabbed interface like Excel - each dataset is a "sheet"
 * Professional spreadsheet view with project selector
 */

import React, { useState, useMemo } from 'react';
import { useMLContext } from '../context/MLContext';
import { Dataset } from '../types';
import { 
  Database, 
  Upload, 
  X,
  ChevronDown,
  Plus,
  Download,
  Filter,
  Search
} from 'lucide-react';
import { useAuth } from '../components/auth/AuthProvider';
import toast from 'react-hot-toast';
import DataUploader from '../components/data/DataUploader';

const DataManagementExcel: React.FC = () => {
  const { datasets, currentProject, projects } = useMLContext();
  const { user } = useAuth();
  
  const [activeDatasetId, setActiveDatasetId] = useState<string | null>(
    datasets.length > 0 ? datasets[0].id : null
  );
  const [showUploader, setShowUploader] = useState(false);
  const [searchColumn, setSearchColumn] = useState('');

  const activeDataset = useMemo(() => 
    datasets.find(d => d.id === activeDatasetId),
    [datasets, activeDatasetId]
  );

  return (
    <div className="h-screen flex flex-col bg-[#0A0A0A]">
      {/* Excel-Style Top Bar */}
      <div className="bg-[#1A1A1A] border-b border-gray-800 px-4 py-2">
        <div className="flex items-center justify-between">
          {/* Left: Project Selector + Title */}
          <div className="flex items-center gap-4">
            {/* Project Dropdown */}
            <div className="relative">
              <select
                value={currentProject?.id || ''}
                className="appearance-none bg-[#0A0A0A] border border-gray-700 text-white pl-3 pr-8 py-1.5 rounded text-sm focus:border-gray-600 focus:outline-none cursor-pointer"
              >
                <option value={currentProject?.id}>
                  {currentProject?.name || 'Select Project'}
                </option>
                {projects?.filter(p => p.id !== currentProject?.id).map(project => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>

            {/* Separator */}
            <div className="w-px h-6 bg-gray-700"></div>

            {/* Active Dataset Name */}
            <div className="text-white font-semibold">
              {activeDataset?.name || 'No Dataset Selected'}
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowUploader(true)}
              className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded text-sm font-medium transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              New Sheet
            </button>
            <button className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded transition-colors">
              <Download className="w-4 h-4" />
            </button>
            <button className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded transition-colors">
              <Filter className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Excel-Style Spreadsheet Area */}
      <div className="flex-1 overflow-auto bg-[#0A0A0A]">
        {activeDataset && activeDataset.preview_data ? (
          <div className="h-full">
            {/* Column Headers with Search */}
            <div className="sticky top-0 z-10 bg-[#1A1A1A] border-b-2 border-gray-700">
              <div className="flex">
                {/* Row number column header */}
                <div className="w-12 bg-[#0A0A0A] border-r border-gray-700 flex items-center justify-center py-2">
                  <span className="text-xs font-bold text-gray-500">#</span>
                </div>
                
                {/* Data column headers */}
                {activeDataset.preview_data.columns?.map((col: string, idx: number) => (
                  <div
                    key={idx}
                    className="min-w-[150px] max-w-[200px] border-r border-gray-700 bg-[#0A0A0A]"
                  >
                    <div className="px-3 py-2">
                      <div className="text-xs font-bold text-cyan-400 uppercase mb-1">
                        {col}
                      </div>
                      <input
                        type="text"
                        placeholder="Filter..."
                        className="w-full bg-transparent border-b border-gray-800 text-xs text-gray-400 focus:border-cyan-500 focus:outline-none"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Spreadsheet Rows */}
            <div className="overflow-auto">
              {activeDataset.preview_data.rows?.map((row: any, rowIdx: number) => (
                <div
                  key={rowIdx}
                  className="flex hover:bg-gray-900/50 border-b border-gray-800 group"
                >
                  {/* Row number */}
                  <div className="w-12 bg-[#1A1A1A] border-r border-gray-700 flex items-center justify-center py-2 sticky left-0 z-5">
                    <span className="text-xs font-mono text-gray-500">{rowIdx + 1}</span>
                  </div>
                  
                  {/* Data cells */}
                  {(Array.isArray(row) ? row : Object.values(row)).map((cell: any, cellIdx: number) => (
                    <div
                      key={cellIdx}
                      className="min-w-[150px] max-w-[200px] border-r border-gray-700 px-3 py-2"
                    >
                      <div className="text-sm text-white font-mono truncate">
                        {String(cell)}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Database className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">
                No Dataset Selected
              </h3>
              <p className="text-gray-400 mb-6">
                Click a sheet tab below to view data
              </p>
              <button
                onClick={() => setShowUploader(true)}
                className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded font-medium"
              >
                Upload First Dataset
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Excel-Style Sheet Tabs at Bottom */}
      <div className="bg-[#1A1A1A] border-t border-gray-700 px-2 py-1 flex items-center gap-1 overflow-x-auto">
        {datasets.map((dataset) => (
          <button
            key={dataset.id}
            onClick={() => setActiveDatasetId(dataset.id)}
            className={`
              group relative px-4 py-2 rounded-t transition-all flex items-center gap-2 flex-shrink-0
              ${activeDatasetId === dataset.id
                ? 'bg-[#0A0A0A] text-white border-t-2 border-cyan-500'
                : 'bg-[#1A1A1A] text-gray-400 hover:text-white hover:bg-gray-800'
              }
            `}
          >
            <Database className="w-3 h-3" />
            <span className="text-sm font-medium">
              {dataset.name}
            </span>
            <span className="text-xs text-gray-500">
              ({dataset.row_count?.toLocaleString()})
            </span>
            
            {/* Close button on hover */}
            {activeDatasetId !== dataset.id && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm(`Remove ${dataset.name} sheet?`)) {
                    // Handle delete
                    toast.success('Sheet removed');
                  }
                }}
                className="opacity-0 group-hover:opacity-100 ml-1 p-0.5 hover:bg-red-500/20 rounded transition-opacity"
              >
                <X className="w-3 h-3 text-red-400" />
              </button>
            )}
          </button>
        ))}

        {/* Add New Sheet Button */}
        <button
          onClick={() => setShowUploader(true)}
          className="px-3 py-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-t transition-colors flex items-center gap-1 flex-shrink-0"
        >
          <Plus className="w-3 h-3" />
          <span className="text-sm">New Sheet</span>
        </button>
      </div>

      {/* Upload Modal */}
      {showUploader && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#1A1A1A] border border-gray-800 rounded-xl shadow-2xl max-w-2xl w-full">
            <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">
                Upload New Sheet
              </h2>
              <button onClick={() => setShowUploader(false)}>
                <X className="w-5 h-5 text-gray-400 hover:text-white" />
              </button>
            </div>
            <div className="p-6">
              <DataUploader
                onClose={() => {
                  setShowUploader(false);
                  window.location.reload();
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataManagementExcel;

