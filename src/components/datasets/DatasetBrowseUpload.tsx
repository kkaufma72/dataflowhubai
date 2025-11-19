import React, { useState, useEffect, useMemo } from 'react';
import { useMLContext } from '../../context/MLContext';
import { useSidebarState } from '../../hooks/useSidebarState';
import ProjectSidebar from './ProjectSidebar';
import DataUploader from '../data/DataUploader';
import DatasetCard from '../data/DatasetCard';
import { 
  ChevronLeft, 
  ChevronRight, 
  Upload, 
  Search, 
  Filter,
  Grid3x3,
  List,
  Database,
  FolderOpen,
  Plus
} from 'lucide-react';
import { Dataset, Project } from '../../types';
import Button from '../common/Button';
import toast from 'react-hot-toast';

/**
 * Professional dataset browse and upload page with collapsible sidebar
 * Displays project hierarchy and allows seamless dataset management
 */
const DatasetBrowseUpload: React.FC = () => {
  const { datasets } = useMLContext();
  const {
    isCollapsed,
    selectedProjectIds,
    lastViewedDatasetId,
    isLoaded,
    toggleSidebar,
    toggleProjectId,
    updateLastViewedDataset,
  } = useSidebarState();

  // Local state
  const [selectedDataset, setSelectedDataset] = useState<Dataset | null>(null);
  const [showUploader, setShowUploader] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'size'>('date');
  const [showFilters, setShowFilters] = useState(false);

  // Mock projects (in production, this would come from API/context)
  const [projects] = useState<Project[]>([
    {
      id: 'default-project',
      name: 'Default Project',
      description: 'Default project for all datasets',
      createdAt: new Date().toISOString(),
    },
  ]);

  // Check if user has cloud-native project IDs
  const hasCloudProjects = useMemo(() => {
    return selectedProjectIds.length > 0 || projects.length > 0;
  }, [selectedProjectIds, projects]);

  // Filter datasets based on search and selected projects
  const filteredDatasets = useMemo(() => {
    let result = [...datasets];

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(ds =>
        ds.name.toLowerCase().includes(query) ||
        ds.description?.toLowerCase().includes(query) ||
        ds.fileType?.toLowerCase().includes(query)
      );
    }

    // Filter by selected projects (if any selected)
    if (selectedProjectIds.length > 0) {
      result = result.filter(ds => selectedProjectIds.includes(ds.projectId));
    }

    // Sort datasets
    result.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'size':
          return parseFloat(b.fileSize) - parseFloat(a.fileSize);
        case 'date':
        default:
          return new Date(b.dateUploaded).getTime() - new Date(a.dateUploaded).getTime();
      }
    });

    return result;
  }, [datasets, searchQuery, selectedProjectIds, sortBy]);

  // Restore last viewed dataset on mount
  useEffect(() => {
    if (isLoaded && lastViewedDatasetId && datasets.length > 0) {
      const dataset = datasets.find(ds => ds.id === lastViewedDatasetId);
      if (dataset) {
        setSelectedDataset(dataset);
      }
    }
  }, [isLoaded, lastViewedDatasetId, datasets]);

  // Update last viewed dataset when selection changes
  useEffect(() => {
    if (selectedDataset) {
      updateLastViewedDataset(selectedDataset.id);
    }
  }, [selectedDataset, updateLastViewedDataset]);

  // Handle dataset selection
  const handleSelectDataset = (dataset: Dataset) => {
    setSelectedDataset(dataset);
  };

  // Dataset card action handlers (pass-through functions)
  const handlePreview = (dataset: Dataset) => {
    setSelectedDataset(dataset);
    toast.success(`Previewing ${dataset.name}`);
  };

  const handleAnalyze = (dataset: Dataset) => {
    setSelectedDataset(dataset);
    toast.success(`Analyzing ${dataset.name}`);
  };

  const handleQualityCheck = (dataset: Dataset) => {
    setSelectedDataset(dataset);
    toast.success(`Checking quality of ${dataset.name}`);
  };

  const handleChat = (dataset: Dataset) => {
    setSelectedDataset(dataset);
    toast.success(`Opening chat for ${dataset.name}`);
  };

  const handleDelete = (dataset: Dataset) => {
    if (confirm(`Are you sure you want to delete ${dataset.name}?`)) {
      toast.success(`Deleted ${dataset.name}`);
    }
  };

  const handleArchive = (dataset: Dataset) => {
    toast.success(`Archived ${dataset.name}`);
  };

  const handleMove = (dataset: Dataset) => {
    toast.success(`Moving ${dataset.name}`);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Collapsible Sidebar */}
      {!isCollapsed && hasCloudProjects && (
        <div className="w-80 flex-shrink-0 shadow-lg">
          <ProjectSidebar
            projects={projects}
            datasets={datasets}
            selectedProjectIds={selectedProjectIds}
            onToggleProject={toggleProjectId}
            onSelectDataset={handleSelectDataset}
            selectedDatasetId={selectedDataset?.id}
          />
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Navigation Bar */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Left: Sidebar Toggle + Title */}
            <div className="flex items-center gap-4">
              {hasCloudProjects && (
                <button
                  onClick={toggleSidebar}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                >
                  {isCollapsed ? (
                    <ChevronRight className="w-5 h-5 text-gray-600" />
                  ) : (
                    <ChevronLeft className="w-5 h-5 text-gray-600" />
                  )}
                </button>
              )}
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Datasets</h1>
                <p className="text-sm text-gray-500 mt-0.5">
                  {filteredDatasets.length} {filteredDatasets.length === 1 ? 'dataset' : 'datasets'}
                  {selectedProjectIds.length > 0 && ' in selected projects'}
                </p>
              </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-3">
              <Button
                onClick={() => setShowUploader(true)}
                variant="primary"
                className="flex items-center gap-2"
              >
                <Upload className="w-4 h-4" />
                Upload Dataset
              </Button>
            </div>
          </div>

          {/* Search and Filters Row */}
          <div className="mt-4 flex items-center gap-3">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search datasets by name, description, or file type..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded ${
                  viewMode === 'grid'
                    ? 'bg-white shadow-sm'
                    : 'hover:bg-gray-200'
                }`}
                title="Grid view"
              >
                <Grid3x3 className="w-4 h-4 text-gray-600" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded ${
                  viewMode === 'list'
                    ? 'bg-white shadow-sm'
                    : 'hover:bg-gray-200'
                }`}
                title="List view"
              >
                <List className="w-4 h-4 text-gray-600" />
              </button>
            </div>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="date">Sort by Date</option>
              <option value="name">Sort by Name</option>
              <option value="size">Sort by Size</option>
            </select>

            {/* Filters Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              title="Filters"
            >
              <Filter className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* No Cloud Projects Message */}
          {!hasCloudProjects && (
            <div className="max-w-2xl mx-auto text-center py-12">
              <FolderOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                No Cloud Projects Connected
              </h2>
              <p className="text-gray-600 mb-6">
                Connect your cloud-native platform to organize datasets in projects.
                You can still browse and upload datasets below.
              </p>
              <Button variant="primary" className="flex items-center gap-2 mx-auto">
                <Plus className="w-4 h-4" />
                Connect Cloud Platform
              </Button>
            </div>
          )}

          {/* Empty State */}
          {filteredDatasets.length === 0 ? (
            <div className="max-w-2xl mx-auto text-center py-12">
              <Database className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                {searchQuery ? 'No datasets found' : 'No datasets yet'}
              </h2>
              <p className="text-gray-600 mb-6">
                {searchQuery 
                  ? 'Try adjusting your search or filters'
                  : 'Upload your first dataset to get started with data analysis and model training'
                }
              </p>
              {!searchQuery && (
                <Button
                  onClick={() => setShowUploader(true)}
                  variant="primary"
                  className="flex items-center gap-2 mx-auto"
                >
                  <Upload className="w-4 h-4" />
                  Upload Dataset
                </Button>
              )}
            </div>
          ) : (
            <>
              {/* Grid View */}
              {viewMode === 'grid' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredDatasets.map(dataset => (
                    <div 
                      key={dataset.id}
                      onClick={() => handleSelectDataset(dataset)}
                      className={`cursor-pointer transition-all ${
                        dataset.id === selectedDataset?.id ? 'ring-2 ring-blue-500 rounded-lg' : ''
                      }`}
                    >
                      <DatasetCard
                        dataset={dataset}
                        onPreview={handlePreview}
                        onAnalyze={handleAnalyze}
                        onQualityCheck={handleQualityCheck}
                        onChat={handleChat}
                        onDelete={handleDelete}
                        onArchive={handleArchive}
                        onMove={handleMove}
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* List View */}
              {viewMode === 'list' && (
                <div className="space-y-2">
                  {filteredDatasets.map(dataset => (
                    <button
                      key={dataset.id}
                      onClick={() => handleSelectDataset(dataset)}
                      className={`w-full p-4 flex items-center gap-4 rounded-lg border-2 transition-all ${
                        dataset.id === selectedDataset?.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <Database className="w-8 h-8 text-gray-400 flex-shrink-0" />
                      <div className="flex-1 text-left">
                        <h3 className="font-medium text-gray-900">{dataset.name}</h3>
                        <p className="text-sm text-gray-500 mt-1">
                          {dataset.rows.toLocaleString()} rows • {dataset.columns} columns • {dataset.fileSize}
                        </p>
                      </div>
                      <div className="text-right text-sm text-gray-500">
                        <p>{new Date(dataset.dateUploaded).toLocaleDateString()}</p>
                        <p className="mt-1">{dataset.fileType}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Upload Modal */}
      {showUploader && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Upload Dataset</h2>
                <button
                  onClick={() => setShowUploader(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <span className="sr-only">Close</span>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <DataUploader onClose={() => setShowUploader(false)} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DatasetBrowseUpload;
