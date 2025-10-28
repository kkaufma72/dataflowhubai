/**
 * PostgreSQL Data Warehouse Client
 * 
 * Analytics database for BI queries and historical data
 * Separate from operational Supabase database
 * 
 * NOTE: Only works in development (requires local PostgreSQL)
 * Disabled in production build
 */

let Pool: any = null;

// Dynamic import for development only
const loadPg = async () => {
  if (typeof window === 'undefined') return null;
  if (Pool) return Pool;
  
  try {
    const pg = await import('pg');
    Pool = pg.Pool;
    return Pool;
  } catch (error) {
    console.warn('PostgreSQL client not available in this environment');
    return null;
  }
};

class DataWarehouse {
  private pool: Pool | null = null;
  private isConnected: boolean = false;

  /**
   * Initialize connection pool
   */
  async connect(): Promise<boolean> {
    try {
      // Load PostgreSQL client dynamically
      const PgPool = await loadPg();
      if (!PgPool) {
        console.log('⚠️ PostgreSQL client not available (production)');
        return false;
      }

      const config = {
        host: import.meta.env.VITE_WAREHOUSE_HOST || 'localhost',
        port: parseInt(import.meta.env.VITE_WAREHOUSE_PORT || '5433'),
        database: import.meta.env.VITE_WAREHOUSE_DB || 'datawarehouse',
        user: import.meta.env.VITE_WAREHOUSE_USER || 'analytics',
        password: import.meta.env.VITE_WAREHOUSE_PASSWORD || 'warehouse2024',
        max: 10,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 5000,
      };

      this.pool = new PgPool(config);

      // Test connection
      const client = await this.pool.connect();
      await client.query('SELECT NOW()');
      client.release();

      this.isConnected = true;
      console.log('✅ Data Warehouse connected');
      return true;
    } catch (error) {
      console.warn('⚠️ Data Warehouse not available:', error);
      this.isConnected = false;
      return false;
    }
  }

  /**
   * Execute query
   */
  async query(sql: string, params: any[] = []): Promise<any> {
    if (!this.pool) {
      await this.connect();
    }

    if (!this.pool) {
      throw new Error('Data Warehouse not connected');
    }

    return await this.pool.query(sql, params);
  }

  /**
   * Log dataset upload event
   */
  async logDatasetUpload(dataset: any, userId: string): Promise<void> {
    try {
      // Upsert dataset dimension
      await this.query(`
        INSERT INTO dim_datasets (
          dataset_id, name, description, file_type, created_at,
          total_rows, total_columns, metadata
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (dataset_id) DO UPDATE SET
          last_analyzed_at = NOW(),
          total_rows = EXCLUDED.total_rows,
          total_columns = EXCLUDED.total_columns
      `, [
        dataset.id,
        dataset.name,
        dataset.description || '',
        dataset.file_type || 'csv',
        dataset.created_at || new Date().toISOString(),
        dataset.row_count || dataset.rows || 0,
        dataset.column_count || dataset.columns || 0,
        JSON.stringify(dataset.metadata || {})
      ]);

      // Log event
      await this.logEvent(userId, dataset.id, 'upload', true);
    } catch (error) {
      console.error('Warehouse log error:', error);
      // Don't throw - warehouse logging is optional
    }
  }

  /**
   * Log analysis event
   */
  async logEvent(
    userId: string,
    datasetId: string,
    eventType: string,
    success: boolean,
    durationMs?: number,
    metadata?: any
  ): Promise<void> {
    try {
      await this.query(`
        INSERT INTO fact_analysis_events (
          user_id, dataset_id, event_type, success, duration_ms, metadata
        ) VALUES ($1, $2, $3, $4, $5, $6)
      `, [userId, datasetId, eventType, success, durationMs || 0, JSON.stringify(metadata || {})]);
    } catch (error) {
      console.error('Event logging error:', error);
    }
  }

