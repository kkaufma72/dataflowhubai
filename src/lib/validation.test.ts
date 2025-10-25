import { describe, it, expect } from 'vitest';
import { 
  emailSchema, 
  passwordSchema, 
  nameSchema, 
  urlSchema,
  validateForm,
  modelTrainingSchema
} from './validation';

describe('Validation Schemas', () => {
  describe('emailSchema', () => {
    it('validates correct email addresses', () => {
      expect(emailSchema.safeParse('user@example.com').success).toBe(true);
      expect(emailSchema.safeParse('user.name+tag@example.co.uk').success).toBe(true);
    });

    it('rejects invalid email addresses', () => {
      expect(emailSchema.safeParse('user@').success).toBe(false);
      expect(emailSchema.safeParse('user@example').success).toBe(false);
      expect(emailSchema.safeParse('user example.com').success).toBe(false);
      expect(emailSchema.safeParse('').success).toBe(false);
    });
  });

  describe('passwordSchema', () => {
    it('validates strong passwords', () => {
      expect(passwordSchema.safeParse('Password123').success).toBe(true);
      expect(passwordSchema.safeParse('StrongP@ssw0rd').success).toBe(true);
    });

    it('rejects weak passwords', () => {
      expect(passwordSchema.safeParse('pass').success).toBe(false); // too short
      expect(passwordSchema.safeParse('password').success).toBe(false); // no uppercase
      expect(passwordSchema.safeParse('PASSWORD').success).toBe(false); // no lowercase
      expect(passwordSchema.safeParse('Password').success).toBe(false); // no number
    });
  });

  describe('nameSchema', () => {
    it('validates valid names', () => {
      expect(nameSchema.safeParse('John').success).toBe(true);
      expect(nameSchema.safeParse('John Doe').success).toBe(true);
      expect(nameSchema.safeParse('John-Doe').success).toBe(true);
    });

    it('rejects invalid names', () => {
      expect(nameSchema.safeParse('J').success).toBe(false); // too short
      expect(nameSchema.safeParse('').success).toBe(false); // empty
      expect(nameSchema.safeParse('A'.repeat(51)).success).toBe(false); // too long
    });
  });

  describe('urlSchema', () => {
    it('validates valid URLs', () => {
      expect(urlSchema.safeParse('https://example.com').success).toBe(true);
      expect(urlSchema.safeParse('http://localhost:3000').success).toBe(true);
      expect(urlSchema.safeParse('https://sub.domain.co.uk/path?query=1').success).toBe(true);
    });

    it('rejects invalid URLs', () => {
      expect(urlSchema.safeParse('example.com').success).toBe(false); // missing protocol
      expect(urlSchema.safeParse('not a url').success).toBe(false);
      expect(urlSchema.safeParse('').success).toBe(false);
    });
  });

  describe('modelTrainingSchema', () => {
    it('validates valid model training config', () => {
      const validConfig = {
        datasetId: 'dataset-123',
        targetVariable: 'target',
        modelType: 'classification',
        trainTestSplit: 0.8,
        hyperparameterTuning: true,
        optimizationMetric: 'accuracy',
        algorithms: ['random_forest', 'xgboost'],
        crossValidation: {
          enabled: true,
          folds: 5,
          stratified: true
        }
      };
      
      expect(modelTrainingSchema.safeParse(validConfig).success).toBe(true);
    });

    it('rejects invalid model training config', () => {
      const invalidConfig = {
        // missing datasetId
        targetVariable: 'target',
        modelType: 'invalid_type', // invalid model type
        trainTestSplit: 0.3, // too low
        hyperparameterTuning: true,
        optimizationMetric: 'accuracy',
        algorithms: [] // empty algorithms
      };
      
      const result = modelTrainingSchema.safeParse(invalidConfig);
      expect(result.success).toBe(false);
    });
  });

  describe('validateForm', () => {
    it('returns success and data for valid input', () => {
      const schema = nameSchema;
      const data = 'John Doe';
      
      const result = validateForm(schema, data);
      expect(result.success).toBe(true);
      expect(result.data).toBe('John Doe');
      expect(result.errors).toBeUndefined();
    });

    it('returns errors for invalid input', () => {
      const schema = nameSchema;
      const data = '';
      
      const result = validateForm(schema, data);
      expect(result.success).toBe(false);
      expect(result.data).toBeUndefined();
      expect(result.errors).toBeDefined();
    });
  });
});