import React, { useMemo } from 'react';
import { Folder, ChevronRight, ChevronDown, Database, Calendar, FileText } from 'lucide-react';
import { Project, Dataset } from '../../types';

interface ProjectSidebarProps {
  projects: Project[];
  datasets: Dataset[];
  selectedProjectIds: string[];
  onToggleProject: (projectId: string) => void;
  onSelectDataset: (dataset: Dataset) => void;
  selectedDatasetId?: string;
  className?: string;
}

/**
 * Sidebar component displaying project hierarchy with datasets
 */
const ProjectSidebar: React.FC<ProjectSidebarProps> = ({
  projects,
  datasets,
  selectedProjectIds,
  onToggleProject,
  onSelectDataset,
  selectedDatasetId,
  className = '',
}) => {
  // Group datasets by project
  const datasetsByProject = useMemo(() => {
    const grouped = new Map<string, Dataset[]>();
    
    datasets.forEach(dataset => {
      const projectId = dataset.projectId || 'unassigned';
      if (!grouped.has(projectId)) {
        grouped.set(projectId, []);
      }
      grouped.get(projectId)!.push(dataset);
    });

    return grouped;
  }, [datasets]);

  // Sort datasets by date uploaded (newest first)
  const sortedDatasetsByProject = useMemo(() => {
    const sorted = new Map<string, Dataset[]>();
    datasetsByProject.forEach((dsList, projectId) => {
      sorted.set(projectId, [...dsList].sort((a, b) => 
        new Date(b.dateUploaded).getTime() - new Date(a.dateUploaded).getTime()
      ));
    });
    return sorted;
  }, [datasetsByProject]);

  // Format file size
  const formatFileSize = (sizeStr: string): string => {
    const size = parseFloat(sizeStr);
    if (isNaN(size)) return sizeStr;
    if (size < 1024) return `${size.toFixed(0)} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Format date
  const formatDate = (dateStr: string): string => {
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffDays === 0) return 'Today';
      if (diffDays === 1) return 'Yesterday';
      if (diffDays < 7) return `${diffDays} days ago`;
      if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className={`flex flex-col h-full bg-white border-r border-gray-200 ${className}`}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200">
        <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">
          Projects
        </h2>
        <p className="text-xs text-gray-500 mt-1">
          {projects.length} {projects.length === 1 ? 'project' : 'projects'}
        </p>
      </div>

      {/* Project List */}
      <div className="flex-1 overflow-y-auto">
        {projects.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <Folder className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500">No projects yet</p>
            <p className="text-xs text-gray-400 mt-1">
              Create a project to organize your datasets
            </p>
          </div>
        ) : (
          <div className="py-2">
            {projects.map(project => {
              const isExpanded = selectedProjectIds.includes(project.id);
              const projectDatasets = sortedDatasetsByProject.get(project.id) || [];
              const datasetCount = projectDatasets.length;

              return (
                <div key={project.id} className="mb-1">
                  {/* Project Header */}
                  <button
                    onClick={() => onToggleProject(project.id)}
                    className="w-full px-4 py-2 flex items-center gap-2 hover:bg-gray-50 transition-colors text-left"
                  >
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-gray-500 flex-shrink-0" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-gray-500 flex-shrink-0" />
                    )}
                    <Folder className="w-4 h-4 text-blue-500 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {project.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {datasetCount} {datasetCount === 1 ? 'dataset' : 'datasets'}
                      </p>
                    </div>
                  </button>

                  {/* Dataset List */}
                  {isExpanded && (
                    <div className="ml-6 border-l-2 border-gray-200">
                      {projectDatasets.length === 0 ? (
                        <div className="px-4 py-3 text-xs text-gray-400">
                          No datasets in this project
                        </div>
                      ) : (
                        projectDatasets.map(dataset => {
                          const isSelected = dataset.id === selectedDatasetId;
                          return (
                            <button
                              key={dataset.id}
                              onClick={() => onSelectDataset(dataset)}
                              className={`w-full px-4 py-2 flex items-start gap-3 hover:bg-gray-50 transition-colors text-left border-l-2 ${
                                isSelected 
                                  ? 'bg-blue-50 border-blue-500' 
                                  : 'border-transparent'
                              }`}
                            >
                              <Database 
                                className={`w-4 h-4 flex-shrink-0 mt-0.5 ${
                                  isSelected ? 'text-blue-600' : 'text-gray-400'
                                }`} 
                              />
                              <div className="flex-1 min-w-0">
                                <p className={`text-sm font-medium truncate ${
                                  isSelected ? 'text-blue-900' : 'text-gray-900'
                                }`}>
                                  {dataset.name}
                                </p>
                                <div className="flex items-center gap-3 mt-1">
                                  <div className="flex items-center gap-1 text-xs text-gray-500">
                                    <Calendar className="w-3 h-3" />
                                    {formatDate(dataset.dateUploaded)}
                                  </div>
                                  <div className="flex items-center gap-1 text-xs text-gray-500">
                                    <FileText className="w-3 h-3" />
                                    {formatFileSize(dataset.fileSize)}
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                                  <span>{dataset.rows.toLocaleString()} rows</span>
                                  <span>•</span>
                                  <span>{dataset.columns} columns</span>
                                </div>
                              </div>
                            </button>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer Stats */}
      <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between text-xs text-gray-600">
          <span>Total Datasets</span>
          <span className="font-semibold">{datasets.length}</span>
        </div>
      </div>
    </div>
  );
};

export default ProjectSidebar;
