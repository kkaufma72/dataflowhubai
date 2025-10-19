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
  Zap
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
    if (dataset && dataset.previewData) {
      generateProfile();
    }
  }, [dataset]);

  const generateProfile = async () => {
    if (!dataset.previewData) return;
    
    setIsLoading(true);
    
    try {
      // Use setTimeout to avoid blocking the UI
      setTimeout(() => {
        const { columns, rows } = dataset.previewData!;
        const dataProfile = generateDataProfile(rows, columns);
        setProfile(dataProfile);
        setIsLoading(false);
        
        // Select first column by default
        if (columns.length > 0 && !selectedColumn) {
          setSelectedColumn(columns[0]);
        }
        
        toast.success('Data profile generated successfully');
      }, 500);
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
    switch (type) {
      case 'missing_values':
        return <EyeOff className="w-4 h-4 text-amber-500" />;
      case 'outliers':
        return <Activity className="w-4 h-4 text-red-500" />;
      case 'imbalance':
        return <BarChart2 className="w-4 h-4 text-purple-500" />;
      case 'high_cardinality':
        return <Hash className="w-4 h-4 text-blue-500" />;
      case 'skewed_distribution':
        return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'duplicate_rows':
        return <Copy className="w-4 h-4 text-indigo-500" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-gray-500" />;
    }
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

  const getRecommendationTypeIcon = (type: string) => {
    switch (type) {
      case 'missing_values':
        return <EyeOff className="w-4 h-4 text-amber-500" />;
      case 'outliers':
        return <Activity className="w-4 h-4 text-red-500" />;
      case 'encoding':
        return <Code className="w-4 h-4 text-blue-500" />;
      case 'scaling':
        return <ArrowsExpand className="w-4 h-4 text-green-500" />;
      case 'feature_selection':
        return <Filter className="w-4 h-4 text-purple-500" />;
      case 'dimensionality_reduction':
        return <Minimize2 className="w-4 h-4 text-indigo-500" />;
      default:
        return <Zap className="w-4 h-4 text-gray-500" />;
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
    
    // Limit to top 10 categories for readability
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

  if (!dataset.previewData) {
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
                          <p className="ml-2 text-sm font-medium text-gray-700">{type.charAt(0).toUpperCase() + type.slice(1)}</p>
                        </div>
                        <p className="mt-2 text-xl font-semibold text-gray-900">{count}</p>
                        <p className="text-xs text-gray-500">
                          {((count / Object.keys(profile.columnProfiles).length) * 100).toFixed(1)}% of columns
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Data Quality Summary</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-white rounded-lg shadow-sm border border-gray-100">
                    <h5 className="text-sm font-medium text-gray-700 mb-2">Missing Values</h5>
                    {Object.values(profile.columnProfiles).some(col => col.missing > 0) ? (
                      <div className="space-y-2">
                        {Object.values(profile.columnProfiles)
                          .filter(col => col.missing > 0)
                          .sort((a, b) => b.missingPercent - a.missingPercent)
                          .slice(0, 5)
                          .map(col => (
                            <div key={col.name} className="flex items-center justify-between">
                              <span className="text-sm text-gray-600">{col.name}</span>
                              <div className="flex items-center">
                                <div className="w-24 h-2 bg-gray-200 rounded-full mr-2">
                                  <div 
                                    className="h-2 bg-amber-500 rounded-full" 
                                    style={{ width: `${col.missingPercent}%` }}
                                  ></div>
                                </div>
                                <span className="text-xs text-gray-500">{col.missingPercent.toFixed(1)}%</span>
                              </div>
                            </div>
                          ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">No missing values detected</p>
                    )}
                  </div>
                  
                  <div className="p-4 bg-white rounded-lg shadow-sm border border-gray-100">
                    <h5 className="text-sm font-medium text-gray-700 mb-2">Outliers</h5>
                    {Object.values(profile.columnProfiles).some(col => col.outliers && col.outliers > 0) ? (
                      <div className="space-y-2">
                        {Object.values(profile.columnProfiles)
                          .filter(col => col.outliers && col.outliers > 0)
                          .sort((a, b) => (b.outliers || 0) - (a.outliers || 0))
                          .slice(0, 5)
                          .map(col => (
                            <div key={col.name} className="flex items-center justify-between">
                              <span className="text-sm text-gray-600">{col.name}</span>
                              <div className="flex items-center">
                                <span className="text-xs text-gray-500">
                                  {col.outliers} outliers ({((col.outliers || 0) / col.count * 100).toFixed(1)}%)
                                </span>
                              </div>
                            </div>
                          ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">No outliers detected</p>
                    )}
                  </div>
                </div>
              </div>

              {profile.correlations && Object.keys(profile.correlations).length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Correlation Highlights</h4>
                  <div className="p-4 bg-white rounded-lg shadow-sm border border-gray-100">
                    <div className="space-y-2">
                      {Object.entries(profile.correlations)
                        .flatMap(([col1, correlations]) => 
                          Object.entries(correlations)
                            .filter(([col2, value]) => col1 !== col2 && Math.abs(value) > 0.7)
                            .map(([col2, value]) => ({ col1, col2, value }))
                        )
                        .sort((a, b) => Math.abs(b.value) - Math.abs(a.value))
                        .slice(0, 5)
                        .map(({ col1, col2, value }) => (
                          <div key={`${col1}-${col2}`} className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">{col1} ↔ {col2}</span>
                            <span className={`text-sm ${value > 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {value.toFixed(2)}
                            </span>
                          </div>
                        ))}
                      {Object.entries(profile.correlations)
                        .flatMap(([col1, correlations]) => 
                          Object.entries(correlations)
                            .filter(([col2, value]) => col1 !== col2 && Math.abs(value) > 0.7)
                        ).length === 0 && (
                        <p className="text-sm text-gray-500">No strong correlations detected</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'columns' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-1 space-y-2">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      placeholder="Search columns"
                      onChange={(e) => {
                        const searchTerm = e.target.value.toLowerCase();
                        const matchingColumn = Object.keys(profile.columnProfiles).find(col => 
                          col.toLowerCase().includes(searchTerm)
                        );
                        if (matchingColumn) {
                          setSelectedColumn(matchingColumn);
                        }
                      }}
                    />
                  </div>
                  
                  <div className="overflow-y-auto max-h-96 border border-gray-200 rounded-md">
                    {Object.values(profile.columnProfiles).map(column => (
                      <button
                        key={column.name}
                        className={`flex items-center justify-between w-full px-3 py-2 text-sm text-left hover:bg-gray-50 ${
                          selectedColumn === column.name ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700'
                        }`}
                        onClick={() => setSelectedColumn(column.name)}
                      >
                        <div className="flex items-center">
                          {getColumnTypeIcon(column.type)}
                          <span className="ml-2 truncate">{column.name}</span>
                        </div>
                        {column.missing > 0 && (
                          <span className="text-xs text-amber-600">{column.missingPercent.toFixed(0)}% missing</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="md:col-span-3">
                  {selectedColumn && profile.columnProfiles[selectedColumn] && (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          {getColumnTypeIcon(profile.columnProfiles[selectedColumn].type)}
                          <h3 className="ml-2 text-lg font-medium text-gray-900">{selectedColumn}</h3>
                          <span className={`ml-2 px-2 py-0.5 text-xs font-medium rounded-full ${
                            getColumnTypeColor(profile.columnProfiles[selectedColumn].type)
                          }`}>
                            {profile.columnProfiles[selectedColumn].type}
                          </span>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          {profile.columnProfiles[selectedColumn].missing > 0 && (
                            <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-amber-100 text-amber-800">
                              {profile.columnProfiles[selectedColumn].missingPercent.toFixed(1)}% missing
                            </span>
                          )}
                          {profile.columnProfiles[selectedColumn].outliers && profile.columnProfiles[selectedColumn].outliers > 0 && (
                            <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-red-100 text-red-800">
                              {profile.columnProfiles[selectedColumn].outliers} outliers
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 bg-white rounded-lg shadow-sm border border-gray-100">
                          <h4 className="text-sm font-medium text-gray-700 mb-2">Statistics</h4>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-500">Count</span>
                              <span className="text-sm font-medium text-gray-900">{profile.columnProfiles[selectedColumn].count.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-500">Missing</span>
                              <span className="text-sm font-medium text-gray-900">
                                {profile.columnProfiles[selectedColumn].missing.toLocaleString()} 
                                ({profile.columnProfiles[selectedColumn].missingPercent.toFixed(1)}%)
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-500">Unique</span>
                              <span className="text-sm font-medium text-gray-900">
                                {profile.columnProfiles[selectedColumn].unique.toLocaleString()} 
                                ({profile.columnProfiles[selectedColumn].uniquePercent.toFixed(1)}%)
                              </span>
                            </div>
                            
                            {profile.columnProfiles[selectedColumn].type === 'numeric' && (
                              <>
                                <div className="flex justify-between">
                                  <span className="text-sm text-gray-500">Min</span>
                                  <span className="text-sm font-medium text-gray-900">
                                    {typeof profile.columnProfiles[selectedColumn].stats.min === 'number' 
                                      ? profile.columnProfiles[selectedColumn].stats.min.toLocaleString(undefined, {maximumFractionDigits: 4}) 
                                      : profile.columnProfiles[selectedColumn].stats.min}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-sm text-gray-500">Max</span>
                                  <span className="text-sm font-medium text-gray-900">
                                    {typeof profile.columnProfiles[selectedColumn].stats.max === 'number' 
                                      ? profile.columnProfiles[selectedColumn].stats.max.toLocaleString(undefined, {maximumFractionDigits: 4}) 
                                      : profile.columnProfiles[selectedColumn].stats.max}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-sm text-gray-500">Mean</span>
                                  <span className="text-sm font-medium text-gray-900">
                                    {profile.columnProfiles[selectedColumn].stats.mean?.toLocaleString(undefined, {maximumFractionDigits: 4})}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-sm text-gray-500">Median</span>
                                  <span className="text-sm font-medium text-gray-900">
                                    {profile.columnProfiles[selectedColumn].stats.median?.toLocaleString(undefined, {maximumFractionDigits: 4})}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-sm text-gray-500">Std Dev</span>
                                  <span className="text-sm font-medium text-gray-900">
                                    {profile.columnProfiles[selectedColumn].stats.std?.toLocaleString(undefined, {maximumFractionDigits: 4})}
                                  </span>
                                </div>
                                {profile.columnProfiles[selectedColumn].stats.skewness !== undefined && (
                                  <div className="flex justify-between">
                                    <span className="text-sm text-gray-500">Skewness</span>
                                    <span className="text-sm font-medium text-gray-900">
                                      {profile.columnProfiles[selectedColumn].stats.skewness.toFixed(4)}
                                    </span>
                                  </div>
                                )}
                              </>
                            )}
                            
                            {(profile.columnProfiles[selectedColumn].type === 'categorical' || 
                              profile.columnProfiles[selectedColumn].type === 'boolean') && 
                              profile.columnProfiles[selectedColumn].stats.mode !== undefined && (
                              <div className="flex justify-between">
                                <span className="text-sm text-gray-500">Mode</span>
                                <span className="text-sm font-medium text-gray-900">
                                  {profile.columnProfiles[selectedColumn].stats.mode.toString()}
                                </span>
                              </div>
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
                      
                      {/* Issues and recommendations for this column */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 bg-white rounded-lg shadow-sm border border-gray-100">
                          <h4 className="text-sm font-medium text-gray-700 mb-2">Issues</h4>
                          {profile.dataQualityIssues.filter(issue => issue.column === selectedColumn).length > 0 ? (
                            <div className="space-y-2">
                              {profile.dataQualityIssues
                                .filter(issue => issue.column === selectedColumn)
                                .map((issue, index) => (
                                  <div key={index} className="p-2 bg-gray-50 rounded-md">
                                    <div className="flex items-start">
                                      <div className="flex-shrink-0 mt-0.5">
                                        {getIssueTypeIcon(issue.type)}
                                      </div>
                                      <div className="ml-2">
                                        <div className="flex items-center">
                                          <p className="text-sm font-medium text-gray-900">{issue.type.replace(/_/g, ' ')}</p>
                                          <span className={`ml-2 px-2 py-0.5 text-xs font-medium rounded-full ${
                                            getIssueTypeColor(issue.severity)
                                          }`}>
                                            {issue.severity}
                                          </span>
                                        </div>
                                        <p className="text-sm text-gray-600">{issue.description}</p>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                            </div>
                          ) : (
                            <p className="text-sm text-gray-500">No issues detected for this column</p>
                          )}
                        </div>
                        
                        <div className="p-4 bg-white rounded-lg shadow-sm border border-gray-100">
                          <h4 className="text-sm font-medium text-gray-700 mb-2">Recommendations</h4>
                          {profile.recommendations.filter(rec => rec.column === selectedColumn).length > 0 ? (
                            <div className="space-y-2">
                              {profile.recommendations
                                .filter(rec => rec.column === selectedColumn)
                                .map((rec, index) => {
                                  const recId = `${rec.type}-${rec.column || 'global'}-${rec.suggestedMethod}`;
                                  const isSelected = selectedRecommendations.includes(recId);
                                  
                                  return (
                                    <div 
                                      key={index} 
                                      className={`p-2 rounded-md cursor-pointer ${
                                        isSelected ? 'bg-indigo-50 border border-indigo-200' : 'bg-gray-50'
                                      }`}
                                      onClick={() => toggleRecommendation(rec)}
                                    >
                                      <div className="flex items-start">
                                        <div className="flex-shrink-0 mt-0.5">
                                          {getRecommendationTypeIcon(rec.type)}
                                        </div>
                                        <div className="ml-2 flex-1">
                                          <div className="flex items-center justify-between">
                                            <p className="text-sm font-medium text-gray-900">{rec.suggestedMethod.replace(/_/g, ' ')}</p>
                                            <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                                              getRecommendationImpactColor(rec.impact)
                                            }`}>
                                              {rec.impact} impact
                                            </span>
                                          </div>
                                          <p className="text-sm text-gray-600">{rec.description}</p>
                                        </div>
                                        <div className="ml-2 flex-shrink-0">
                                          <input
                                            type="checkbox"
                                            checked={isSelected}
                                            onChange={() => toggleRecommendation(rec)}
                                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                          />
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                            </div>
                          ) : (
                            <p className="text-sm text-gray-500">No recommendations for this column</p>
                          )}
                        </div>

                        {/* Apply Selected Button */}
                        {profile.recommendations.filter(rec => rec.column === selectedColumn).length > 0 && (
                          <div className="mt-4 flex justify-end">
                            <Button
                              onClick={handleApplyRecommendations}
                              disabled={selectedRecommendations.length === 0}
                              icon={<Check className="w-4 h-4" />}
                            >
                              Apply Selected ({selectedRecommendations.length})
                            </Button>
                          </div>
                        )}
                      </div>
                      
                      {/* Correlations */}
                      {profile.correlations && profile.correlations[selectedColumn] && (
                        <div className="p-4 bg-white rounded-lg shadow-sm border border-gray-100">
                          <h4 className="text-sm font-medium text-gray-700 mb-2">Correlations</h4>
                          <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                              <thead className="bg-gray-50">
                                <tr>
                                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Column
                                  </th>
                                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Correlation
                                  </th>
                                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Strength
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-200">
                                {Object.entries(profile.correlations[selectedColumn])
                                  .filter(([col]) => col !== selectedColumn)
                                  .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
                                  .map(([col, value]) => (
                                    <tr 
                                      key={col} 
                                      className="hover:bg-gray-50 cursor-pointer"
                                      onClick={() => setSelectedColumn(col)}
                                    >
                                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        {col}
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {value.toFixed(4)}
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                          <div 
                                            className={`w-16 h-2 rounded-full ${
                                              value > 0 
                                                ? 'bg-green-100' 
                                                : 'bg-red-100'
                                            }`}
                                          >
                                            <div 
                                              className={`h-2 rounded-full ${
                                                value > 0 
                                                  ? 'bg-green-500' 
                                                  : 'bg-red-500'
                                              }`}
                                              style={{ width: `${Math.abs(value) * 100}%` }}
                                            ></div>
                                          </div>
                                          <span className="ml-2 text-xs text-gray-500">
                                            {Math.abs(value) > 0.7 
                                              ? 'Strong' 
                                              : Math.abs(value) > 0.3 
                                              ? 'Moderate' 
                                              : 'Weak'}
                                          </span>
                                        </div>
                                      </td>
                                    </tr>
                                  ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'issues' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-medium text-gray-700">Data Quality Issues</h4>
                <div className="flex items-center">
                  <button
                    onClick={() => setShowAllIssues(!showAllIssues)}
                    className="flex items-center text-sm text-indigo-600 hover:text-indigo-500"
                  >
                    {showAllIssues ? (
                      <>
                        <EyeOff className="w-4 h-4 mr-1" />
                        Show High Severity Only
                      </>
                    ) : (
                      <>
                        <Eye className="w-4 h-4 mr-1" />
                        Show All Issues
                      </>
                    )}
                  </button>
                </div>
              </div>
              
              {profile.dataQualityIssues.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8 bg-green-50 rounded-lg">
                  <Check className="w-8 h-8 text-green-500 mb-2" />
                  <p className="text-lg font-medium text-green-800">No data quality issues detected</p>
                  <p className="text-sm text-green-600">Your dataset looks clean and ready for analysis</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {profile.dataQualityIssues
                    .filter(issue => showAllIssues || issue.severity === 'high')
                    .map((issue, index) => (
                      <div 
                        key={index} 
                        className={`p-4 rounded-lg ${
                          issue.severity === 'high' 
                            ? 'bg-red-50 border border-red-200' 
                            : issue.severity === 'medium'
                            ? 'bg-amber-50 border border-amber-200'
                            : 'bg-blue-50 border border-blue-200'
                        }`}
                      >
                        <div className="flex items-start">
                          <div className="flex-shrink-0 mt-0.5">
                            {getIssueTypeIcon(issue.type)}
                          </div>
                          <div className="ml-3">
                            <div className="flex items-center">
                              <h3 className={`text-sm font-medium ${
                                issue.severity === 'high' 
                                  ? 'text-red-800' 
                                  : issue.severity === 'medium'
                                  ? 'text-amber-800'
                                  : 'text-blue-800'
                              }`}>
                                {issue.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                              </h3>
                              <span className={`ml-2 px-2 py-0.5 text-xs font-medium rounded-full ${
                                getIssueTypeColor(issue.severity)
                              }`}>
                                {issue.severity}
                              </span>
                            </div>
                            <div className={`mt-1 text-sm ${
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
                <div className="flex flex-col items-center justify-center p-8 bg-gray-50 rounded-lg">
                  <Check className="w-8 h-8 text-green-500 mb-2" />
                  <p className="text-lg font-medium text-gray-800">No recommendations needed</p>
                  <p className="text-sm text-gray-600">Your dataset is already well-prepared for analysis</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Group recommendations by type */}
                  {['missing_values', 'outliers', 'encoding', 'scaling', 'feature_selection', 'dimensionality_reduction'].map(type => {
                    const typeRecs = profile.recommendations.filter(rec => rec.type === type);
                    if (typeRecs.length === 0) return null;
                    
                    return (
                      <div key={type} className="space-y-2">
                        <h5 className="text-sm font-medium text-gray-700 flex items-center">
                          {getRecommendationTypeIcon(type)}
                          <span className="ml-2">{type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
                        </h5>
                        
                        {typeRecs.map((rec, index) => {
                          const recId = `${rec.type}-${rec.column || 'global'}-${rec.suggestedMethod}`;
                          const isSelected = selectedRecommendations.includes(recId);
                          
                          return (
                            <div 
                              key={index} 
                              className={`p-3 rounded-lg cursor-pointer ${
                                isSelected ? 'bg-indigo-50 border border-indigo-200' : 'bg-white border border-gray-200'
                              }`}
                              onClick={() => toggleRecommendation(rec)}
                            >
                              <div className="flex items-start">
                                <div className="flex-shrink-0">
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => toggleRecommendation(rec)}
                                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                  />
                                </div>
                                <div className="ml-3 flex-1">
                                  <div className="flex items-center justify-between">
                                    <p className="text-sm font-medium text-gray-900">
                                      {rec.suggestedMethod.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                      {rec.column && <span className="ml-1 text-gray-500">({rec.column})</span>}
                                    </p>
                                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                                      getRecommendationImpactColor(rec.impact)
                                    }`}>
                                      {rec.impact} impact
                                    </span>
                                  </div>
                                  <p className="mt-1 text-sm text-gray-600">{rec.description}</p>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              )}
              
              {selectedRecommendations.length > 0 && onApplyRecommendations && (
                <div className="flex justify-end mt-4">
                  <Button
                    onClick={handleApplyRecommendations}
                    icon={<ArrowRight className="w-4 h-4" />}
                  >
                    Apply {selectedRecommendations.length} Recommendations
                  </Button>
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

// Additional icons needed
const Search = (props: any) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <circle cx="11" cy="11" r="8"></circle>
    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
  </svg>
);

const Clock = (props: any) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <circle cx="12" cy="12" r="10"></circle>
    <polyline points="12 6 12 12 16 14"></polyline>
  </svg>
);

const FileText = (props: any) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
    <polyline points="14 2 14 8 20 8"></polyline>
    <line x1="16" y1="13" x2="8" y2="13"></line>
    <line x1="16" y1="17" x2="8" y2="17"></line>
    <polyline points="10 9 9 9 8 9"></polyline>
  </svg>
);

const Hash = (props: any) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <line x1="4" y1="9" x2="20" y2="9"></line>
    <line x1="4" y1="15" x2="20" y2="15"></line>
    <line x1="10" y1="3" x2="8" y2="21"></line>
    <line x1="16" y1="3" x2="14" y2="21"></line>
  </svg>
);

const TrendingUp = (props: any) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
    <polyline points="17 6 23 6 23 12"></polyline>
  </svg>
);

const Copy = (props: any) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
  </svg>
);

const Code = (props: any) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <polyline points="16 18 22 12 16 6"></polyline>
    <polyline points="8 6 2 12 8 18"></polyline>
  </svg>
);

const ArrowsExpand = (props: any) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <polyline points="15 3 21 3 21 9"></polyline>
    <polyline points="9 21 3 21 3 15"></polyline>
    <line x1="21" y1="3" x2="14" y2="10"></line>
    <line x1="3" y1="21" x2="10" y2="14"></line>
  </svg>
);

const Minimize2 = (props: any) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <polyline points="4 14 10 14 10 20"></polyline>
    <polyline points="20 10 14 10 14 4"></polyline>
    <line x1="14" y1="10" x2="21" y2="3"></line>
    <line x1="3" y1="21" x2="10" y2="14"></line>
  </svg>
);