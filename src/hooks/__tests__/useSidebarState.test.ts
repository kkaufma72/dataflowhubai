import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useSidebarState } from '../useSidebarState';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('useSidebarState', () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  it('should initialize with default values', () => {
    const { result } = renderHook(() => useSidebarState());

    expect(result.current.isCollapsed).toBe(false);
    expect(result.current.selectedProjectIds).toEqual([]);
    expect(result.current.lastViewedDatasetId).toBeNull();
  });

  it('should toggle sidebar collapse state', () => {
    const { result } = renderHook(() => useSidebarState());

    act(() => {
      result.current.toggleSidebar();
    });

    expect(result.current.isCollapsed).toBe(true);

    act(() => {
      result.current.toggleSidebar();
    });

    expect(result.current.isCollapsed).toBe(false);
  });

  it('should add project ID', () => {
    const { result } = renderHook(() => useSidebarState());

    act(() => {
      result.current.addProjectId('project-1');
    });

    expect(result.current.selectedProjectIds).toEqual(['project-1']);

    act(() => {
      result.current.addProjectId('project-2');
    });

    expect(result.current.selectedProjectIds).toEqual(['project-1', 'project-2']);
  });

  it('should not add duplicate project IDs', () => {
    const { result } = renderHook(() => useSidebarState());

    act(() => {
      result.current.addProjectId('project-1');
      result.current.addProjectId('project-1');
    });

    expect(result.current.selectedProjectIds).toEqual(['project-1']);
  });

  it('should remove project ID', () => {
    const { result } = renderHook(() => useSidebarState());

    act(() => {
      result.current.addProjectId('project-1');
      result.current.addProjectId('project-2');
    });

    act(() => {
      result.current.removeProjectId('project-1');
    });

    expect(result.current.selectedProjectIds).toEqual(['project-2']);
  });

  it('should toggle project ID selection', () => {
    const { result } = renderHook(() => useSidebarState());

    act(() => {
      result.current.toggleProjectId('project-1');
    });

    expect(result.current.selectedProjectIds).toEqual(['project-1']);

    act(() => {
      result.current.toggleProjectId('project-1');
    });

    expect(result.current.selectedProjectIds).toEqual([]);
  });

  it('should set multiple project IDs at once', () => {
    const { result } = renderHook(() => useSidebarState());

    act(() => {
      result.current.setProjectIds(['project-1', 'project-2', 'project-3']);
    });

    expect(result.current.selectedProjectIds).toEqual(['project-1', 'project-2', 'project-3']);
  });

  it('should update last viewed dataset', () => {
    const { result } = renderHook(() => useSidebarState());

    act(() => {
      result.current.updateLastViewedDataset('dataset-1');
    });

    expect(result.current.lastViewedDatasetId).toBe('dataset-1');
  });

  it('should persist state to localStorage', async () => {
    const { result } = renderHook(() => useSidebarState());

    act(() => {
      result.current.toggleSidebar();
      result.current.addProjectId('project-1');
      result.current.updateLastViewedDataset('dataset-1');
    });

    // Wait for useEffect to run
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    const stored = JSON.parse(localStorageMock.getItem('datasetSidebarState') || '{}');
    expect(stored.isCollapsed).toBe(true);
    expect(stored.selectedProjectIds).toEqual(['project-1']);
    expect(stored.lastViewedDatasetId).toBe('dataset-1');
  });

  it('should restore state from localStorage on mount', () => {
    localStorageMock.setItem(
      'datasetSidebarState',
      JSON.stringify({
        isCollapsed: true,
        selectedProjectIds: ['project-1', 'project-2'],
        lastViewedDatasetId: 'dataset-1',
      })
    );

    const { result } = renderHook(() => useSidebarState());

    // Wait for initial load
    setTimeout(() => {
      expect(result.current.isCollapsed).toBe(true);
      expect(result.current.selectedProjectIds).toEqual(['project-1', 'project-2']);
      expect(result.current.lastViewedDatasetId).toBe('dataset-1');
      expect(result.current.isLoaded).toBe(true);
    }, 0);
  });

  it('should clear all state', async () => {
    const { result } = renderHook(() => useSidebarState());

    act(() => {
      result.current.toggleSidebar();
      result.current.addProjectId('project-1');
      result.current.updateLastViewedDataset('dataset-1');
    });

    act(() => {
      result.current.clearState();
    });

    expect(result.current.isCollapsed).toBe(false);
    expect(result.current.selectedProjectIds).toEqual([]);
    expect(result.current.lastViewedDatasetId).toBeNull();
    expect(localStorageMock.getItem('datasetSidebarState')).toBeNull();
  });

  it('should handle localStorage errors gracefully', () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('Quota exceeded');
    });

    const { result } = renderHook(() => useSidebarState());

    act(() => {
      result.current.addProjectId('project-1');
    });

    expect(result.current.selectedProjectIds).toEqual(['project-1']);
    expect(consoleErrorSpy).toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });
});
