import React, { useState } from 'react';
import { Card } from '../common/Card';
import { 
  Split, 
  BarChart2, 
  Users, 
  ArrowRight, 
  Check, 
  X, 
  AlertCircle,
  Play,
  Pause,
  Clock,
  Flag
} from 'lucide-react';
import Button from '../common/Button';
import { MLModel } from '../../types';
import { Bar } from 'react-chartjs-2';
import toast from 'react-hot-toast';

interface ABTest {
  id: string;
  name: string;
  status: 'draft' | 'running' | 'completed' | 'stopped';
  startDate?: string;
  endDate?: string;
  variants: {
    id: string;
    name: string;
    modelId: string;
    trafficPercentage: number;
    metrics: {
      accuracy: number;
      latency: number;
      conversionRate: number;
    };
  }[];
  targetMetric: 'accuracy' | 'latency' | 'conversionRate';
  description?: string;
}

interface ABTestingPanelProps {
  model: MLModel;
}

const ABTestingPanel: React.FC<ABTestingPanelProps> = ({ model }) => {
  const [tests, setTests] = useState<ABTest[]>([
    {
      id: '1',
      name: 'Production vs. New Model',
      status: 'running',
      startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
      variants: [
        {
          id: 'a',
          name: 'Control (Current)',
          modelId: model.id,
          trafficPercentage: 50,
          metrics: {
            accuracy: 0.82,
            latency: 45,
            conversionRate: 0.12
          }
        },
        {
          id: 'b',
          name: 'Variant (New)',
          modelId: 'new-model-id',
          trafficPercentage: 50,
          metrics: {
            accuracy: 0.87,
            latency: 52,
            conversionRate: 0.14
          }
        }
      ],
      targetMetric: 'accuracy',
      description: 'Testing a new model with improved feature engineering'
    }
  ]);
  const [showNewTestForm, setShowNewTestForm] = useState(false);
  const [newTest, setNewTest] = useState<Partial<ABTest>>({
    name: '',
    variants: [
      {
        id: 'a',
        name: 'Control',
        modelId: model.id,
        trafficPercentage: 50,
        metrics: {
          accuracy: 0,
          latency: 0,
          conversionRate: 0
        }
      },
      {
        id: 'b',
        name: 'Variant',
        modelId: '',
        trafficPercentage: 50,
        metrics: {
          accuracy: 0,
          latency: 0,
          conversionRate: 0
        }
      }
    ],
    targetMetric: 'accuracy',
    description: ''
  });

  const handleCreateTest = () => {
    if (!newTest.name) {
      toast.error('Please provide a test name');
      return;
    }
    
    if (!newTest.variants?.[1].modelId) {
      toast.error('Please select a variant model');
      return;
    }
    
    const test: ABTest = {
      id: Date.now().toString(),
      name: newTest.name || 'New A/B Test',
      status: 'draft',
      variants: newTest.variants as ABTest['variants'],
      targetMetric: newTest.targetMetric as 'accuracy' | 'latency' | 'conversionRate',
      description: newTest.description
    };
    
    setTests([...tests, test]);
    setShowNewTestForm(false);
    setNewTest({
      name: '',
      variants: [
        {
          id: 'a',
          name: 'Control',
          modelId: model.id,
          trafficPercentage: 50,
          metrics: {
            accuracy: 0,
            latency: 0,
            conversionRate: 0
          }
        },
        {
          id: 'b',
          name: 'Variant',
          modelId: '',
          trafficPercentage: 50,
          metrics: {
            accuracy: 0,
            latency: 0,
            conversionRate: 0
          }
        }
      ],
      targetMetric: 'accuracy',
      description: ''
    });
    
    toast.success('A/B test created successfully');
  };

  const handleStartTest = (testId: string) => {
    setTests(tests.map(test => 
      test.id === testId 
        ? { 
            ...test, 
            status: 'running', 
            startDate: new Date().toISOString() 
          } 
        : test
    ));
    toast.success('A/B test started');
  };

  const handleStopTest = (testId: string) => {
    setTests(tests.map(test => 
      test.id === testId 
        ? { 
            ...test, 
            status: 'stopped', 
            endDate: new Date().toISOString() 
          } 
        : test
    ));
    toast.success('A/B test stopped');
  };

  const handleCompleteTest = (testId: string) => {
    setTests(tests.map(test => 
      test.id === testId 
        ? { 
            ...test, 
            status: 'completed', 
            endDate: new Date().toISOString() 
          } 
        : test
    ));
    toast.success('A/B test completed');
  };

  const handleDeleteTest = (testId: string) => {
    setTests(tests.filter(test => test.id !== testId));
    toast.success('A/B test deleted');
  };

  const getTestResultsChartData = (test: ABTest) => {
    return {
      labels: test.variants.map(v => v.name),
      datasets: [
        {
          label: 'Accuracy',
          data: test.variants.map(v => v.metrics.accuracy * 100),
          backgroundColor: 'rgba(79, 70, 229, 0.7)',
          borderWidth: 1,
        },
        {
          label: 'Conversion Rate (%)',
          data: test.variants.map(v => v.metrics.conversionRate * 100),
          backgroundColor: 'rgba(16, 185, 129, 0.7)',
          borderWidth: 1,
        }
      ]
    };
  };

  const getTestLatencyChartData = (test: ABTest) => {
    return {
      labels: test.variants.map(v => v.name),
      datasets: [
        {
          label: 'Response Time (ms)',
          data: test.variants.map(v => v.metrics.latency),
          backgroundColor: 'rgba(245, 158, 11, 0.7)',
          borderWidth: 1,
        }
      ]
    };
  };

  const getTestDuration = (test: ABTest) => {
    if (!test.startDate) return 'Not started';
    
    const start = new Date(test.startDate);
    const end = test.endDate ? new Date(test.endDate) : new Date();
    
    const diffMs = end.getTime() - start.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (diffDays > 0) {
      return `${diffDays}d ${diffHours}h`;
    } else {
      return `${diffHours}h`;
    }
  };

  const getWinningVariant = (test: ABTest) => {
    if (test.status !== 'completed') return null;
    
    const metric = test.targetMetric;
    let bestVariantIndex = 0;
    let bestValue = test.variants[0].metrics[metric];
    
    for (let i = 1; i < test.variants.length; i++) {
      const value = test.variants[i].metrics[metric];
      
      if (metric === 'latency') {
        // For latency, lower is better
        if (value < bestValue) {
          bestValue = value;
          bestVariantIndex = i;
        }
      } else {
        // For accuracy and conversion rate, higher is better
        if (value > bestValue) {
          bestValue = value;
          bestVariantIndex = i;
        }
      }
    }
    
    return test.variants[bestVariantIndex];
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-700">A/B Testing</h3>
        <Button
          onClick={() => setShowNewTestForm(!showNewTestForm)}
          icon={showNewTestForm ? <X className="w-4 h-4" /> : <Split className="w-4 h-4" />}
        >
          {showNewTestForm ? 'Cancel' : 'New A/B Test'}
        </Button>
      </div>

      {showNewTestForm && (
        <Card>
          <h3 className="text-sm font-medium text-gray-700 mb-4">Create New A/B Test</h3>
          <div className="space-y-4">
            <div>
              <label htmlFor="test-name" className="block text-sm font-medium text-gray-700">
                Test Name
              </label>
              <input
                type="text"
                id="test-name"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                value={newTest.name}
                onChange={(e) => setNewTest({ ...newTest, name: e.target.value })}
                placeholder="e.g., Production vs. New Model"
              />
            </div>
            
            <div>
              <label htmlFor="test-description" className="block text-sm font-medium text-gray-700">
                Description (Optional)
              </label>
              <textarea
                id="test-description"
                rows={2}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                value={newTest.description}
                onChange={(e) => setNewTest({ ...newTest, description: e.target.value })}
                placeholder="Describe the purpose of this test"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Target Metric
              </label>
              <select
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                value={newTest.targetMetric}
                onChange={(e) => setNewTest({ ...newTest, targetMetric: e.target.value as any })}
              >
                <option value="accuracy">Accuracy</option>
                <option value="latency">Response Time</option>
                <option value="conversionRate">Conversion Rate</option>
              </select>
            </div>
            
            <div className="border-t border-gray-200 pt-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Variants</h4>
              
              <div className="space-y-4">
                {/* Control Variant */}
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="text-sm font-medium text-gray-900">Control (Current Model)</h5>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      50% Traffic
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">
                    {model.name}
                  </p>
                </div>
                
                {/* Test Variant */}
                <div className="p-4 bg-primary/5 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="text-sm font-medium text-primary-900">Variant (New Model)</h5>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary-800">
                      50% Traffic
                    </span>
                  </div>
                  <select
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                    value={newTest.variants?.[1].modelId}
                    onChange={(e) => {
                      const variants = [...(newTest.variants || [])];
                      variants[1] = { ...variants[1], modelId: e.target.value };
                      setNewTest({ ...newTest, variants });
                    }}
                  >
                    <option value="">Select a model</option>
                    <option value="new-model-1">Improved Random Forest</option>
                    <option value="new-model-2">XGBoost Classifier</option>
                    <option value="new-model-3">Neural Network</option>
                  </select>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end pt-4">
              <Button
                onClick={handleCreateTest}
                icon={<Check className="w-4 h-4" />}
              >
                Create Test
              </Button>
            </div>
          </div>
        </Card>
      )}

      {tests.length === 0 && !showNewTestForm ? (
        <Card>
          <div className="text-center py-8">
            <Split className="mx-auto h-12 w-12 text-gray-300" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No A/B tests</h3>
            <p className="mt-1 text-sm text-gray-500">
              Create your first A/B test to compare model performance.
            </p>
            <div className="mt-6">
              <Button
                onClick={() => setShowNewTestForm(true)}
                icon={<Split className="w-4 h-4" />}
              >
                New A/B Test
              </Button>
            </div>
          </div>
        </Card>
      ) : (
        <div className="space-y-6">
          {tests.map((test) => (
            <Card key={test.id}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-lg ${
                    test.status === 'running' 
                      ? 'bg-green-100' 
                      : test.status === 'completed' 
                      ? 'bg-blue-100' 
                      : test.status === 'stopped' 
                      ? 'bg-amber-100' 
                      : 'bg-gray-100'
                  }`}>
                    {test.status === 'running' ? (
                      <Play className="w-6 h-6 text-green-600" />
                    ) : test.status === 'completed' ? (
                      <Flag className="w-6 h-6 text-blue-600" />
                    ) : test.status === 'stopped' ? (
                      <Pause className="w-6 h-6 text-amber-600" />
                    ) : (
                      <Clock className="w-6 h-6 text-gray-600" />
                    )}
                  </div>
                  <div className="ml-4">
                    <h3 className="text-sm font-medium text-gray-900">{test.name}</h3>
                    <div className="flex items-center mt-1">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        test.status === 'running' 
                          ? 'bg-green-100 text-green-800' 
                          : test.status === 'completed' 
                          ? 'bg-blue-100 text-blue-800' 
                          : test.status === 'stopped' 
                          ? 'bg-amber-100 text-amber-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {test.status.charAt(0).toUpperCase() + test.status.slice(1)}
                      </span>
                      {test.startDate && (
                        <span className="ml-2 text-xs text-gray-500">
                          Duration: {getTestDuration(test)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex space-x-2">
                  {test.status === 'draft' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleStartTest(test.id)}
                      icon={<Play className="w-4 h-4" />}
                    >
                      Start
                    </Button>
                  )}
                  {test.status === 'running' && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleStopTest(test.id)}
                        icon={<Pause className="w-4 h-4" />}
                      >
                        Stop
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCompleteTest(test.id)}
                        icon={<Flag className="w-4 h-4" />}
                      >
                        Complete
                      </Button>
                    </>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteTest(test.id)}
                    icon={<X className="w-4 h-4" />}
                  >
                    Delete
                  </Button>
                </div>
              </div>
              
              {test.description && (
                <p className="text-sm text-gray-500 mb-4">{test.description}</p>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-4">Performance Comparison</h4>
                  <div className="h-64">
                    <Bar 
                      data={getTestResultsChartData(test)} 
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            position: 'top' as const,
                          },
                        },
                        scales: {
                          y: {
                            beginAtZero: true,
                          }
                        }
                      }} 
                    />
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-4">Response Time</h4>
                  <div className="h-64">
                    <Bar 
                      data={getTestLatencyChartData(test)} 
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            position: 'top' as const,
                          },
                        },
                        scales: {
                          y: {
                            beginAtZero: true,
                          }
                        }
                      }} 
                    />
                  </div>
                </div>
              </div>
              
              <div className="mt-6 border-t border-gray-200 pt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-4">Test Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h5 className="text-xs font-medium text-gray-500 uppercase">Variants</h5>
                    <div className="mt-2 space-y-2">
                      {test.variants.map((variant) => (
                        <div key={variant.id} className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className={`w-3 h-3 rounded-full ${
                              variant.id === 'a' ? 'bg-blue-500' : 'bg-primary'
                            }`}></div>
                            <span className="ml-2 text-sm text-gray-900">{variant.name}</span>
                          </div>
                          <span className="text-sm text-gray-500">{variant.trafficPercentage}% traffic</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h5 className="text-xs font-medium text-gray-500 uppercase">Target Metric</h5>
                    <p className="mt-2 text-sm text-gray-900">
                      {test.targetMetric === 'accuracy' 
                        ? 'Accuracy' 
                        : test.targetMetric === 'latency' 
                        ? 'Response Time' 
                        : 'Conversion Rate'}
                    </p>
                    
                    {test.status === 'completed' && (
                      <>
                        <h5 className="text-xs font-medium text-gray-500 uppercase mt-4">Result</h5>
                        <div className="mt-2 p-3 bg-green-50 rounded-lg">
                          <div className="flex items-center">
                            <Check className="w-5 h-5 text-green-500 mr-2" />
                            <div>
                              <p className="text-sm font-medium text-green-800">
                                {getWinningVariant(test)?.name} is the winner
                              </p>
                              <p className="text-xs text-green-700">
                                {test.targetMetric === 'accuracy' 
                                  ? `${(getWinningVariant(test)?.metrics.accuracy || 0) * 100}% accuracy` 
                                  : test.targetMetric === 'latency' 
                                  ? `${getWinningVariant(test)?.metrics.latency || 0}ms response time` 
                                  : `${(getWinningVariant(test)?.metrics.conversionRate || 0) * 100}% conversion rate`}
                              </p>
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default ABTestingPanel;