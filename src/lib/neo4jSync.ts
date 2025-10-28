/**
 * Neo4j Auto-Sync Service
 * 
 * Automatically syncs datasets to Neo4j knowledge graph
 * Builds relationships based on similarity
 */

import { neo4jClient } from './neo4jClient';
import { Dataset } from '../types';

/**
 * Sync dataset to Neo4j after upload
 */
export const syncDatasetToNeo4j = async (dataset: Dataset, userId: string): Promise<void> => {
  try {
    // Check if Neo4j is available
    const connected = await neo4jClient.connect();
    if (!connected) {
      console.log('⚠️ Neo4j not available, skipping graph sync');
      return;
    }

    console.log('🔵 Syncing dataset to Neo4j:', dataset.name);

    // 1. Create dataset node
    await neo4jClient.createDatasetNode(dataset);
    
    // 2. Link to user
    await neo4jClient.linkDatasetToUser(dataset.id, userId);

    // 3. Find and create similarity relationships
    await autoDetectSimilarities(dataset);

    console.log('✅ Dataset synced to knowledge graph');
  } catch (error) {
    console.error('Neo4j sync error:', error);
    // Don't throw - sync is optional
  }
};

/**
 * Auto-detect similar datasets and create relationships
 */
const autoDetectSimilarities = async (newDataset: Dataset): Promise<void> => {
  try {
    // Find datasets with similar column count
    const query = `
      MATCH (new:Dataset {id: $newId})
      MATCH (existing:Dataset)
      WHERE existing.id <> new.id
        AND abs(existing.columns - new.columns) <= 5
        AND abs(toFloat(existing.rows) - toFloat(new.rows)) / toFloat(new.rows) < 0.5
      WITH new, existing, 
           abs(existing.columns - new.columns) as col_diff,
           abs(toFloat(existing.rows) - toFloat(new.rows)) / toFloat(new.rows) as size_diff
      WHERE col_diff + size_diff < 0.3
      MERGE (new)-[r:SIMILAR_TO]->(existing)
      SET r.score = 1.0 - (col_diff + size_diff),
          r.created_at = datetime(),
          r.reason = 'Auto-detected similarity'
      RETURN existing.name as similar_name, r.score as similarity
    `;

    const similar = await neo4jClient.runQuery(query, {
      newId: newDataset.id
    });

    if (similar.length > 0) {
      console.log(`🔗 Created ${similar.length} similarity relationships`);
    }
  } catch (error) {
    console.error('Similarity detection error:', error);
  }
};

/**
 * Bulk sync all existing datasets to Neo4j
 */
export const bulkSyncDatasetsToNeo4j = async (
  datasets: Dataset[], 
  userId: string
): Promise<{ synced: number; errors: number }> => {
  let synced = 0;
  let errors = 0;

  const connected = await neo4jClient.connect();
  if (!connected) {
    console.log('⚠️ Neo4j not available');
    return { synced: 0, errors: datasets.length };
  }

  console.log(`🔵 Bulk syncing ${datasets.length} datasets to Neo4j...`);

  for (const dataset of datasets) {
    try {
      await neo4jClient.createDatasetNode(dataset);
      await neo4jClient.linkDatasetToUser(dataset.id, userId);
      synced++;
    } catch (error) {
      console.error(`Failed to sync ${dataset.name}:`, error);
      errors++;
    }
  }

  // After all nodes created, detect similarities
  for (const dataset of datasets) {
    try {
      await autoDetectSimilarities(dataset);
    } catch (error) {
      console.error(`Failed to detect similarities for ${dataset.name}:`, error);
    }
  }

  console.log(`✅ Synced ${synced} datasets, ${errors} errors`);
  return { synced, errors };
};

/**
 * Remove dataset from Neo4j when deleted
 */
export const removeDatasetFromNeo4j = async (datasetId: string): Promise<void> => {
  try {
    const connected = await neo4jClient.connect();
    if (!connected) return;

    const query = `
      MATCH (d:Dataset {id: $datasetId})
      DETACH DELETE d
    `;

    await neo4jClient.runQuery(query, { datasetId });
    console.log('🗑️ Removed dataset from knowledge graph');
  } catch (error) {
    console.error('Neo4j delete error:', error);
  }
};

export default {
  syncDatasetToNeo4j,
  bulkSyncDatasetsToNeo4j,
  removeDatasetFromNeo4j
};

