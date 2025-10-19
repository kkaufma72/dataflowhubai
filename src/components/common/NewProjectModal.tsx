import React, { useState } from 'react';
import { X, Folder, Plus } from 'lucide-react';
import Button from './Button';
import { useMLContext } from '../../context/MLContext';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

const MAX_NAME_LENGTH = 100;

interface NewProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const NewProjectModal: React.FC<NewProjectModalProps> = ({ isOpen, onClose }) => {
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { setCurrentProject } = useMLContext();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!projectName.trim()) {
      toast.error('Project name is required');
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // Get current user
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        toast.error('You must be logged in to create a project');
        return;
      }
      
      // Create project in Supabase
      const { data: newProject, error } = await supabase
        .from('projects')
        .insert([{
          name: projectName,
          description: projectDescription,
          user_id: session.user.id
        }])
        .select()
        .single();
      
      if (error) throw error;
      
      // Set as current project (this will trigger MLContext to reload and clear datasets/models)
      setCurrentProject({
        id: newProject.id,
        name: newProject.name,
        description: newProject.description || '',
        createdAt: newProject.created_at
      });
      
      toast.success('Project created successfully');
      
      // Reset form
      setProjectName('');
      setProjectDescription('');
      onClose();
    } catch (error) {
      console.error('Error creating project:', error);
      toast.error('Failed to create project');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={onClose} aria-hidden="true" />
        
        <div className="inline-block w-full max-w-md overflow-hidden text-left align-bottom transition-all transform bg-white rounded-lg shadow-xl sm:my-8 sm:align-middle">
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
};

export default NewProjectModal;
