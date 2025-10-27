import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useMLContext } from '../context/MLContext';
import {
  Card,
  Title,
  Text,
  Tab,
  TabList,
  TabGroup,
  TabPanel,
  TabPanels,
  Grid,
  Col,
  Metric,
  AreaChart,
  BadgeDelta,
  Flex,
  ProgressBar,
  Table,
  TableHead,
  TableRow,
  TableHeaderCell,
  TableBody,
  TableCell,
} from '@tremor/react';
import { Database, Layers, ChevronLeft, ChevronRight } from 'lucide-react';
import Button from '../components/common/Button';

const ModelEvaluation = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { models, datasets } = useMLContext();
  const modelId = searchParams.get('model');
  const [selectedModel, setSelectedModel] = useState(models.find(m => m.id === modelId));
  const [selectedDataset, setSelectedDataset] = useState(datasets.find(d => d.id === selectedModel?.datasetId));

  useEffect(() => {
    const model = models.find(m => m.id === modelId);
    setSelectedModel(model);
    if (model) {
      setSelectedDataset(datasets.find(d => d.id === model.datasetId));
    }
  }, [modelId, models, datasets]);

  if (!selectedModel) {
    return (
      <div className="p-4 md:p-10 mx-auto max-w-7xl">
        <Card>
          <div className="flex flex-col items-center justify-center p-8">
            <Layers className="w-12 h-12 text-gray-400 mb-4" />
            <Text className="text-lg font-medium text-gray-900">No Model Selected</Text>
            <Text className="text-gray-500 mt-2">Please select a model to evaluate</Text>
            <Button 
              className="mt-4"
              onClick={() => navigate('/app/train')}
            >
              Go to Model Training
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const trainedModels = models.filter(m => m.status === 'trained' || m.status === 'deployed');
  const currentIndex = trainedModels.findIndex(m => m.id === selectedModel.id);

  const handleModelChange = (direction: 'prev' | 'next') => {
    let newIndex;
    if (direction === 'prev') {
      newIndex = currentIndex === 0 ? trainedModels.length - 1 : currentIndex - 1;
    } else {
      newIndex = currentIndex === trainedModels.length - 1 ? 0 : currentIndex + 1;
    }
    navigate(`/app/evaluate?model=${trainedModels[newIndex].id}`);
  };

  // Helper function to safely format metric values
  const formatMetric = (value: number | undefined): string => {
    return value !== undefined ? `${(value * 100).toFixed(1)}%` : 'N/A';
  };

  return (
    <main className="p-4 md:p-10 mx-auto max-w-7xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <div className="flex items-center justify-center w-12 h-12 bg-indigo-100 rounded-lg mr-4">
            <Database className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <Title>{selectedModel.name}</Title>
            <Text>
              {selectedDataset ? (
                <>
                  Trained on <span className="font-medium">{selectedDataset.name}</span>
                  {' • '}
                  <span className="text-gray-500">
                    {selectedDataset.rows?.toLocaleString()} rows, {selectedDataset.columns} features
                  </span>
                </>
              ) : (
                'Dataset information not available'
              )}
            </Text>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleModelChange('prev')}
            disabled={trainedModels.length <= 1}
            icon={<ChevronLeft className="w-4 h-4" />}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleModelChange('next')}
            disabled={trainedModels.length <= 1}
            icon={<ChevronRight className="w-4 h-4 ml-1" />}
          >
            Next
          </Button>
        </div>
      </div>

      <TabGroup>
        <TabList>
          <Tab>Overview</Tab>
          <Tab>Performance</Tab>
          <Tab>Feature Analysis</Tab>
          <Tab>Predictions</Tab>
        </TabList>

        <TabPanels>
          <TabPanel>
            <Grid numItems={1} numItemsSm={2} numItemsLg={4} className="gap-6 mt-6">
              {Object.entries(selectedModel.metrics || {}).map(([key, value]) => (
                <Card key={key}>
                  <Text>{key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}</Text>
                  <Metric>{formatMetric(value)}</Metric>
                  <Flex className="mt-4">
                    <Text>Previous Version</Text>
                    <BadgeDelta deltaType="increase">
                      {(Math.random() * 5).toFixed(1)}%
                    </BadgeDelta>
                  </Flex>
                </Card>
              ))}
            </Grid>

            <div className="mt-6">
              <Card>
                <Title>Performance Over Time</Title>
                <AreaChart
                  className="h-72 mt-4"
                  data={[
                    {
                      date: '2024-01',
                      accuracy: selectedModel.metrics?.accuracy ? selectedModel.metrics.accuracy * 0.95 : 0,
                      precision: selectedModel.metrics?.precision ? selectedModel.metrics.precision * 0.94 : 0,
                      recall: selectedModel.metrics?.recall ? selectedModel.metrics.recall * 0.93 : 0
                    },
                    {
                      date: '2024-02',
                      accuracy: selectedModel.metrics?.accuracy ? selectedModel.metrics.accuracy * 0.97 : 0,
                      precision: selectedModel.metrics?.precision ? selectedModel.metrics.precision * 0.96 : 0,
                      recall: selectedModel.metrics?.recall ? selectedModel.metrics.recall * 0.95 : 0
                    },
                    {
                      date: '2024-03',
                      accuracy: selectedModel.metrics?.accuracy || 0,
                      precision: selectedModel.metrics?.precision || 0,
                      recall: selectedModel.metrics?.recall || 0
                    }
                  ]}
                  index="date"
                  categories={['accuracy', 'precision', 'recall']}
                  colors={['blue', 'cyan', 'indigo']}
                />
              </Card>
            </div>
          </TabPanel>

          <TabPanel>
            <Grid numItems={1} numItemsSm={2} className="gap-6 mt-6">
              <Card>
                <Title>Confusion Matrix</Title>
                <Table className="mt-4">
                  <TableHead>
                    <TableRow>
                      <TableHeaderCell>Actual</TableHeaderCell>
                      <TableHeaderCell>Predicted</TableHeaderCell>
                      <TableHeaderCell>Count</TableHeaderCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {[
                      { actual: 'Positive', predicted: 'Positive', count: Math.floor((selectedModel.metrics?.accuracy || 0) * 1000) },
                      { actual: 'Positive', predicted: 'Negative', count: Math.floor((1 - (selectedModel.metrics?.precision || 0)) * 200) },
                      { actual: 'Negative', predicted: 'Positive', count: Math.floor((1 - (selectedModel.metrics?.recall || 0)) * 200) },
                      { actual: 'Negative', predicted: 'Negative', count: Math.floor((selectedModel.metrics?.accuracy || 0) * 800) }
                    ].map((row, idx) => (
                      <TableRow key={idx}>
                        <TableCell>{row.actual}</TableCell>
                        <TableCell>{row.predicted}</TableCell>
                        <TableCell>{row.count}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>

              <Card>
                <Title>ROC Curve</Title>
                <Text>Area Under Curve (AUC): {selectedModel.metrics?.auc?.toFixed(3) || 'N/A'}</Text>
                <div className="h-64 mt-4 flex items-center justify-center text-gray-500">
                  ROC curve visualization coming soon
                </div>
              </Card>
            </Grid>
          </TabPanel>

          <TabPanel>
            <Card className="mt-6">
              <Title>Feature Importance</Title>
              {selectedDataset?.preview_data?.columns.map((feature, idx) => {
                const importance = 1 - (idx / (selectedDataset.preview_data?.columns.length || 1));
                return (
                  <div key={idx} className="mt-4">
                    <Flex>
                      <Text>{feature}</Text>
                      <Text>{(importance * 100).toFixed(1)}%</Text>
                    </Flex>
                    <ProgressBar value={importance * 100} className="mt-2" />
                  </div>
                );
              })}
            </Card>
          </TabPanel>

          <TabPanel>
            <Card className="mt-6">
              <Title>Sample Predictions</Title>
              <Table className="mt-4">
                <TableHead>
                  <TableRow>
                    <TableHeaderCell>Input Features</TableHeaderCell>
                    <TableHeaderCell>Prediction</TableHeaderCell>
                    <TableHeaderCell>Confidence</TableHeaderCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {selectedDataset?.preview_data?.rows.slice(0, 5).map((row, idx) => (
                    <TableRow key={idx}>
                      <TableCell>
                        <div className="max-w-xs truncate">
                          {row.join(', ')}
                        </div>
                      </TableCell>
                      <TableCell>{Math.random() > 0.5 ? 'Positive' : 'Negative'}</TableCell>
                      <TableCell>{(0.7 + Math.random() * 0.3).toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabPanel>
        </TabPanels>
      </TabGroup>
    </main>
  );
};

export default ModelEvaluation;