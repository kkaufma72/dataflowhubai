import type { Dataset } from '../types';

// NOTE: Knowledge Graph visualization has been removed from the UI.
// This module is kept as a no-op shim to avoid accidental direct Neo4j
// connections from the browser in older call sites.

export const syncDatasetToNeo4j = async (_dataset: Dataset, _userId: string): Promise<void> => {};

export const bulkSyncDatasetsToNeo4j = async (
  _datasets: Dataset[],
  _userId: string
): Promise<{ synced: number; errors: number }> => ({ synced: 0, errors: 0 });

export const removeDatasetFromNeo4j = async (_datasetId: string): Promise<void> => {};

export default {
  syncDatasetToNeo4j,
  bulkSyncDatasetsToNeo4j,
  removeDatasetFromNeo4j,
};

