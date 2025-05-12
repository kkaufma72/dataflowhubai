@@ .. @@
 
   const swaggerSpec = {
     openapi: '3.0.0',
     info: {
-      title: 'AutoML Platform API',
+      title: 'DataFlowHub AI API',
       version: '1.0.0',
-      description: 'API documentation for the AutoML Platform'
+      description: 'API documentation for the DataFlowHub AI Platform'
     },
     servers: [
       {
-        url: 'https://api.automl-platform.com/v1',
+        url: 'https://api.dataflowhub.ai/v1',
         description: 'Production server'
       }
     ],
     paths: {
       '/models/predict': {
         post: {
           summary: 'Make predictions using a deployed model',
           requestBody: {
             required: true,
             content: {
               'application/json': {
                 schema: {
                   type: 'object',
                   properties: {
                     model_id: { type: 'string' },
                     data: { type: 'object' }
                   }
                 }
               }
             }
           },
           responses: {
             '200': {
               description: 'Successful prediction',
               content: {
                 'application/json': {
                   schema: {
                     type: 'object',
                     properties: {
                       prediction: { type: 'array' },
                       confidence: { type: 'number' }
                     }
                   }
                 }
               }
             },
             '400': {
               description: 'Bad request',
               content: {
                 'application/json': {
                   schema: {
                     type: 'object',
                     properties: {
                       error: { type: 'string' }
                     }
                   }
                 }
               }
             },
             '401': {
               description: 'Unauthorized',
               content: {
                 'application/json': {
                   schema: {
                     type: 'object',
                     properties: {
                       error: { type: 'string' }
                     }
                   }
                 }
               }
             },
             '500': {
               description: 'Server error',
               content: {
                 'application/json': {
                   schema: {
                     type: 'object',
                     properties: {
                       error: { type: 'string' }
                     }
                   }
                 }
               }
             }
           }
         }
       },
       '/models': {
         get: {
           summary: 'List all models',
           parameters: [
             {
               name: 'status',
               in: 'query',
               schema: {
                 type: 'string',
                 enum: ['trained', 'deployed', 'all']
               },
               description: 'Filter models by status'
             }
           ],
           responses: {
             '200': {
               description: 'List of models',
               content: {
                 'application/json': {
                   schema: {
                     type: 'array',
                     items: {
                       type: 'object',
                       properties: {
                         id: { type: 'string' },
                         name: { type: 'string' },
                         status: { type: 'string' },
                         created_at: { type: 'string', format: 'date-time' }
                       }
                     }
                   }
                 }
               }
             }
           }
         }
       }
     }
   };