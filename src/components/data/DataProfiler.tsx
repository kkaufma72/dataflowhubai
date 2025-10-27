import React, { useState, useEffect } from 'react';
import { Card } from '../common/Card';
import { 
  BarChart2, 
  PieChart, 
  Activity, 
  AlertTriangle, 
  Check, 
  Download, 
  RefreshCw,
  Filter,
  Eye,
  EyeOff,
  ArrowRight,
  Info,
  Zap,
  Clock,
  FileText
} from 'lucide-react';
import Button from '../common/Button';
import { Dataset } from '../../types';
import { 
  generateDataProfile, 
  DataProfile, 
  ColumnProfile, 
  DataQualityIssue,
  PreprocessingRecommendation
} from '../../lib/dataProcessing';
import { Bar, Pie } from 'react-chartjs-2';
import toast from 'react-hot-toast';

interface DataProfilerProps {
  dataset: Dataset;
  onApplyRecommendations?: (recommendations: PreprocessingRecommendation[]) => void;
}

const DataProfiler: React.FC<DataProfilerProps> = ({ 
  dataset,
  onApplyRecommendations
}) => {
  const [profile, setProfile] = useState<DataProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedColumn, setSelectedColumn] = useState<string | null>(null);
  const [showAllIssues, setShowAllIssues] = useState(false);
  const [selectedRecommendations, setSelectedRecommendations] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'columns' | 'issues' | 'recommendations'>('overview');

  useEffect(() => {
    if (dataset && dataset.preview_data) {
      generateProfile();
    }
  }, [dataset]);

  // OPTIMIZED: Async processing to prevent UI blocking
  const generateProfile = async () => {
    // Validate preview_data structure
    if (!dataset.preview_data || !dataset.preview_data.columns || !dataset.preview_data.rows) {
      toast.error('No preview data available');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const { columns, rows } = dataset.preview_data!;
      
      // Validate rows is an array with data
      if (!Array.isArray(rows) || rows.length === 0) {
        toast.error('Dataset contains no data rows');
        setIsLoading(false);
        return;
      }
      
      // OPTIMIZATION: Use requestIdleCallback or setTimeout to prevent blocking
      // This allows the UI to stay responsive during heavy computation
      await new Promise(resolve => setTimeout(resolve, 0));
      
      const dataProfile = generateDataProfile({ columns, rows });
      setProfile(dataProfile);
      setIsLoading(false);
      
      // Select first column by default
      if (columns.length > 0 && !selectedColumn) {
        setSelectedColumn(columns[0]);
      }
      
      const rowCount = rows.length;
      toast.success(
        rowCount > 10000 
          ? `Profile generated (sampled from ${rowCount.toLocaleString()} rows)`
          : 'Data profile generated successfully'
      );
    } catch (error) {
      console.error('Error generating profile:', error);
      setIsLoading(false);
      toast.error('Failed to generate data profile');
    }
  };

  const handleApplyRecommendations = () => {
    if (!profile || !onApplyRecommendations) return;
    
    const selectedRecs = profile.recommendations.filter(rec => 
      selectedRecommendations.includes(`${rec.type}-${rec.column || 'global'}-${rec.suggestedMethod}`)
    );
    
    onApplyRecommendations(selectedRecs);
    toast.success(`${selectedRecs.length} recommendations applied`);
  };

  const toggleRecommendation = (rec: PreprocessingRecommendation) => {
    const recId = `${rec.type}-${rec.column || 'global'}-${rec.suggestedMethod}`;
    
    if (selectedRecommendations.includes(recId)) {
      setSelectedRecommendations(selectedRecommendations.filter(id => id !== recId));
    } else {
      setSelectedRecommendations([...selectedRecommendations, recId]);
    }
  };

  const getColumnTypeIcon = (type: string) => {
    switch (type) {
      case 'numeric':
        return <BarChart2 className="w-4 h-4 text-blue-500" />;
      case 'categorical':
        return <PieChart className="w-4 h-4 text-green-500" />;
      case 'datetime':
        return <Clock className="w-4 h-4 text-purple-500" />;
      case 'boolean':
        return <Check className="w-4 h-4 text-amber-500" />;
      default:
        return <FileText className="w-4 h-4 text-gray-500" />;
    }
  };

  const getColumnTypeColor = (type: string) => {
    switch (type) {
      case 'numeric':
        return 'bg-blue-100 text-blue-800';
      case 'categorical':
        return 'bg-green-100 text-green-800';
      case 'datetime':
        return 'bg-purple-100 text-purple-800';
      case 'boolean':
        return 'bg-amber-100 text-amber-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getIssueTypeIcon = (type: string) => {
    return <AlertTriangle className="w-4 h-4 text-amber-500" />;
  };

  const getIssueTypeColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-amber-100 text-amber-800';
      case 'low':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRecommendationImpactColor = (impact: string) => {
    switch (impact) {
      case 'high':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-blue-100 text-blue-800';
      case 'low':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const renderColumnHistogram = (column: ColumnProfile) => {
    if (column.type !== 'numeric' || !column.stats.histogram) return null;
    
    const data = {
      labels: column.stats.histogram.map(h => h.bin.toFixed(2)),
      datasets: [
        {
          label: 'Frequency',
          data: column.stats.histogram.map(h => h.count),
          backgroundColor: 'rgba(79, 70, 229, 0.6)',
          borderColor: 'rgba(79, 70, 229, 1)',
          borderWidth: 1,
        },
      ],
    };
    
    const options = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false,
        },
      },
      scales: {
        x: {
          title: {
            display: true,
            text: 'Value',
          },
        },
        y: {
          title: {
            display: true,
            text: 'Frequency',
          },
        },
      },
    };
    
    return (
      <div className="h-64">
        <Bar data={data} options={options} />
      </div>
    );
  };

  const renderCategoricalDistribution = (column: ColumnProfile) => {
    if ((column.type !== 'categorical' && column.type !== 'boolean') || !column.distribution) return null;
    
    const entries = Object.entries(column.distribution);
    const topEntries = entries.sort((a, b) => b[1] - a[1]).slice(0, 10);
    
    const data = {
      labels: topEntries.map(([category]) => category),
      datasets: [
        {
          data: topEntries.map(([, count]) => count * 100),
          backgroundColor: [
            'rgba(79, 70, 229, 0.6)',
            'rgba(16, 185, 129, 0.6)',
            'rgba(245, 158, 11, 0.6)',
            'rgba(239, 68, 68, 0.6)',
            'rgba(139, 92, 246, 0.6)',
            'rgba(236, 72, 153, 0.6)',
            'rgba(6, 182, 212, 0.6)',
            'rgba(249, 115, 22, 0.6)',
            'rgba(168, 85, 247, 0.6)',
            'rgba(59, 130, 246, 0.6)',
          ],
          borderWidth: 1,
        },
      ],
    };
    
    const options = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'right' as const,
        },
        tooltip: {
          callbacks: {
            label: function(context: any) {
              return `${context.label}: ${context.raw.toFixed(1)}%`;
            }
          }
        }
      },
    };
    
    return (
      <div className="h-64">
        <Pie data={data} options={options} />
      </div>
    );
  };

  if (!dataset.preview_data) {
    return (
      <Card>
        <div className="flex items-center justify-center p-8">
          <AlertTriangle className="w-8 h-8 text-amber-500 mr-2" />
          <p className="text-lg text-gray-700">No data available for profiling</p>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <div className="flex items-center justify-center w-10 h-10 bg-indigo-100 rounded-lg">
            <BarChart2 className="w-6 h-6 text-indigo-600" />
          </div>
          <div className="ml-4">
            <h3 className="text-sm font-medium text-gray-900">Data Profile</h3>
            <p className="mt-1 text-xs text-gray-500">
              Comprehensive analysis of your dataset
            </p>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={generateProfile}
            disabled={isLoading}
            icon={isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          >
            {isLoading ? 'Generating...' : 'Refresh'}
          </Button>
          {profile && (
            <Button
              variant="outline"
              size="sm"
              icon={<Download className="w-4 h-4" />}
              onClick={() => {
                const json = JSON.stringify(profile, null, 2);
                const blob = new Blob([json], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${dataset.name}-profile.json`;
                a.click();
                URL.revokeObjectURL(url);
              }}
            >
              Export
            </Button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center p-12">
          <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin mb-4" />
          <p className="text-gray-700">Generating data profile...</p>
        </div>
      ) : !profile ? (
        <div className="flex flex-col items-center justify-center p-12">
          <AlertTriangle className="w-8 h-8 text-amber-500 mb-4" />
          <p className="text-gray-700">No profile generated yet</p>
          <Button
            className="mt-4"
            onClick={generateProfile}
          >
            Generate Profile
          </Button>
        </div>
      ) : (
        <>
          <div className="mb-6">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'overview'
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Overview
                </button>
                <button
                  onClick={() => setActiveTab('columns')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'columns'
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Columns
                </button>
                <button
                  onClick={() => setActiveTab('issues')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'issues'
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center">
                    Issues
                    {profile.dataQualityIssues.length > 0 && (
                      <span className="ml-2 px-2 py-0.5 text-xs font-medium rounded-full bg-amber-100 text-amber-800">
                        {profile.dataQualityIssues.length}
                      </span>
                    )}
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab('recommendations')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'recommendations'
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center">
                    Recommendations
                    {profile.recommendations.length > 0 && (
                      <span className="ml-2 px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-800">
                        {profile.recommendations.length}
                      </span>
                    )}
                  </div>
                </button>
              </nav>
            </div>
          </div>

          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 bg-white rounded-lg shadow-sm border border-gray-100">
                  <p className="text-sm font-medium text-gray-500">Rows</p>
                  <p className="mt-1 text-2xl font-semibold text-gray-900">{profile.rowCount.toLocaleString()}</p>
                </div>
                <div className="p-4 bg-white rounded-lg shadow-sm border border-gray-100">
                  <p className="text-sm font-medium text-gray-500">Columns</p>
                  <p className="mt-1 text-2xl font-semibold text-gray-900">{Object.keys(profile.columnProfiles).length}</p>
                </div>
                <div className="p-4 bg-white rounded-lg shadow-sm border border-gray-100">
                  <p className="text-sm font-medium text-gray-500">Data Quality Issues</p>
                  <p className="mt-1 text-2xl font-semibold text-gray-900">{profile.dataQualityIssues.length}</p>
                </div>
                <div className="p-4 bg-white rounded-lg shadow-sm border border-gray-100">
                  <p className="text-sm font-medium text-gray-500">Recommendations</p>
                  <p className="mt-1 text-2xl font-semibold text-gray-900">{profile.recommendations.length}</p>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Column Types</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {['numeric', 'categorical', 'datetime', 'boolean', 'text'].map(type => {
                    const count = Object.values(profile.columnProfiles).filter(col => col.type === type).length;
                    if (count === 0) return null;
                    
                    return (
                      <div key={type} className="p-4 bg-white rounded-lg shadow-sm border border-gray-100">
                        <div className="flex items-center">
                          {getColumnTypeIcon(type)}
                          <span className="ml-2 text-sm font-medium text-gray-700 capitalize">{type}</span>
                        </div>
                        <p className="mt-1 text-2xl font-semibold text-gray-900">{count}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'columns' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1">
                <h4 className="text-sm font-medium text-gray-700 mb-4">Select Column</h4>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {Object.keys(profile.columnProfiles).map((column) => (
                    <button
                      key={column}
                      onClick={() => setSelectedColumn(column)}
                      className={`w-full text-left px-4 py-3 rounded-lg border transition-colors ${
                        selectedColumn === column
                          ? 'border-indigo-500 bg-indigo-50'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-900">{column}</span>
                        <span className={`px-2 py-1 text-xs font-medium rounded ${
                          getColumnTypeColor(profile.columnProfiles[column].type)
                        }`}>
                          {profile.columnProfiles[column].type}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {selectedColumn && profile.columnProfiles[selectedColumn] && (
                <div className="lg:col-span-2 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-white rounded-lg shadow-sm border border-gray-100">
                      <h4 className="text-sm font-medium text-gray-700 mb-3">Statistics</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-500">Type</span>
                          <span className={`px-2 py-1 text-xs font-medium rounded ${
                            getColumnTypeColor(profile.columnProfiles[selectedColumn].type)
                          }`}>
                            {profile.columnProfiles[selectedColumn].type}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-500">Count</span>
                          <span className="text-sm font-medium text-gray-900">{profile.columnProfiles[selectedColumn].count}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-500">Missing</span>
                          <span className="text-sm font-medium text-gray-900">
                            {profile.columnProfiles[selectedColumn].missing} ({profile.columnProfiles[selectedColumn].missingPercent.toFixed(1)}%)
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-500">Unique</span>
                          <span className="text-sm font-medium text-gray-900">
                            {profile.columnProfiles[selectedColumn].unique} ({profile.columnProfiles[selectedColumn].uniquePercent.toFixed(1)}%)
                          </span>
                        </div>

                        {profile.columnProfiles[selectedColumn].type === 'numeric' && (
                          <>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-500">Mean</span>
                              <span className="text-sm font-medium text-gray-900">{profile.columnProfiles[selectedColumn].stats.mean?.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-500">Median</span>
                              <span className="text-sm font-medium text-gray-900">{profile.columnProfiles[selectedColumn].stats.median?.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-500">Std Dev</span>
                              <span className="text-sm font-medium text-gray-900">{profile.columnProfiles[selectedColumn].stats.std?.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-500">Min</span>
                              <span className="text-sm font-medium text-gray-900">{profile.columnProfiles[selectedColumn].stats.min}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-500">Max</span>
                              <span className="text-sm font-medium text-gray-900">{profile.columnProfiles[selectedColumn].stats.max}</span>
                            </div>
                          </>
                        )}
                            
                        {profile.columnProfiles[selectedColumn].type === 'datetime' && (
                          <>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-500">Min Date</span>
                              <span className="text-sm font-medium text-gray-900">
                                {new Date(profile.columnProfiles[selectedColumn].stats.min as string).toLocaleDateString()}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-500">Max Date</span>
                              <span className="text-sm font-medium text-gray-900">
                                {new Date(profile.columnProfiles[selectedColumn].stats.max as string).toLocaleDateString()}
                              </span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                    
                    <div className="p-4 bg-white rounded-lg shadow-sm border border-gray-100">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Distribution</h4>
                      {profile.columnProfiles[selectedColumn].type === 'numeric' ? (
                        renderColumnHistogram(profile.columnProfiles[selectedColumn])
                      ) : (profile.columnProfiles[selectedColumn].type === 'categorical' || 
                           profile.columnProfiles[selectedColumn].type === 'boolean') ? (
                        renderCategoricalDistribution(profile.columnProfiles[selectedColumn])
                      ) : (
                        <div className="flex items-center justify-center h-64">
                          <p className="text-sm text-gray-500">No distribution visualization available for this column type</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'issues' && (
            <div className="space-y-4">
              {profile.dataQualityIssues.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8">
                  <Check className="w-12 h-12 text-green-500 mb-4" />
                  <p className="text-lg font-medium text-gray-900">No data quality issues detected</p>
                  <p className="text-sm text-gray-500 mt-1">Your dataset looks good!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {profile.dataQualityIssues.map((issue, index) => (
                    <div key={index} className={`p-4 rounded-lg border ${
                      issue.severity === 'high' 
                        ? 'border-red-200 bg-red-50' 
                        : issue.severity === 'medium'
                        ? 'border-amber-200 bg-amber-50'
                        : 'border-blue-200 bg-blue-50'
                    }`}>
                      <div className="flex items-start">
                        <div className="flex-shrink-0">
                          {getIssueTypeIcon(issue.type)}
                        </div>
                        <div className="ml-3 flex-1">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-medium text-gray-900">{issue.type.replace(/_/g, ' ')}</h4>
                            <span className={`px-2 py-1 text-xs font-medium rounded ${getIssueTypeColor(issue.severity)}`}>
                              {issue.severity}
                            </span>
                          </div>
                          {issue.column && (
                            <p className="text-sm font-medium text-gray-700 mt-1">Column: {issue.column}</p>
                          )}
                          <div className={`mt-2 text-sm ${
                            issue.severity === 'high' 
                              ? 'text-red-700' 
                              : issue.severity === 'medium'
                              ? 'text-amber-700'
                              : 'text-blue-700'
                          }`}>
                            <p>{issue.description}</p>
                            {issue.affectedRows && (
                              <p className="mt-1">
                                Affects {issue.affectedRows.toLocaleString()} rows 
                                ({((issue.affectedRows / profile.rowCount) * 100).toFixed(1)}% of data)
                              </p>
                            )}
                          </div>
                          {issue.recommendation && (
                            <div className={`mt-2 text-sm font-medium ${
                              issue.severity === 'high' 
                                ? 'text-red-800' 
                                : issue.severity === 'medium'
                                ? 'text-amber-800'
                                : 'text-blue-800'
                            }`}>
                              Recommendation: {issue.recommendation}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'recommendations' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-medium text-gray-700">Preprocessing Recommendations</h4>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedRecommendations(
                      profile.recommendations.map(rec => `${rec.type}-${rec.column || 'global'}-${rec.suggestedMethod}`)
                    )}
                  >
                    Select All
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleApplyRecommendations}
                    disabled={selectedRecommendations.length === 0 || !onApplyRecommendations}
                    icon={<Zap className="w-4 h-4" />}
                  >
                    Apply Selected ({selectedRecommendations.length})
                  </Button>
                </div>
              </div>
              
              {profile.recommendations.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8">
                  <Check className="w-12 h-12 text-green-500 mb-4" />
                  <p className="text-lg font-medium text-gray-900">No preprocessing recommendations</p>
                  <p className="text-sm text-gray-500 mt-1">Your dataset is ready for modeling!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {profile.recommendations.map((rec, index) => {
                    const recId = `${rec.type}-${rec.column || 'global'}-${rec.suggestedMethod}`;
                    const isSelected = selectedRecommendations.includes(recId);
                    
                    return (
                      <div
                        key={index}
                        onClick={() => toggleRecommendation(rec)}
                        className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                          isSelected
                            ? 'border-indigo-500 bg-indigo-50'
                            : 'border-gray-200 hover:border-gray-300 bg-white'
                        }`}
                      >
                        <div className="flex items-start">
                          <div className="flex-shrink-0 mt-0.5">
                            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                              isSelected
                                ? 'border-indigo-500 bg-indigo-500'
                                : 'border-gray-300'
                            }`}>
                              {isSelected && <Check className="w-3 h-3 text-white" />}
                            </div>
                          </div>
                          <div className="ml-3 flex-1">
                            <div className="flex items-center justify-between">
                              <h4 className="text-sm font-medium text-gray-900">{rec.type.replace(/_/g, ' ')}</h4>
                              <span className={`px-2 py-1 text-xs font-medium rounded ${getRecommendationImpactColor(rec.impact)}`}>
                                {rec.impact} impact
                              </span>
                            </div>
                            {rec.column && (
                              <p className="text-sm font-medium text-gray-700 mt-1">Column: {rec.column}</p>
                            )}
                            <p className="text-sm text-gray-600 mt-2">{rec.description}</p>
                            <p className="text-sm font-medium text-indigo-600 mt-2">Method: {rec.suggestedMethod}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </Card>
  );
};

export default DataProfiler;