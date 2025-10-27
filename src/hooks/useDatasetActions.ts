// Dataset Actions Hook - Delete, Archive, Restore functionality

import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Dataset } from '../types';
import toast from 'react-hot-toast';

export const useDatasetActions = () => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);

  /**
   * Soft delete (move to trash bin)
   */
  const deleteDataset = async (dataset: Dataset, userId: string) => {
    setIsDeleting(true);
    
    try {
      // Move to trash_bin table (soft delete)
      const { error: trashError } = await supabase
        .from('trash_bin')
        .insert({
          user_id: userId,
          item_type: 'dataset',
          item_id: dataset.id,
          item_name: dataset.name,
          item_data: dataset,
          deleted_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
        });

      if (trashError) throw trashError;

      // Mark as deleted in datasets table
      const { error: deleteError } = await supabase
        .from('datasets')
        .update({
          deleted_at: new Date().toISOString(),
          deleted_by: userId
        })
        .eq('id', dataset.id);

      if (deleteError) throw deleteError;

      toast.success(`"${dataset.name}" moved to trash. Undo within 30 days.`);
      return { success: true };

    } catch (error: any) {
      console.error('Error deleting dataset:', error);
      toast.error('Failed to delete dataset');
      return { success: false, error };
    } finally {
      setIsDeleting(false);
    }
  };

  /**
   * Archive dataset (mark as archived but keep accessible)
   */
  const archiveDataset = async (dataset: Dataset, userId: string) => {
    setIsArchiving(true);
    
    try {
      const { error } = await supabase
        .from('datasets')
        .update({
          metadata: {
            ...(dataset as any).metadata,
            archived: true,
            archived_at: new Date().toISOString(),
            archived_by: userId
          }
        })
        .eq('id', dataset.id);

      if (error) throw error;

      toast.success(`"${dataset.name}" archived successfully`);
      return { success: true };

    } catch (error: any) {
      console.error('Error archiving dataset:', error);
      toast.error('Failed to archive dataset');
      return { success: false, error };
    } finally {
      setIsArchiving(false);
    }
  };

  /**
   * Restore from trash
   */
  const restoreDataset = async (datasetId: string) => {
    try {
      const { error } = await supabase
        .from('datasets')
        .update({
          deleted_at: null,
          deleted_by: null
        })
        .eq('id', datasetId);

      if (error) throw error;

      // Remove from trash bin
      await supabase
        .from('trash_bin')
        .delete()
        .eq('item_id', datasetId);

      toast.success('Dataset restored successfully');
      return { success: true };

    } catch (error: any) {
      console.error('Error restoring dataset:', error);
      toast.error('Failed to restore dataset');
      return { success: false, error };
    }
  };

  /**
   * Permanently delete (from trash)
   */
  const permanentlyDelete = async (datasetId: string) => {
    try {
      // Delete from datasets table
      const { error: datasetError } = await supabase
        .from('datasets')
        .delete()
        .eq('id', datasetId);

      if (datasetError) throw datasetError;

      // Delete from trash bin
      const { error: trashError } = await supabase
        .from('trash_bin')
        .delete()
        .eq('item_id', datasetId);

      if (trashError) throw trashError;

      toast.success('Dataset permanently deleted');
      return { success: true };

    } catch (error: any) {
      console.error('Error permanently deleting dataset:', error);
      toast.error('Failed to permanently delete dataset');
      return { success: false, error };
    }
  };

  return {
    deleteDataset,
    archiveDataset,
    restoreDataset,
    permanentlyDelete,
    isDeleting,
    isArchiving
  };
};

