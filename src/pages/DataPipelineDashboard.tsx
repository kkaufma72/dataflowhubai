import React from 'react';
import { 
  Activity, 
  BarChart2, 
  Clock, 
  Database, 
  FileInput, 
  FileOutput, 
  Filter, 
  CheckSquare, 
  Play, 
  Pause, 
  AlertCircle 
} from 'lucide-react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';

const DataPipelineDashboard: React.FC = () => {
  // Sample data for pipeline status
  const pipelineStatus = [
    { id: 'pipeline-1', name: 'Customer Data ETL', status: 'active', lastRun: '10 minutes ago', nextRun: '50 minutes', successRate: 98 },
    { id: 'pipeline-2', name: 'Product Analytics', status: 'paused', lastRun: '2 hours ago', nextRun: 'Manual', successRate: 100 },
    { id: 'pipeline-3', name: 'Sales Data Processing', status: 'active', lastRun: '30 minutes ago', nextRun: '30 minutes', successRate: 95 },
    { id: 'pipeline-4', name: 'Marketing Campaign Analysis', status: 'failed', lastRun: '1 hour ago', nextRun: 'Manual', successRate: 75 },
  ];

  // Sample data for data source metrics
  const dataSourceMetrics = [
    { name: 'CRM Database', recordsProcessed: 15420, lastSync: '15 minutes ago', status: 'healthy' },
    { name: 'Sales API', recordsProcessed: 8750, lastSync: '30 minutes ago', status: 'healthy' },
    { name: 'Marketing Data', recordsProcessed: 5280, lastSync: '1 hour ago', status: 'warning' },
    { name: 'Customer Feedback', recordsProcessed: 1240, lastSync: '2 hours ago', status: 'healthy' },
  ];

  // Sample data for data quality metrics
  const dataQualityMetrics = {
    completeness: 96.5,
    accuracy: 98.2,
    consistency: 94.8,
    timeliness: 99.1,
    issues: [
      { type: 'Missing Values', count: 245, severity: 'medium' },
      { type: 'Duplicate Records', count: 18, severity: 'low' },
      { type: 'Format Inconsistency', count: 67, severity: 'medium' },
      { type: 'Out of Range', count: 12, severity: 'high' },
    ]
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Pipeline Dashboard</h1>
        <Button icon={<Play className="w-4 h-4" />}>
          Create New Pipeline
        </Button>
      </div>

      {/* Pipeline Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <div className="flex items-center">
            <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg">
              <Activity className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Active Pipelines</p>
              <p className="text-2xl font-semibold text-gray-900">
                {pipelineStatus.filter(p => p.status === 'active').length}
              </p>
            </div>
          </div>
        </Card>
        
        <Card>
          <div className="flex items-center">
            <div className="flex items-center justify-center w-12 h-12 bg-yellow-100 rounded-lg">
              <Pause className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Paused Pipelines</p>
              <p className="text-2xl font-semibold text-gray-900">
                {pipelineStatus.filter(p => p.status === 'paused').length}
              </p>
            </div>
          </div>
        </Card>
        
        <Card>
          <div className="flex items-center">
            <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-lg">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Failed Pipelines</p>
              <p className="text-2xl font-semibold text-gray-900">
                {pipelineStatus.filter(p => p.status === 'failed').length}
              </p>
            </div>
          </div>
        </Card>
        
        <Card>
          <div className="flex items-center">
            <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg">
              <Database className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Data Sources</p>
              <p className="text-2xl font-semibold text-gray-900">
                {dataSourceMetrics.length}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Pipeline Status Table */}
      <Card>
        <h2 className="text-lg font-medium text-gray-900 mb-4">Pipeline Status</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pipeline Name
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Run
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Next Run
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Success Rate
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {pipelineStatus.map((pipeline) => (
                <tr key={pipeline.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{pipeline.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      pipeline.status === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : pipeline.status === 'paused'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {pipeline.status.charAt(0).toUpperCase() + pipeline.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {pipeline.lastRun}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {pipeline.nextRun}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div 
                          className={`h-2.5 rounded-full ${
                            pipeline.successRate > 95 
                              ? 'bg-green-600' 
                              : pipeline.successRate > 80 
                              ? 'bg-yellow-500' 
                              : 'bg-red-600'
                          }`} 
                          style={{ width: `${pipeline.successRate}%` }}
                        ></div>
                      </div>
                      <span className="ml-2 text-sm text-gray-700">{pipeline.successRate}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      {pipeline.status === 'active' ? (
                        <button className="text-yellow-600 hover:text-yellow-900">
                          <Pause className="w-5 h-5" />
                        </button>
                      ) : (
                        <button className="text-green-600 hover:text-green-900">
                          <Play className="w-5 h-5" />
                        </button>
                      )}
                      <button className="text-indigo-600 hover:text-indigo-900">
                        <BarChart2 className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Data Flow and Quality */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Data Sources */}
        <Card>
          <h2 className="text-lg font-medium text-gray-900 mb-4">Data Sources</h2>
          <div className="space-y-4">
            {dataSourceMetrics.map((source, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <Database className="w-5 h-5 text-gray-500 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{source.name}</p>
                    <p className="text-xs text-gray-500">Last sync: {source.lastSync}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{source.recordsProcessed.toLocaleString()} records</p>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    source.status === 'healthy' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {source.status.charAt(0).toUpperCase() + source.status.slice(1)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Data Quality */}
        <Card>
          <h2 className="text-lg font-medium text-gray-900 mb-4">Data Quality</h2>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium text-gray-500">Completeness</p>
              <div className="flex items-center mt-1">
                <div className="w-full bg-gray-200 rounded-full h-2.5 mr-2">
                  <div className="bg-green-600 h-2.5 rounded-full" style={{ width: `${dataQualityMetrics.completeness}%` }}></div>
                </div>
                <span className="text-sm font-medium text-gray-900">{dataQualityMetrics.completeness}%</span>
              </div>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium text-gray-500">Accuracy</p>
              <div className="flex items-center mt-1">
                <div className="w-full bg-gray-200 rounded-full h-2.5 mr-2">
                  <div className="bg-green-600 h-2.5 rounded-full" style={{ width: `${dataQualityMetrics.accuracy}%` }}></div>
                </div>
                <span className="text-sm font-medium text-gray-900">{dataQualityMetrics.accuracy}%</span>
              </div>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium text-gray-500">Consistency</p>
              <div className="flex items-center mt-1">
                <div className="w-full bg-gray-200 rounded-full h-2.5 mr-2">
                  <div className="bg-green-600 h-2.5 rounded-full" style={{ width: `${dataQualityMetrics.consistency}%` }}></div>
                </div>
                <span className="text-sm font-medium text-gray-900">{dataQualityMetrics.consistency}%</span>
              </div>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium text-gray-500">Timeliness</p>
              <div className="flex items-center mt-1">
                <div className="w-full bg-gray-200 rounded-full h-2.5 mr-2">
                  <div className="bg-green-600 h-2.5 rounded-full" style={{ width: `${dataQualityMetrics.timeliness}%` }}></div>
                </div>
                <span className="text-sm font-medium text-gray-900">{dataQualityMetrics.timeliness}%</span>
              </div>
            </div>
          </div>
          
          <h3 className="text-sm font-medium text-gray-700 mb-2">Quality Issues</h3>
          <div className="space-y-2">
            {dataQualityMetrics.issues.map((issue, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <span className={`w-2 h-2 rounded-full mr-2 ${
                    issue.severity === 'high' 
                      ? 'bg-red-500' 
                      : issue.severity === 'medium'
                      ? 'bg-yellow-500'
                      : 'bg-blue-500'
                  }`}></span>
                  <span className="text-sm text-gray-700">{issue.type}</span>
                </div>
                <span className="text-sm font-medium text-gray-900">{issue.count}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Pipeline Components Overview */}
      <Card>
        <h2 className="text-lg font-medium text-gray-900 mb-4">Pipeline Components</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-7 gap-4">
          <div className="p-4 bg-gray-50 rounded-lg flex flex-col items-center text-center">
            <Database className="w-8 h-8 text-indigo-500 mb-2" />
            <h3 className="text-sm font-medium text-gray-900">Data Sources</h3>
            <p className="text-xs text-gray-500 mt-1">12 active sources</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg flex flex-col items-center text-center">
            <FileInput className="w-8 h-8 text-indigo-500 mb-2" />
            <h3 className="text-sm font-medium text-gray-900">Data Ingestion</h3>
            <p className="text-xs text-gray-500 mt-1">8 ingestion jobs</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg flex flex-col items-center text-center">
            <Filter className="w-8 h-8 text-indigo-500 mb-2" />
            <h3 className="text-sm font-medium text-gray-900">Transformation</h3>
            <p className="text-xs text-gray-500 mt-1">15 transformations</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg flex flex-col items-center text-center">
            <CheckSquare className="w-8 h-8 text-indigo-500 mb-2" />
            <h3 className="text-sm font-medium text-gray-900">Data Quality</h3>
            <p className="text-xs text-gray-500 mt-1">24 validation rules</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg flex flex-col items-center text-center">
            <Database className="w-8 h-8 text-indigo-500 mb-2" />
            <h3 className="text-sm font-medium text-gray-900">Data Storage</h3>
            <p className="text-xs text-gray-500 mt-1">5 storage targets</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg flex flex-col items-center text-center">
            <Activity className="w-8 h-8 text-indigo-500 mb-2" />
            <h3 className="text-sm font-medium text-gray-900">Processing</h3>
            <p className="text-xs text-gray-500 mt-1">10 processors</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg flex flex-col items-center text-center">
            <FileOutput className="w-8 h-8 text-indigo-500 mb-2" />
            <h3 className="text-sm font-medium text-gray-900">Data Output</h3>
            <p className="text-xs text-gray-500 mt-1">7 output channels</p>
          </div>
        </div>
      </Card>

      {/* Recent Activity */}
      <Card>
        <h2 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h2>
        <div className="space-y-4">
          {[
            { time: '10 minutes ago', event: 'Customer Data ETL pipeline completed successfully', icon: Activity, color: 'text-green-500' },
            { time: '25 minutes ago', event: 'Data quality check failed for Marketing dataset', icon: AlertCircle, color: 'text-red-500' },
            { time: '1 hour ago', event: 'New data source "Sales Analytics API" added', icon: Database, color: 'text-blue-500' },
            { time: '2 hours ago', event: 'Product Analytics pipeline paused by admin', icon: Pause, color: 'text-yellow-500' },
            { time: '3 hours ago', event: 'Data transformation rule updated for Customer dataset', icon: Filter, color: 'text-purple-500' },
          ].map((activity, index) => {
            const Icon = activity.icon;
            return (
              <div key={index} className="flex">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100">
                    <Icon className={`w-5 h-5 ${activity.color}`} />
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-900">{activity.event}</p>
                  <p className="text-xs text-gray-500">{activity.time}</p>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
};

export default DataPipelineDashboard;