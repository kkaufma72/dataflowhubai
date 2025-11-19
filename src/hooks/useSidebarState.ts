import { useState, useEffect, useCallback } from 'react';

interface SidebarState {
  isCollapsed: boolean;
  selectedProjectIds: string[];
  lastViewedDatasetId: string | null;
}

const STORAGE_KEY = 'datasetSidebarState';

/**
 * Custom hook for managing sidebar state with localStorage persistence
 */
export const useSidebarState = () => {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([]);
  const [lastViewedDatasetId, setLastViewedDatasetId] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load state from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const state: SidebarState = JSON.parse(stored);
        setIsCollapsed(state.isCollapsed || false);
        setSelectedProjectIds(state.selectedProjectIds || []);
        setLastViewedDatasetId(state.lastViewedDatasetId || null);
      }
    } catch (error) {
      console.error('Failed to load sidebar state from localStorage:', error);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Save state to localStorage whenever it changes
  useEffect(() => {
    if (!isLoaded) return; // Don't save until initial load is complete

    try {
      const state: SidebarState = {
        isCollapsed,
        selectedProjectIds,
        lastViewedDatasetId,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.error('Failed to save sidebar state to localStorage:', error);
    }
  }, [isCollapsed, selectedProjectIds, lastViewedDatasetId, isLoaded]);

  // Toggle sidebar collapse state
  const toggleSidebar = useCallback(() => {
    setIsCollapsed(prev => !prev);
  }, []);

  // Add project ID to selected list
  const addProjectId = useCallback((projectId: string) => {
    setSelectedProjectIds(prev => {
      if (prev.includes(projectId)) return prev;
      return [...prev, projectId];
    });
  }, []);

  // Remove project ID from selected list
  const removeProjectId = useCallback((projectId: string) => {
    setSelectedProjectIds(prev => prev.filter(id => id !== projectId));
  }, []);

  // Toggle project ID selection
  const toggleProjectId = useCallback((projectId: string) => {
    setSelectedProjectIds(prev => {
      if (prev.includes(projectId)) {
        return prev.filter(id => id !== projectId);
      }
      return [...prev, projectId];
    });
  }, []);

  // Set selected project IDs (replace all)
  const setProjectIds = useCallback((projectIds: string[]) => {
    setSelectedProjectIds(projectIds);
  }, []);

  // Update last viewed dataset
  const updateLastViewedDataset = useCallback((datasetId: string | null) => {
    setLastViewedDatasetId(datasetId);
  }, []);

  // Clear all state
  const clearState = useCallback(() => {
    setIsCollapsed(false);
    setSelectedProjectIds([]);
    setLastViewedDatasetId(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear sidebar state:', error);
    }
  }, []);

  return {
    isCollapsed,
    selectedProjectIds,
    lastViewedDatasetId,
    isLoaded,
    toggleSidebar,
    addProjectId,
    removeProjectId,
    toggleProjectId,
    setProjectIds,
    updateLastViewedDataset,
    clearState,
  };
};
