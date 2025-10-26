import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { X, Folder, Plus } from 'lucide-react';
import Button from './Button';
import { useMLContext } from '../../context/MLContext';
import { useAuth } from '../auth/AuthProvider';
import toast from 'react-hot-toast';

const MAX_NAME_LENGTH = 100;

interface Project {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
}

interface NewProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const NewProjectModal: React.FC<NewProjectModalProps> = ({ isOpen, onClose }) => {
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { setCurrentProject } = useMLContext();
  const { user } = useAuth();

  // Debug logging
  React.useEffect(() => {
    if (isOpen) {
      console.log('🎯 NewProjectModal rendering with z-index: 99999/100000');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!projectName.trim()) {
      toast.error('Project name is required');
      return;
    }
    
    if (!user) {
      toast.error('You must be logged in to create a project');
      return;
    }
    
    try {
      setIsSubmitting(true);
      console.log('🔄 Creating project:', projectName);
      console.log('👤 Using authenticated user:', user.email);
      
      try {
        console.log('🔄 Creating project with direct REST API...');
        
        // Use helper function for insert
        const { supabaseInsert } = await import('../../lib/supabaseHelpers');
        
        const projectData = {
          name: projectName,
          description: projectDescription,
          user_id: user.id
        };
        
        console.log('📡 Inserting project:', projectData);
        
        const { data: insertedProjects, error: insertError } = await supabaseInsert<Project>('projects', projectData);
        
        if (insertError) {
          console.error('❌ Insert failed:', insertError);
          toast.error(`Failed to create project: ${insertError.message}`);
          return;
        }
        
        if (!insertedProjects || insertedProjects.length === 0) {
          console.error('❌ No data returned from insert');
          toast.error('Project created but no data returned');
          return;
        }
        
        const createdProject = insertedProjects[0];
        console.log('✅ Project created successfully:', createdProject);
        
        // Set as current project
        setCurrentProject({
          id: createdProject.id,
          name: createdProject.name,
          description: createdProject.description || '',
          createdAt: createdProject.created_at
        });
        
        console.log('✅ All done!');
        toast.success('Project created successfully');
        
        // Reset form
        setProjectName('');
        setProjectDescription('');
        onClose();
      } catch (dbError) {
        console.error('❌ Unexpected error:', dbError);
        const errorMessage = dbError instanceof Error ? dbError.message : 'An unexpected error occurred';
        toast.error(errorMessage);
      }
    } catch (error) {
      console.error('❌ Error creating project:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create project';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const modalContent = (
    <div
      className="fixed inset-0 overflow-y-auto"
      style={{ zIndex: 99999 }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
        style={{ zIndex: 99998 }}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Content - Standard centering approach */}
      <div className="flex min-h-screen items-center justify-center p-4 pt-20 pb-20">
        <div
          className="relative w-full max-w-md bg-white rounded-lg shadow-2xl"
          style={{ zIndex: 100000 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-4 pt-5 pb-4 bg-white sm:p-6 sm:pb-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <div className="flex items-center justify-center flex-shrink-0 w-10 h-10 bg-indigo-100 rounded-full sm:mx-0 sm:h-10 sm:w-10">
                  <Folder className="w-6 h-6 text-indigo-600" />
                </div>
                <h3 id="modal-title" className="ml-3 text-lg font-medium leading-6 text-gray-900">Create New Project</h3>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-500"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label htmlFor="projectName" className="block text-sm font-medium text-gray-700">
                  Project Name*
                </label>
                <input
                  type="text"
                  id="projectName"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  className="block w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="My New Project"
                  maxLength={MAX_NAME_LENGTH}
                  required
                  aria-required="true"
                />
              </div>
              
              <div className="mb-4">
                <label htmlFor="projectDescription" className="block text-sm font-medium text-gray-700">
                  Description (Optional)
                </label>
                <textarea
                  id="projectDescription"
                  value={projectDescription}
                  onChange={(e) => setProjectDescription(e.target.value)}
                  rows={3}
                  className="block w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="Describe your project..."
                  aria-describedby="description-hint"
                />
                <p id="description-hint" className="mt-1 text-xs text-gray-500">
                  Provide a brief description of your project's purpose and goals.
                </p>
              </div>
              
              <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="sm:col-start-2"
                  icon={<Plus className="w-4 h-4" />}
                >
                  {isSubmitting ? 'Creating...' : 'Create Project'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  className="mt-3 sm:mt-0 sm:col-start-1"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );

  // Use Portal to render at document root level
  const portalRoot = document.getElementById('modal-portal') || document.body;
  return ReactDOM.createPortal(modalContent, portalRoot);
};

export default NewProjectModal;
