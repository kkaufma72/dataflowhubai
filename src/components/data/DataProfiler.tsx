import React, { useState, useEffect } from 'react';
import { Card } from '../common/Card';
import {
  BarChart2,
  PieChart,
  AlertTriangle,
  Check,
  Download,
  RefreshCw,
  Zap,
  Clock,
  FileText
} from 'lucide-react';
import Button from '../common/Button';
import { Dataset } from '../../types';
import {
  profileDataset,
  DataProfile,
  ColumnStats,
  PreprocessingRecommendation
} from '../../lib/dataProcessing';
import { Pie } from 'react-chartjs-2';
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
  const [selectedRecommendations, setSelectedRecommendations] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'columns' | 'issues' | 'recommendations'>('overview');

  // Helper to convert columns array to object for easier lookup
  const columnProfiles = profile?.columns.reduce((acc, col) => {
    acc[col.name] = col;
    return acc;
  }, {} as Record<string, any>) || {};

  useEffect(() => {
    if (dataset && dataset.preview_data) {
      generateProfile();
    }
  }, [dataset]);

  // OPTIMIZED: Async processing to prevent UI blocking
  const generateProfile = async () => {
    console.log('🔍 DataProfiler - Generating profile for dataset:', dataset.name);
    console.log('📊 Dataset structure:', {
      hasPreviewData: !!dataset.preview_data,
      previewData: dataset.preview_data
    });
    
    // Validate preview_data structure
    if (!dataset.preview_data || !dataset.preview_data.columns || !dataset.preview_data.rows) {
      console.error('❌ No preview data:', {
        hasPreviewData: !!dataset.preview_data,
        hasColumns: dataset.preview_data?.columns,
        hasRows: dataset.preview_data?.rows
      });
      toast.error('No preview data available');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const { columns, rows } = dataset.preview_data!;
      
      console.log('✅ Preview data extracted:', {
        columnsCount: columns.length,
        rowsCount: rows.length,
        columnsType: Array.isArray(columns),
        rowsType: Array.isArray(rows)
      });
      
      // Validate rows is an array with data
      if (!Array.isArray(rows) || rows.length === 0) {
        console.error('❌ Invalid rows:', { isArray: Array.isArray(rows), length: rows?.length });
        toast.error('Dataset contains no data rows');
        setIsLoading(false);
        return;
      }
      
      // OPTIMIZATION: Use requestIdleCallback or setTimeout to prevent blocking
      // This allows the UI to stay responsive during heavy computation
      await new Promise(resolve => setTimeout(resolve, 0));
      
      // FIXED: Pass correct argument format
      const dataProfile = profileDataset({ columns, rows });
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
        return <Clock className="w-4 h-4 text-primary" />;
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
        return 'bg-primary/10 text-primary-800';
      case 'boolean':
        return 'bg-amber-100 text-amber-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getIssueTypeIcon = () => {
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

  const renderColumnHistogram = () => {
    // Histogram data not available in current ColumnStats structure
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-sm text-gray-400">Histogram visualization coming soon</p>
      </div>
    );
  };

  const renderCategoricalDistribution = (column: ColumnStats) => {
    if ((column.type !== 'categorical' && column.type !== 'boolean') || !column.topValues || column.topValues.length === 0) return null;
    
    const topEntries = column.topValues.slice(0, 10);
    
    const data = {
      labels: topEntries.map(item => String(item.value)),
      datasets: [
        {
          data: topEntries.map(item => item.percent),
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
          <div className="flex items-center justify-center w-10 h-10 bg-primary/10 rounded-lg">
            <BarChart2 className="w-6 h-6 text-primary-600" />
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
        <div className="flex flex-col items-center justify-center p-12 bg-gray-900/50 rounded-lg border border-gray-800">
          <RefreshCw className="w-10 h-10 text-blue-400 animate-spin mb-4" />
          <p className="text-lg font-medium text-gray-300">Generating data profile...</p>
        </div>
      ) : !profile ? (
        <div className="flex flex-col items-center justify-center p-12 bg-gray-900/50 rounded-lg border border-gray-800">
          <AlertTriangle className="w-10 h-10 text-amber-400 mb-4" />
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
            <div className="border-b border-gray-800">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`py-4 px-1 border-b-2 font-semibold text-sm transition-colors ${
                    activeTab === 'overview'
                      ? 'border-blue-500 text-blue-400'
                      : 'border-transparent text-gray-500 hover:text-gray-300 hover:border-gray-600'
                  }`}
                >
                  Overview
                </button>
                <button
                  onClick={() => setActiveTab('columns')}
                  className={`py-4 px-1 border-b-2 font-semibold text-sm transition-colors ${
                    activeTab === 'columns'
                      ? 'border-blue-500 text-blue-400'
                      : 'border-transparent text-gray-500 hover:text-gray-300 hover:border-gray-600'
                  }`}
                >
                  Columns
                </button>
                <button
                  onClick={() => setActiveTab('issues')}
                  className={`py-4 px-1 border-b-2 font-semibold text-sm transition-colors ${
                    activeTab === 'issues'
                      ? 'border-blue-500 text-blue-400'
                      : 'border-transparent text-gray-500 hover:text-gray-300 hover:border-gray-600'
                  }`}
                >
                  <div className="flex items-center">
                    Issues
                    {profile?.dataQualityIssues && profile.dataQualityIssues.length > 0 && (
                      <span className="ml-2 px-2 py-1 text-xs font-bold rounded-md bg-amber-500/20 border border-amber-500/30 text-amber-400">
                        {profile.dataQualityIssues.length}
                      </span>
                    )}
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab('recommendations')}
                  className={`py-4 px-1 border-b-2 font-semibold text-sm transition-colors ${
                    activeTab === 'recommendations'
                      ? 'border-blue-500 text-blue-400'
                      : 'border-transparent text-gray-500 hover:text-gray-300 hover:border-gray-600'
                  }`}
                >
                  <div className="flex items-center">
                    Recommendations
                    {profile?.recommendations && profile.recommendations.length > 0 && (
                      <span className="ml-2 px-2 py-1 text-xs font-bold rounded-md bg-emerald-500/20 border border-emerald-500/30 text-emerald-400">
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
                <div className="p-5 bg-gray-900/50 rounded-lg border border-gray-800 hover:border-gray-700 transition-all">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Rows</p>
                  <p className="mt-2 text-3xl font-bold text-white">{profile.totalRows.toLocaleString()}</p>
                </div>
                <div className="p-5 bg-gray-900/50 rounded-lg border border-gray-800 hover:border-gray-700 transition-all">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Columns</p>
                  <p className="mt-2 text-3xl font-bold text-white">{profile.columns.length}</p>
                </div>
                <div className="p-5 bg-gray-900/50 rounded-lg border border-gray-800 hover:border-amber-500/30 transition-all">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Quality Issues</p>
                  <p className="mt-2 text-3xl font-bold text-amber-400">{profile.dataQualityIssues?.length || 0}</p>
                </div>
                <div className="p-5 bg-gray-900/50 rounded-lg border border-gray-800 hover:border-emerald-500/30 transition-all">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Recommendations</p>
                  <p className="mt-2 text-3xl font-bold text-emerald-400">{profile.recommendations?.length || 0}</p>
                </div>
              </div>

              <div>
                <h4 className="text-base font-bold text-white mb-4">Column Types</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                  {['numeric', 'categorical', 'datetime', 'boolean', 'text'].map(type => {
                    const count = Object.values(columnProfiles).filter((col: any) => col.type === type).length;
                    if (count === 0) return null;
                    
                    return (
                      <div key={type} className="p-4 bg-gray-900/50 rounded-lg border border-gray-800 hover:border-blue-500/30 transition-all">
                        <div className="flex items-center gap-2">
                          {getColumnTypeIcon(type)}
                          <span className="text-sm font-semibold text-gray-300 capitalize">{type}</span>
                        </div>
                        <p className="mt-3 text-2xl font-bold text-white">{count}</p>
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
                <h4 className="text-base font-bold text-white mb-4">Select Column</h4>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {Object.keys(columnProfiles).map((column) => (
                    <button
                      key={column}
                      onClick={() => setSelectedColumn(column)}
                      className={`w-full text-left px-4 py-3 rounded-lg border transition-all ${
                        selectedColumn === column
                          ? 'border-blue-500 bg-blue-500/10'
                          : 'border-gray-800 bg-gray-900/50 hover:border-gray-700 hover:bg-gray-900'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-white">{column}</span>
                        <span className={`px-2 py-1 text-xs font-bold rounded ${
                          getColumnTypeColor(columnProfiles[column].type)
                        }`}>
                          {columnProfiles[column].type}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {selectedColumn && columnProfiles[selectedColumn] && (
                <div className="lg:col-span-2 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-5 bg-gray-900/50 rounded-lg border border-gray-800">
                      <h4 className="text-base font-bold text-white mb-4">Statistics</h4>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-gray-400">Type</span>
                          <span className={`px-2 py-1 text-xs font-bold rounded ${
                            getColumnTypeColor(columnProfiles[selectedColumn].type)
                          }`}>
                            {columnProfiles[selectedColumn].type}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-gray-400">Count</span>
                          <span className="text-sm font-bold text-white">{columnProfiles[selectedColumn].count}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-gray-400">Missing</span>
                          <span className="text-sm font-bold text-white">
                            {columnProfiles[selectedColumn].missing} ({columnProfiles[selectedColumn].missingPercent.toFixed(1)}%)
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-gray-400">Unique</span>
                          <span className="text-sm font-bold text-white">
                            {columnProfiles[selectedColumn].unique} ({columnProfiles[selectedColumn].uniquePercent.toFixed(1)}%)
                          </span>
                        </div>

                        {columnProfiles[selectedColumn].type === 'numeric' && (
                          <>
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-medium text-gray-400">Mean</span>
                              <span className="text-sm font-bold text-white">{columnProfiles[selectedColumn].stats.mean?.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-medium text-gray-400">Median</span>
                              <span className="text-sm font-bold text-white">{columnProfiles[selectedColumn].stats.median?.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-medium text-gray-400">Std Dev</span>
                              <span className="text-sm font-bold text-white">{columnProfiles[selectedColumn].stats.std?.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-medium text-gray-400">Min</span>
                              <span className="text-sm font-bold text-white">{columnProfiles[selectedColumn].stats.min}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-medium text-gray-400">Max</span>
                              <span className="text-sm font-bold text-white">{columnProfiles[selectedColumn].stats.max}</span>
                            </div>
                          </>
                        )}
                            
                        {columnProfiles[selectedColumn].type === 'datetime' && (
                          <>
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-medium text-gray-400">Min Date</span>
                              <span className="text-sm font-bold text-white">
                                {new Date(columnProfiles[selectedColumn].stats.min as string).toLocaleDateString()}
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-medium text-gray-400">Max Date</span>
                              <span className="text-sm font-bold text-white">
                                {new Date(columnProfiles[selectedColumn].stats.max as string).toLocaleDateString()}
                              </span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                    
                    <div className="p-5 bg-gray-900/50 rounded-lg border border-gray-800">
                      <h4 className="text-base font-bold text-white mb-4">Distribution</h4>
                      {columnProfiles[selectedColumn].type === 'numeric' ? (
                        renderColumnHistogram()
                      ) : (columnProfiles[selectedColumn].type === 'categorical' || 
                           columnProfiles[selectedColumn].type === 'boolean') ? (
                        renderCategoricalDistribution(columnProfiles[selectedColumn])
                      ) : (
                        <div className="flex items-center justify-center h-64">
                          <p className="text-sm text-gray-400">No distribution visualization available for this column type</p>
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
              {!profile.dataQualityIssues || profile.dataQualityIssues.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 bg-gray-900/50 rounded-lg border border-gray-800">
                  <Check className="w-16 h-16 text-emerald-400 mb-4" />
                  <p className="text-xl font-bold text-white">No data quality issues detected</p>
                  <p className="text-sm text-gray-400 mt-2">Your dataset looks good!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {profile.dataQualityIssues.map((issue, index) => (
                    <div key={index} className={`p-5 rounded-lg border ${
                      issue.severity === 'high' 
                        ? 'border-red-500/50 bg-red-500/10' 
                        : issue.severity === 'medium'
                        ? 'border-amber-500/50 bg-amber-500/10'
                        : 'border-blue-500/50 bg-blue-500/10'
                    }`}>
                      <div className="flex items-start">
                        <div className="flex-shrink-0">
                          {getIssueTypeIcon()}
                        </div>
                        <div className="ml-3 flex-1">
                          <div className="flex items-center justify-between">
                            <h4 className="text-base font-bold text-white">{issue.type.replace(/_/g, ' ')}</h4>
                            <span className={`px-3 py-1 text-xs font-bold rounded-md ${getIssueTypeColor(issue.severity)}`}>
                              {issue.severity}
                            </span>
                          </div>
                          {issue.column && (
                            <p className="text-sm font-semibold text-gray-300 mt-2">Column: {issue.column}</p>
                          )}
                          <div className={`mt-3 text-sm font-medium ${
                            issue.severity === 'high' 
                              ? 'text-red-300' 
                              : issue.severity === 'medium'
                              ? 'text-amber-300'
                              : 'text-blue-300'
                          }`}>
                            <p>{issue.description}</p>
                            {issue.affectedRows && (
                              <p className="mt-2">
                                Affects {issue.affectedRows.toLocaleString()} rows 
                                ({((issue.affectedRows / profile.totalRows) * 100).toFixed(1)}% of data)
                              </p>
                            )}
                          </div>
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
                            ? 'border-primary bg-primary/5'
                            : 'border-gray-200 hover:border-gray-300 bg-white'
                        }`}
                      >
                        <div className="flex items-start">
                          <div className="flex-shrink-0 mt-0.5">
                            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                              isSelected
                                ? 'border-primary bg-primary'
                                : 'border-gray-300'
                            }`}>
                              {isSelected && <Check className="w-3 h-3 text-white" />}
                            </div>
                          </div>
                          <div className="ml-3 flex-1">
                            <div className="flex items-center justify-between">
                              <h4 className="text-sm font-medium text-gray-900">{rec.type.replace(/_/g, ' ')}</h4>
                              <span className={`px-2 py-1 text-xs font-medium rounded ${getRecommendationImpactColor(rec.priority)}`}>
                                {rec.priority} priority
                              </span>
                            </div>
                            {rec.column && (
                              <p className="text-sm font-medium text-gray-700 mt-1">Column: {rec.column}</p>
                            )}
                            <p className="text-sm text-gray-600 mt-2">{rec.description}</p>
                            <p className="text-sm font-medium text-primary-600 mt-2">Method: {rec.suggestedMethod}</p>
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