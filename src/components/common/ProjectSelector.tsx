import React, { useState, useEffect } from 'react';
import { ChevronDown, Plus, FolderOpen } from 'lucide-react';
import { useMLContext } from '../../context/MLContext';
import Button from './Button';
import { Project } from '../../types';

interface ProjectSelectorProps {
  onNewProject: () => void;
}

const ProjectSelector: React.FC<ProjectSelectorProps> = ({ onNewProject }) => {
  const { currentProject, setCurrentProject } = useMLContext();
  const [isOpen, setIsOpen] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);

  // Fetch projects (in a real app, this would come from the MLContext)
  useEffect(() => {
    // For demo purposes, we'll create some sample projects
    const sampleProjects: Project[] = [
      {
        id: '1',
        name: 'Default Project',
        description: 'Default project created automatically',
        createdAt: new Date().toISOString()
      },
      {
        id: '2',
        name: 'Customer Churn Analysis',
        description: 'Predict customer churn for telecom company',
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: '3',
        name: 'Sales Forecasting',
        description: 'Predict quarterly sales for retail stores',
        createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: '4',
        name: 'Fraud Detection',
        description: 'Identify fraudulent transactions',
        createdAt: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];
    
    setProjects(sampleProjects);
  }, []);

  const handleSelectProject = (project: Project) => {
    setCurrentProject(project);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full px-4 py-2 text-sm font-medium text-left text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      >
        <div className="flex items-center">
          <FolderOpen className="w-5 h-5 mr-2 text-indigo-500" />
          <span className="truncate max-w-[200px]">{currentProject?.name || 'Select Project'}</span>
        </div>
        <ChevronDown className="w-5 h-5 ml-2 -mr-1 text-gray-400" aria-hidden="true" />
      </button>

      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white rounded-md shadow-lg">
          <div className="py-1 max-h-60 overflow-auto">
            {projects.map((project) => (
              <button
                key={project.id}
                className={`block w-full px-4 py-2 text-sm text-left hover:bg-gray-100 ${
                  currentProject?.id === project.id ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700'
                }`}
                onClick={() => handleSelectProject(project)}
              >
                <div className="flex items-center">
                  <FolderOpen className={`w-4 h-4 mr-2 ${
                    currentProject?.id === project.id ? 'text-indigo-500' : 'text-gray-400'
                  }`} />
                  <div className="flex-1 truncate">
                    <div className="font-medium">{project.name}</div>
                    {project.description && (
                      <div className="text-xs text-gray-500 truncate">{project.description}</div>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
          <div className="border-t border-gray-100">
            <button
              className="flex items-center w-full px-4 py-2 text-sm text-indigo-600 hover:bg-indigo-50"
              onClick={() => {
                setIsOpen(false);
                onNewProject();
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Create New Project
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectSelector;