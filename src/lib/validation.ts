import { z } from 'zod';

// Common validation schemas
export const emailSchema = z
  .string()
  .email('Please enter a valid email address');

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

export const nameSchema = z
  .string()
  .min(2, 'Name must be at least 2 characters')
  .max(50, 'Name must be less than 50 characters');

export const urlSchema = z
  .string()
  .url('Please enter a valid URL');

// Model training form schema
export const modelTrainingSchema = z.object({
  datasetId: z.string().min(1, 'Please select a dataset'),
  targetVariable: z.string().min(1, 'Please select a target variable'),
  modelType: z.enum(['classification', 'regression'], {
    errorMap: () => ({ message: 'Please select a valid model type' }),
  }),
  trainTestSplit: z.number().min(0.5).max(0.95),
  hyperparameterTuning: z.boolean(),
  optimizationMetric: z.string().min(1, 'Please select an optimization metric'),
  algorithms: z.array(z.string()).min(1, 'Please select at least one algorithm'),
  crossValidation: z.object({
    enabled: z.boolean(),
    folds: z.number().int().min(2).max(10),
    stratified: z.boolean(),
  }).optional(),
});

// Dataset upload schema
export const datasetUploadSchema = z.object({
  name: z.string().min(1, 'Dataset name is required'),
  description: z.string().optional(),
  file: z.instanceof(File, { message: 'Please select a file' })
    .refine(file => file.size <= 100 * 1024 * 1024, 'File size must be less than 100MB')
    .refine(
      file => ['text/csv', 'application/vnd.ms-excel', 'application/json', 'text/css'].includes(file.type),
      'File must be CSV, Excel, JSON, or CSS'
    ),
});

// API key creation schema
export const apiKeySchema = z.object({
  name: z.string().min(1, 'API key name is required').max(50, 'API key name must be less than 50 characters'),
  expiresIn: z.number().int().min(1, 'Expiration must be at least 1 day').optional(),
  scopes: z.array(z.string()).optional(),
});

// Deployment configuration schema
export const deploymentConfigSchema = z.object({
  modelId: z.string().min(1, 'Please select a model'),
  endpoint: z.string().min(1, 'Endpoint path is required'),
  scalingOptions: z.object({
    minInstances: z.number().int().min(1, 'Minimum instances must be at least 1'),
    maxInstances: z.number().int().min(1, 'Maximum instances must be at least 1'),
  }),
  authentication: z.enum(['api_key', 'oauth', 'none']),
});

// Validation helper function
export const validateForm = <T>(schema: z.ZodType<T>, data: unknown): { 
  success: boolean; 
  data?: T; 
  errors?: Record<string, string>;
} => {
  try {
    const validatedData = schema.parse(data);
    return { success: true, data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: Record<string, string> = {};
      error.errors.forEach((err) => {
        const path = err.path.join('.');
        errors[path] = err.message;
      });
      return { success: false, errors };
    }
    return { 
      success: false, 
      errors: { _form: 'An unexpected error occurred during validation' } 
    };
  }
};