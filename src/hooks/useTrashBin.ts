import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useUser } from '../context/UserContext';

export interface TrashItem {
  id: string;
  user_id: string;
  item_type: 'dataset' | 'model' | 'pipeline' | 'deployment';
  item_id: string;
  item_name: string;
  item_data: any;
  deleted_at: string;
  expires_at: string;
  restored_at: string | null;
  permanently_deleted_at: string | null;
  metadata: any;
}

export const useTrashBin = () => {
  const { user } = useUser();
  const [trashItems, setTrashItems] = useState<TrashItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    fetchTrashItems();

    // Subscribe to changes
    const channel = supabase
      .channel('trash_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'trash_bin',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchTrashItems();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const fetchTrashItems = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('trash_bin')
        .select('*')
        .eq('user_id', user.id)
        .is('restored_at', null)
        .is('permanently_deleted_at', null)
        .order('deleted_at', { ascending: false });

      if (fetchError) throw fetchError;

      setTrashItems(data || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching trash items:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch trash items');
    } finally {
      setLoading(false);
    }
  };

  const moveToTrash = async (
    itemType: TrashItem['item_type'],
    itemId: string,
    itemName: string,
    itemData: any
  ) => {
    if (!user) throw new Error('User not authenticated');

    try {
      const { error: insertError } = await supabase.from('trash_bin').insert({
        user_id: user.id,
        item_type: itemType,
        item_id: itemId,
        item_name: itemName,
        item_data: itemData,
        deleted_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
      });

      if (insertError) throw insertError;

      // Also soft delete in the original table
      if (itemType === 'dataset') {
        await supabase
          .from('datasets')
          .update({ deleted_at: new Date().toISOString(), deleted_by: user.id })
          .eq('id', itemId);
      } else if (itemType === 'model') {
        await supabase
          .from('models')
          .update({ deleted_at: new Date().toISOString(), deleted_by: user.id })
          .eq('id', itemId);
      }

      await fetchTrashItems();
    } catch (err) {
      console.error('Error moving to trash:', err);
      throw err;
    }
  };

  const restoreItem = async (trashItemId: string) => {
    try {
      // Call the restore function
      const { data, error: restoreError } = await supabase.rpc('restore_from_trash', {
        trash_item_id: trashItemId,
      });

      if (restoreError) throw restoreError;

      if (data === false) {
        throw new Error('Failed to restore item');
      }

      await fetchTrashItems();
      return true;
    } catch (err) {
      console.error('Error restoring item:', err);
      throw err;
    }
  };

  const permanentlyDelete = async (trashItemId: string) => {
    try {
      const trashItem = trashItems.find(item => item.id === trashItemId);
      if (!trashItem) throw new Error('Item not found');

      // Mark as permanently deleted
      const { error: updateError } = await supabase
        .from('trash_bin')
        .update({ permanently_deleted_at: new Date().toISOString() })
        .eq('id', trashItemId);

      if (updateError) throw updateError;

      // Actually delete from original table
      if (trashItem.item_type === 'dataset') {
        await supabase.from('datasets').delete().eq('id', trashItem.item_id);
      } else if (trashItem.item_type === 'model') {
        await supabase.from('models').delete().eq('id', trashItem.item_id);
      }

      await fetchTrashItems();
    } catch (err) {
      console.error('Error permanently deleting item:', err);
      throw err;
    }
  };

  const emptyTrash = async () => {
    try {
      const itemIds = trashItems.map(item => item.id);

      // Mark all as permanently deleted
      const { error: updateError } = await supabase
        .from('trash_bin')
        .update({ permanently_deleted_at: new Date().toISOString() })
        .in('id', itemIds);

      if (updateError) throw updateError;

      // Delete all items from original tables
      const datasetIds = trashItems
        .filter(item => item.item_type === 'dataset')
        .map(item => item.item_id);
      const modelIds = trashItems
        .filter(item => item.item_type === 'model')
        .map(item => item.item_id);

      if (datasetIds.length > 0) {
        await supabase.from('datasets').delete().in('id', datasetIds);
      }

      if (modelIds.length > 0) {
        await supabase.from('models').delete().in('id', modelIds);
      }

      await fetchTrashItems();
    } catch (err) {
      console.error('Error emptying trash:', err);
      throw err;
    }
  };

  const getDaysUntilExpiration = (expiresAt: string): number => {
    const expiration = new Date(expiresAt);
    const now = new Date();
    const diffTime = expiration.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  return {
    trashItems,
    loading,
    error,
    moveToTrash,
    restoreItem,
    permanentlyDelete,
    emptyTrash,
    getDaysUntilExpiration,
    refetch: fetchTrashItems,
  };
};
