import React, { useState, useEffect } from 'react';
import { X, Search, FolderOpen, Check } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Project } from '../../types';
import Button from '../common/Button';

interface ProjectSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectProject: (project: Project) => void;
  currentProjectId?: string;
  datasetName: string;
}

const ProjectSelectorModal: React.FC<ProjectSelectorModalProps> = ({
  isOpen,
  onClose,
  onSelectProject,
  currentProjectId,
  datasetName
}) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadProjects();
    }
  }, [isOpen]);

  const loadProjects = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('name');

      if (error) throw error;
      
      // Filter out the current project
      const filteredProjects = (data || []).filter((project: Project) => project.id !== currentProjectId);
      setProjects(filteredProjects);
    } catch (error) {
      console.error('Error loading projects:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredProjects = projects.filter((project) =>
    project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (project.description && project.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleConfirmMove = () => {
    if (selectedProject) {
      onSelectProject(selectedProject);
      onClose();
      setSelectedProject(null);
      setSearchTerm('');
    }
  };

  const handleClose = () => {
    onClose();
    setSelectedProject(null);
    setSearchTerm('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Move Dataset</h3>
            <p className="text-sm text-gray-600 mt-1">
              Select a project to move "<span className="font-medium">{datasetName}</span>" to
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-gray-100">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search projects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Project List */}
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="text-center py-8">
              <FolderOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">
                {projects.length === 0 
                  ? 'No other projects available' 
                  : 'No projects match your search'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredProjects.map((project) => (
                <div
                  key={project.id}
                  onClick={() => setSelectedProject(project)}
                  className={`p-3 border-2 rounded-lg cursor-pointer transition-all ${
                    selectedProject?.id === project.id
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <FolderOpen className="w-4 h-4 text-gray-500 flex-shrink-0" />
                        <h4 className="font-medium text-gray-900 truncate">{project.name}</h4>
                        {selectedProject?.id === project.id && (
                          <Check className="w-4 h-4 text-indigo-600" />
                        )}
                      </div>
                      {project.description && (
                        <p className="text-sm text-gray-500 mt-1 line-clamp-2">{project.description}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 flex gap-3">
          <Button
            variant="outline"
            onClick={handleClose}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirmMove}
            disabled={!selectedProject}
            className="flex-1"
          >
            Move Dataset
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProjectSelectorModal;
