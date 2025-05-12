import React, { useState, useEffect } from 'react';
import { Card } from '../common/Card';
import { 
  Check, 
  AlertTriangle, 
  X, 
  RefreshCw, 
  Filter, 
  Eye, 
  EyeOff, 
  Clock, 
  BarChart2,
  Sliders,
  Save,
  Plus,
  Edit,
  Trash2,
  Download
} from 'lucide-react';
import Button from '../common/Button';
import { Dataset } from '../../types';
import toast from 'react-hot-toast';

interface QualityRule {
  id: string;
  name: string;
  description: string;
  type: 'completeness' | 'uniqueness' | 'consistency' | 'accuracy' | 'timeliness' | 'custom';
  column: string;
  condition: string;
  severity: 'info' | 'warning' | 'error';
  enabled: boolean;
}

interface QualityCheckResult {
  ruleId: string;
  passed: boolean;
  message: string;
  affectedRows: number;
  timestamp: string;
}

interface DataQualityChecksProps {
  dataset: Dataset;
  onUpdateDataset?: (updatedDataset: Dataset) => void;
}

const DataQualityChecks: React.FC<DataQualityChecksProps> = ({
  dataset,
  onUpdateDataset
}) => {
  const [rules, setRules] = useState<QualityRule[]>([
    {
      id: '1',
      name: 'Age Range',
      field: 'age',
      type: 'completeness',
      condition: 'NOT_NULL',
      severity: 'warning',
      enabled: true
    },
    {
      id: '2',
      name: 'Email Format',
      field: 'email',
      type: 'consistency',
      condition: 'email',
      severity: 'warning',
      enabled: true
    },
    {
      id: '3',
      name: 'Required Fields',
      field: 'name',
      type: 'completeness',
      condition: 'not_null',
      severity: 'error',
      enabled: true
    }
  ]);
  
  const [results, setResults] = useState<QualityCheckResult[]>([]);
  const [isValidating, setIsValidating] = useState(false);
  const [showAddRule, setShowAddRule] = useState(false);
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const [newRule, setNewRule] = useState<Partial<QualityRule>>({
    name: '',
    description: '',
    type: 'completeness',
    column: '',
    condition: '',
    severity: 'warning',
    enabled: true
  });
  const [showOnlyFailed, setShowOnlyFailed] = useState(false);
  const [qualityScore, setQualityScore] = useState<number | null>(null);
  const [validationResults, setValidationResults] = useState<{
    passed: number;
    failed: number;
    details: Array<{
      rule: string;
      status: 'passed' | 'failed';
      message: string;
    }>;
  }>({
    passed: 0,
    failed: 0,
    details: []
  });

  // Initialize with some default rules based on dataset
  useEffect(() => {
    if (dataset && dataset.previewData?.columns) {
      const defaultRules: QualityRule[] = [];
      
      // Add completeness rule for each column
      dataset.previewData.columns.forEach(column => {
        // Skip ID columns for completeness checks
        if (!column.toLowerCase().includes('id')) {
          defaultRules.push({
            id: `completeness-${column}-${Date.now()}`,
            name: `${column} Completeness`,
            description: `Check for missing values in ${column}`,
            type: 'completeness',
            column,
            condition: 'NOT_NULL',
            severity: 'warning',
            enabled: true
          });
        }
      });
      
      // Add uniqueness rule for ID columns
      const idColumns = dataset.previewData.columns.filter(column => 
        column.toLowerCase().includes('id')
      );
      
      idColumns.forEach(column => {
        defaultRules.push({
          id: `uniqueness-${column}-${Date.now()}`,
          name: `${column} Uniqueness`,
          description: `Check for unique values in ${column}`,
          type: 'uniqueness',
          column,
          condition: 'UNIQUE',
          severity: 'error',
          enabled: true
        });
      });
      
      // Add some consistency rules for specific column types
      const dateColumns = dataset.previewData.columns.filter(column => 
        column.toLowerCase().includes('date') || 
        column.toLowerCase().includes('time')
      );
      
      dateColumns.forEach(column => {
        defaultRules.push({
          id: `consistency-${column}-${Date.now()}`,
          name: `${column} Date Format`,
          description: `Check for consistent date format in ${column}`,
          type: 'consistency',
          column,
          condition: 'IS_DATE',
          severity: 'warning',
          enabled: true
        });
      });
      
      // Add some accuracy rules for numeric columns
      const numericColumns = dataset.previewData.columns.filter((column, index) => {
        // Check if most values in this column are numeric
        const values = dataset.previewData!.rows.map(row => row[index]);
        const numericCount = values.filter(value => !isNaN(Number(value))).length;
        return numericCount / values.length > 0.8;
      });
      
      numericColumns.forEach(column => {
        defaultRules.push({
          id: `accuracy-${column}-${Date.now()}`,
          name: `${column} Range Check`,
          description: `Check if ${column} values are within expected range`,
          type: 'accuracy',
          column,
          condition: 'IN_RANGE(0, 1000)',
          severity: 'warning',
          enabled: true
        });
      });
      
      setRules(defaultRules);
    }
  }, [dataset]);

  const handleAddRule = () => {
    if (!newRule.name || !newRule.column || !newRule.condition) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    const rule: QualityRule = {
      id: editingRuleId || `rule-${Date.now()}`,
      name: newRule.name!,
      description: newRule.description || '',
      type: newRule.type as 'completeness' | 'uniqueness' | 'consistency' | 'accuracy' | 'timeliness' | 'custom',
      column: newRule.column!,
      condition: newRule.condition!,
      severity: newRule.severity as 'info' | 'warning' | 'error',
      enabled: newRule.enabled !== undefined ? newRule.enabled : true
    };
    
    if (editingRuleId) {
      // Update existing rule
      setRules(rules.map(r => r.id === editingRuleId ? rule : r));
      toast.success('Rule updated successfully');
    } else {
      // Add new rule
      setRules([...rules, rule]);
      toast.success('Rule added successfully');
    }
    
    setNewRule({
      name: '',
      description: '',
      type: 'completeness',
      column: '',
      condition: '',
      severity: 'warning',
      enabled: true
    });
    setShowAddRule(false);
    setEditingRuleId(null);
  };

  const handleEditRule = (rule: QualityRule) => {
    setNewRule(rule);
    setEditingRuleId(rule.id);
    setShowAddRule(true);
  };

  const handleDeleteRule = (ruleId: string) => {
    setRules(rules.filter(rule => rule.id !== ruleId));
    
    toast.success('Rule deleted');
  };

  const handleToggleRule = (ruleId: string) => {
    setRules(prev => prev.map(rule => 
      rule.id === ruleId ? { ...rule, enabled: !rule.enabled } : rule
    ));
  };

  const validateData = () => {
    setIsValidating(true);

    // Simulate data validation
    setTimeout(() => {
      const results = {
        passed: Math.floor(Math.random() * 950) + 50,
        failed: Math.floor(Math.random() * 50),
        details: rules
          .filter(rule => rule.enabled)
          .map(rule => ({
            rule: rule.name,
            status: Math.random() > 0.1 ? 'passed' : 'failed',
            message: `Validated ${rule.column} against ${rule.condition}`
          })) as Array<{ rule: string; status: 'passed' | 'failed'; message: string }>
      };

      setValidationResults(results);
      setIsValidating(false);
    }, 2000);
  };

  const getSeverityColor = (severity: 'info' | 'warning' | 'error') => {
    switch (severity) {
      case 'info':
        return 'bg-blue-100 text-blue-800';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getResultIcon = (passed: boolean) => {
    return passed ? (
      <Check className="w-5 h-5 text-green-500" />
    ) : (
      <X className="w-5 h-5 text-red-500" />
    );
  };

  const filteredResults = showOnlyFailed 
    ? results.filter(result => !result.passed)
    : results;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-medium text-gray-900">Data Validation Rules</h2>
          <p className="mt-1 text-sm text-gray-500">
            Configure and manage data validation rules
          </p>
        </div>
        <Button
          onClick={validateData}
          disabled={isValidating}
          icon={isValidating ? <RefreshCw className="w-4 h-4 animate-spin" /> : undefined}
        >
          {isValidating ? 'Validating...' : 'Run Validation'}
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h3 className="text-sm font-medium text-gray-700">Validation Rules</h3>
          <div className="mt-4 space-y-4">
            {rules.map((rule) => (
              <div
                key={rule.id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">{rule.name}</p>
                  <p className="mt-1 text-sm text-gray-500">
                    {rule.column}: {rule.condition}
                  </p>
                </div>
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => handleToggleRule(rule.id)}
                    className={`relative inline-flex flex-shrink-0 h-6 transition-colors duration-200 ease-in-out border-2 border-transparent rounded-full cursor-pointer w-11 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                      rule.enabled ? 'bg-indigo-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`${
                        rule.enabled ? 'translate-x-5' : 'translate-x-0'
                      } inline-block w-5 h-5 transform bg-white rounded-full transition-transform`}
                    ></span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {results.length > 0 && (
          <Card>
            <h3 className="text-sm font-medium text-gray-700">Validation Results</h3>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="p-4 bg-green-50 rounded-lg">
                <div className="flex items-center">
                  <Check className="w-5 h-5 text-green-500" />
                  <span className="ml-2 text-sm font-medium text-green-700">
                    Passed: {results.filter(r => r.passed).length}
                  </span>
                </div>
              </div>
              <div className="p-4 bg-red-50 rounded-lg">
                <div className="flex items-center">
                  <X className="w-5 h-5 text-red-500" />
                  <span className="ml-2 text-sm font-medium text-red-700">
                    Failed: {results.filter(r => !r.passed).length}
                  </span>
                </div>
              </div>
            </div>
            <div className="mt-4 space-y-4">
              {filteredResults.map((result, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg ${
                    result.passed ? 'bg-green-50' : 'bg-red-50'
                  }`}
                >
                  <div className="flex items-center">
                    {result.passed ? (
                      <Check className="w-5 h-5 text-green-500" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-red-500" />
                    )}
                    <div className="ml-3">
                      <p
                        className={`text-sm font-medium ${
                          result.passed ? 'text-green-800' : 'text-red-800'
                        }`}
                      >
                        {result.rule}
                      </p>
                      <p
                        className={`mt-1 text-sm ${
                          result.passed ? 'text-green-700' : 'text-red-700'
                        }`}
                      >
                        {result.message}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default DataQualityChecks;