  /**
   * Log dataset health snapshot
   */
  async logDatasetHealth(
    datasetId: string,
    healthScore: number,
    missingPct: number,
    duplicatePct: number,
    grade: string
  ): Promise<void> {
    try {
      await this.query(`
        INSERT INTO fact_dataset_health (
          dataset_id, snapshot_date, health_score,
          missing_values_pct, duplicate_rows_pct, quality_grade
        ) VALUES ($1, NOW(), $2, $3, $4, $5)
      `, [datasetId, healthScore, missingPct, duplicatePct, grade]);
    } catch (error) {
      console.error('Health logging error:', error);
    }
  }

  /**
   * Get daily usage statistics
   */
  async getDailyUsageStats(days: number = 30): Promise<any[]> {
    const result = await this.query(`
      SELECT 
        date,
        total_uploads,
        total_analyses,
        total_ai_chats,
        total_model_trains,
        unique_users
      FROM agg_daily_usage
      WHERE date >= CURRENT_DATE - INTERVAL '${days} days'
      ORDER BY date DESC
    `);

    return result.rows;
  }

  /**
   * Get top datasets by usage
   */
  async getTopDatasets(limit: number = 10): Promise<any[]> {
    const result = await this.query(`
      SELECT 
        d.name,
        d.total_rows,
        COUNT(e.event_id) as analysis_count,
        MAX(e.event_timestamp) as last_used
      FROM dim_datasets d
      LEFT JOIN fact_analysis_events e ON d.dataset_id = e.dataset_id
      GROUP BY d.dataset_id, d.name, d.total_rows
      ORDER BY analysis_count DESC
      LIMIT $1
    `, [limit]);

    return result.rows;
  }

  /**
   * Get user engagement metrics
   */
  async getUserEngagement(days: number = 30): Promise<any[]> {
    const result = await this.query(`
      SELECT 
        u.email,
        u.company,
        u.use_case,
        COUNT(DISTINCT e.dataset_id) as datasets_used,
        COUNT(e.event_id) as total_actions,
        MAX(e.event_timestamp) as last_active
      FROM dim_users u
      JOIN fact_analysis_events e ON u.user_id = e.user_id
      WHERE e.event_timestamp >= NOW() - INTERVAL '${days} days'
      GROUP BY u.user_id, u.email, u.company, u.use_case
      ORDER BY total_actions DESC
    `);

    return result.rows;
  }

  /**
   * Get dataset health trends
   */
  async getHealthTrends(datasetId: string, days: number = 30): Promise<any[]> {
    const result = await this.query(`
      SELECT 
        snapshot_date,
        health_score,
        missing_values_pct,
        quality_grade
      FROM fact_dataset_health
      WHERE dataset_id = $1
        AND snapshot_date >= NOW() - INTERVAL '${days} days'
      ORDER BY snapshot_date ASC
    `, [datasetId]);

    return result.rows;
  }

  /**
   * Aggregate today's stats (run daily)
   */
  async aggregateDailyStats(): Promise<void> {
    await this.query(`
      INSERT INTO agg_daily_usage (
        date, total_uploads, total_analyses, total_ai_chats,
        total_model_trains, unique_users
      )
      SELECT 
        CURRENT_DATE,
        SUM(CASE WHEN event_type = 'upload' THEN 1 ELSE 0 END),
        SUM(CASE WHEN event_type = 'analyze' THEN 1 ELSE 0 END),
        SUM(CASE WHEN event_type = 'chat' THEN 1 ELSE 0 END),
        SUM(CASE WHEN event_type = 'train' THEN 1 ELSE 0 END),
        COUNT(DISTINCT user_id)
      FROM fact_analysis_events
      WHERE event_timestamp::date = CURRENT_DATE
      ON CONFLICT (date) DO UPDATE SET
        total_uploads = EXCLUDED.total_uploads,
        total_analyses = EXCLUDED.total_analyses,
        total_ai_chats = EXCLUDED.total_ai_chats,
        total_model_trains = EXCLUDED.total_model_trains,
        unique_users = EXCLUDED.unique_users
    `);
  }

  /**
   * Check if connected
   */
  isReady(): boolean {
    return this.isConnected;
  }

  /**
   * Close connection
   */
  async close(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
      this.isConnected = false;
    }
  }
}

// Singleton instance
export const dataWarehouse = new DataWarehouse();

export default dataWarehouse;

