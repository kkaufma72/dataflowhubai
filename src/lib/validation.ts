
import { z } from 'zod';

export const emailSchema = z.string().email();
export const passwordSchema = z.string().min(8).regex(/[a-z]/).regex(/[A-Z]/).regex(/[0-9]/);
export const nameSchema = z.string().min(2).max(50);
export const urlSchema = z.string().url();

export const modelTrainingSchema = z.object({
  datasetId: z.string(),
  targetVariable: z.string(),
  modelType: z.enum(['classification', 'regression']),
  trainTestSplit: z.number().min(0.5).max(0.9),
  hyperparameterTuning: z.boolean(),
  optimizationMetric: z.string(),
  algorithms: z.array(z.string()).min(1),
  crossValidation: z.object({
    enabled: z.boolean(),
    folds: z.number().min(2).max(10),
    stratified: z.boolean()
  }).optional()
});

export const validateForm = (schema: z.ZodSchema<any>, data: any) => {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  } else {
    return { success: false, errors: result.error.flatten().fieldErrors };
  }
};
