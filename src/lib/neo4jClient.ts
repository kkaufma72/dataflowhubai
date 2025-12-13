// Knowledge Graph visualization has been removed from the UI.
// Keep this file as a no-op shim so any legacy imports won't break,
// and to ensure we do not bundle or connect to Neo4j from the browser.

class Neo4jClient {
  async connect(): Promise<boolean> {
    return false;
  }

  async disconnect(): Promise<void> {}

  async runQuery(_cypher: string, _params: any = {}): Promise<any[]> {
    return [];
  }

  async createDatasetNode(_dataset: any): Promise<void> {}

  async linkDatasetToUser(_datasetId: string, _userId: string): Promise<void> {}

  async findSimilarDatasets(_datasetId: string, _limit: number = 5): Promise<any[]> {
    return [];
  }

  async trackAnalysis(
    _userId: string,
    _datasetId: string,
    _analysisType: string,
    _results: any
  ): Promise<void> {}
}

export const neo4jClient = new Neo4jClient();

export default neo4jClient;
