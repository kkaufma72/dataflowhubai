/**
 * Neo4j Graph Database Client
 * 
 * For knowledge graphs, relationship analysis, and graph-based insights
 */

import neo4j, { Driver, Session } from 'neo4j-driver';

class Neo4jClient {
  private driver: Driver | null = null;
  private isConnected: boolean = false;

  /**
   * Initialize connection to Neo4j
   */
  async connect(): Promise<boolean> {
    try {
      const uri = import.meta.env.VITE_NEO4J_URI || 'bolt://localhost:55002';
      const user = import.meta.env.VITE_NEO4J_USER || 'neo4j';
      const password = import.meta.env.VITE_NEO4J_PASSWORD || 'dataflowhub2024';

      console.log('🔵 Connecting to Neo4j:', uri);

      this.driver = neo4j.driver(
        uri,
        neo4j.auth.basic(user, password),
        {
          // For Neo4j Aura (cloud), need to handle SSL
          encrypted: uri.includes('+s'),
          trust: 'TRUST_SYSTEM_CA_SIGNED_CERTIFICATES',
          maxConnectionPoolSize: 50,
          connectionAcquisitionTimeout: 60000
        }
      );

      // Test connection
      await this.driver.verifyConnectivity();
      this.isConnected = true;
      console.log('✅ Neo4j connected to:', uri);
      return true;
    } catch (error: any) {
      console.error('❌ Neo4j connection failed:', error.message);
      this.isConnected = false;
      return false;
    }
  }

  /**
   * Run a Cypher query
   */
  async runQuery(cypher: string, params: any = {}): Promise<any[]> {
    if (!this.driver) {
      await this.connect();
    }

    if (!this.driver) {
      throw new Error('Neo4j not connected');
    }

    const session: Session = this.driver.session();
    try {
      const result = await session.run(cypher, params);
      return result.records.map(record => record.toObject());
    } finally {
      await session.close();
    }
  }

  /**
   * Create dataset node in graph
   */
  async createDatasetNode(dataset: any): Promise<void> {
    const query = `
      MERGE (d:Dataset {id: $id})
      SET d.name = $name,
          d.rows = $rows,
          d.columns = $columns,
          d.created_at = $created_at,
          d.file_type = $file_type
      RETURN d
    `;

    await this.runQuery(query, {
      id: dataset.id,
      name: dataset.name,
      rows: dataset.row_count || dataset.rows || 0,
      columns: dataset.column_count || dataset.columns || 0,
      created_at: dataset.created_at || dataset.dateUploaded || new Date().toISOString(),
      file_type: dataset.file_type || 'csv'
    });
  }

  /**
   * Link dataset to user
   */
  async linkDatasetToUser(datasetId: string, userId: string): Promise<void> {
    const query = `
      MERGE (u:User {id: $userId})
      MERGE (d:Dataset {id: $datasetId})
      MERGE (u)-[:OWNS]->(d)
    `;

    await this.runQuery(query, { datasetId, userId });
  }

  /**
   * Find similar datasets based on columns and size
   */
  async findSimilarDatasets(datasetId: string, limit: number = 5): Promise<any[]> {
    const query = `
      MATCH (source:Dataset {id: $datasetId})
      MATCH (target:Dataset)
      WHERE target.id <> source.id
        AND abs(target.columns - source.columns) <= 5
        AND abs(toFloat(target.rows) - toFloat(source.rows)) / toFloat(source.rows) < 0.5
      RETURN target, 
             abs(target.columns - source.columns) as column_diff,
             abs(toFloat(target.rows) - toFloat(source.rows)) / toFloat(source.rows) as size_diff
      ORDER BY column_diff ASC, size_diff ASC
      LIMIT $limit
    `;

    return await this.runQuery(query, { datasetId, limit });
  }

  /**
   * Create analysis tracking
   */
  async trackAnalysis(userId: string, datasetId: string, analysisType: string, results: any): Promise<void> {
    const query = `
      MATCH (u:User {id: $userId})
      MATCH (d:Dataset {id: $datasetId})
      CREATE (a:Analysis {
        id: randomUUID(),
        type: $analysisType,
        results: $results,
        timestamp: datetime()
      })
      CREATE (u)-[:PERFORMED]->(a)-[:ON]->(d)
    `;

    await this.runQuery(query, {
      userId,
      datasetId,
      analysisType,
      results: JSON.stringify(results)
    });
  }

  /**
   * Get user's analysis history
   */
  async getUserAnalysisHistory(userId: string, limit: number = 10): Promise<any[]> {
    const query = `
      MATCH (u:User {id: $userId})-[:PERFORMED]->(a:Analysis)-[:ON]->(d:Dataset)
      RETURN a.type as type, 
             a.timestamp as timestamp, 
             d.name as dataset_name,
             a.results as results
      ORDER BY a.timestamp DESC
      LIMIT $limit
    `;

    return await this.runQuery(query, { userId, limit });
  }

  /**
   * Find dataset relationships for graph visualization
   */
  async getDatasetGraph(userId: string): Promise<any> {
    // Try user-specific datasets first
    let query = `
      MATCH (u:User {id: $userId})-[:OWNS]->(d:Dataset)
      OPTIONAL MATCH (d)-[r:SIMILAR_TO|RELATED_TO|FEEDS_INTO]-(other:Dataset)
      RETURN d, collect(distinct r) as relationships, collect(distinct other) as related
    `;

    let results = await this.runQuery(query, { userId });

    // If no user-specific datasets, get ALL datasets (for demo/testing)
    if (results.length === 0) {
      console.log('📊 No user datasets found, showing all datasets for demo');
      query = `
        MATCH (d:Dataset)
        OPTIONAL MATCH (d)-[r:SIMILAR_TO|RELATED_TO|FEEDS_INTO]-(other:Dataset)
        RETURN d, collect(distinct r) as relationships, collect(distinct other) as related
      `;
      results = await this.runQuery(query);
    }
    
    // Transform for visualization
    const nodes = new Map();
    const edges = [];

    results.forEach(record => {
      const dataset = record.d.properties;
      nodes.set(dataset.id, {
        id: dataset.id,
        label: dataset.name,
        size: dataset.rows || 100,
        group: dataset.file_type || 'csv'
      });

      record.related?.forEach((related: any) => {
        if (related && related.properties) {
          nodes.set(related.properties.id, {
            id: related.properties.id,
            label: related.properties.name,
            size: related.properties.rows || 100,
            group: related.properties.file_type || 'csv'
          });
        }
      });

      record.relationships?.forEach((rel: any) => {
        if (rel && rel.start && rel.end) {
          edges.push({
            from: rel.start,
            to: rel.end,
            label: rel.type
          });
        }
      });
    });

    return {
      nodes: Array.from(nodes.values()),
      edges
    };
  }

  /**
   * Close connection
   */
  async close(): Promise<void> {
    if (this.driver) {
      await this.driver.close();
      this.isConnected = false;
    }
  }

  /**
   * Check if connected
   */
  isReady(): boolean {
    return this.isConnected;
  }
}

// Singleton instance
export const neo4jClient = new Neo4jClient();

export default neo4jClient;

