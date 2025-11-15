// Neo4j Test Data for DataFlowHub Knowledge Graph
// Copy and paste this into Neo4j Browser at http://localhost:7474

// Step 1: Clear existing data (optional)
MATCH (n) DETACH DELETE n;

// Step 2: Create test datasets
CREATE (d1:Dataset {
  id: 'ds-customer-2024',
  name: 'Customer Analytics 2024',
  rows: 1250,
  columns: 15,
  file_type: 'csv',
  created_at: datetime()
})

CREATE (d2:Dataset {
  id: 'ds-sales-q4',
  name: 'Sales Data Q4 2024',
  rows: 850,
  columns: 8,
  file_type: 'excel',
  created_at: datetime()
})

CREATE (d3:Dataset {
  id: 'ds-marketing',
  name: 'Marketing Campaign Metrics',
  rows: 3200,
  columns: 22,
  file_type: 'json',
  created_at: datetime()
})

CREATE (d4:Dataset {
  id: 'ds-product',
  name: 'Product Catalog',
  rows: 450,
  columns: 12,
  file_type: 'csv',
  created_at: datetime()
})

CREATE (d5:Dataset {
  id: 'ds-feedback',
  name: 'Customer Feedback',
  rows: 2100,
  columns: 6,
  file_type: 'json',
  created_at: datetime()
})

// Step 3: Create relationships between datasets
CREATE (d1)-[:SIMILAR_TO {score: 0.85, reason: 'Both customer-related'}]->(d2)
CREATE (d2)-[:SIMILAR_TO {score: 0.72, reason: 'Revenue analysis'}]->(d3)
CREATE (d1)-[:RELATED_TO {type: 'customer_insights'}]->(d5)
CREATE (d3)-[:FEEDS_INTO]->(d2)
CREATE (d4)-[:RELATED_TO {type: 'sales_items'}]->(d2)

// Step 4: Create a user node (optional)
CREATE (u:User {
  id: 'user-123',
  email: 'you@dataflowhub.com',
  name: 'Kyle'
})

// Link user to datasets
CREATE (u)-[:OWNS]->(d1)
CREATE (u)-[:OWNS]->(d2)
CREATE (u)-[:OWNS]->(d3)
CREATE (u)-[:OWNS]->(d4)
CREATE (u)-[:OWNS]->(d5)

// Return everything to visualize
MATCH (n) 
RETURN n
LIMIT 25;

