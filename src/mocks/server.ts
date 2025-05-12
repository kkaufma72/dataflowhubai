import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { sampleDatasets } from './data/datasets';
import { sampleModels } from './data/models';

// Define handlers
export const handlers = [
  // Datasets API
  rest.get('https://api.dataflowhub.ai/v1/datasets', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        datasets: sampleDatasets
      })
    );
  }),
  
  rest.get('https://api.dataflowhub.ai/v1/datasets/:id', (req, res, ctx) => {
    const { id } = req.params;
    const dataset = sampleDatasets.find(d => d.id === id);
    
    if (!dataset) {
      return res(
        ctx.status(404),
        ctx.json({
          error: 'Dataset not found'
        })
      );
    }
    
    return res(
      ctx.status(200),
      ctx.json(dataset)
    );
  }),
  
  rest.post('https://api.dataflowhub.ai/v1/datasets', async (req, res, ctx) => {
    const { name, description } = await req.json();
    
    return res(
      ctx.status(201),
      ctx.json({
        id: `dataset-${Date.now()}`,
        name,
        description,
        rows: 100,
        columns: 5,
        dateUploaded: new Date().toISOString(),
        fileType: 'csv',
        fileSize: '10KB',
        projectId: 'project-1'
      })
    );
  }),
  
  // Models API
  rest.get('https://api.dataflowhub.ai/v1/models', (req, res, ctx) => {
    const status = req.url.searchParams.get('status');
    
    let filteredModels = sampleModels;
    if (status && status !== 'all') {
      filteredModels = sampleModels.filter(m => m.status === status);
    }
    
    return res(
      ctx.status(200),
      ctx.json({
        models: filteredModels
      })
    );
  }),
  
  rest.get('https://api.dataflowhub.ai/v1/models/:id', (req, res, ctx) => {
    const { id } = req.params;
    const model = sampleModels.find(m => m.id === id);
    
    if (!model) {
      return res(
        ctx.status(404),
        ctx.json({
          error: 'Model not found'
        })
      );
    }
    
    return res(
      ctx.status(200),
      ctx.json(model)
    );
  }),
  
  rest.post('https://api.dataflowhub.ai/v1/models/predict', async (req, res, ctx) => {
    const { model_id, data } = await req.json();
    
    // Simulate prediction
    return res(
      ctx.status(200),
      ctx.json({
        prediction: Math.random() > 0.5 ? [0.8, 0.2] : [0.3, 0.7],
        confidence: 0.9,
        model_id,
        timestamp: new Date().toISOString()
      })
    );
  }),
  
  // Training API
  rest.post('https://api.dataflowhub.ai/v1/training', async (req, res, ctx) => {
    const { dataset_id, target_variable, model_type, algorithms } = await req.json();
    
    return res(
      ctx.status(202),
      ctx.json({
        id: `training-${Date.now()}`,
        status: 'pending',
        dataset_id,
        target_variable,
        model_type,
        algorithms,
        created_at: new Date().toISOString()
      })
    );
  }),
  
  // Deployment API
  rest.post('https://api.dataflowhub.ai/v1/deployments', async (req, res, ctx) => {
    const { model_id, config } = await req.json();
    
    return res(
      ctx.status(202),
      ctx.json({
        id: `deploy-${Date.now()}`,
        status: 'pending',
        model_id,
        config,
        created_at: new Date().toISOString()
      })
    );
  }),
  
  // Monitoring API
  rest.get('https://api.dataflowhub.ai/v1/monitoring/:model_id', (req, res, ctx) => {
    const { model_id } = req.params;
    
    return res(
      ctx.status(200),
      ctx.json({
        model_id,
        performance: [
          {
            timestamp: new Date(Date.now() - 3600000).toISOString(),
            metrics: {
              accuracy: 0.85,
              latency: 45
            }
          },
          {
            timestamp: new Date().toISOString(),
            metrics: {
              accuracy: 0.83,
              latency: 48
            }
          }
        ],
        drift_detected: false,
        prediction_count: 1250,
        last_updated: new Date().toISOString()
      })
    );
  })
];

// Create server
export const server = setupServer(...handlers);