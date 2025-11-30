import React, { useState, useEffect, useMemo } from 'react';
import {
  BarChart2,
  AlertTriangle,
  Check,
  Download,
  RefreshCw,
  Zap,
  FileText,
  Hash,
  Type,
  Calendar,
  ToggleLeft,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Target
} from 'lucide-react';
import Button from '../common/Button';
import { Dataset } from '../../types';
import {
  profileDataset,
  DataProfile,
  ColumnStats,
  PreprocessingRecommendation
} from '../../lib/dataProcessing';
import { Bar } from 'react-chartjs-2';
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
  const columnProfiles = useMemo(() => {
    return profile?.columns.reduce((acc, col) => {
      acc[col.name] = col;
      return acc;
    }, {} as Record<string, ColumnStats>) || {};
  }, [profile]);

  // Calculate overall data quality score
  const qualityScore = useMemo(() => {
    if (!profile) return 0;
    const issueCount = profile.dataQualityIssues?.length || 0;
    const colCount = profile.columns.length;
    const avgMissing = profile.columns.reduce((sum, col) => sum + col.missingPercent, 0) / colCount;
    
    // Score based on issues and missing data
    let score = 100;
    score -= issueCount * 5; // -5 per issue
    score -= avgMissing * 0.5; // -0.5 per % missing
    return Math.max(0, Math.min(100, Math.round(score)));
  }, [profile]);

  useEffect(() => {
    if (dataset && dataset.preview_data) {
      generateProfile();
    }
  }, [dataset]);

  const generateProfile = async () => {
    if (!dataset.preview_data || !dataset.preview_data.columns || !dataset.preview_data.rows) {
      toast.error('No preview data available');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const { columns, rows } = dataset.preview_data!;
      
      if (!Array.isArray(rows) || rows.length === 0) {
        toast.error('Dataset contains no data rows');
        setIsLoading(false);
        return;
      }
      
      await new Promise(resolve => setTimeout(resolve, 0));
      
      const dataProfile = profileDataset({ columns, rows });
      setProfile(dataProfile);
      setIsLoading(false);
      
      if (columns.length > 0 && !selectedColumn) {
        setSelectedColumn(columns[0]);
      }
      
      toast.success('Data profile generated successfully');
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
        return <Hash className="w-4 h-4" />;
      case 'categorical':
        return <Type className="w-4 h-4" />;
      case 'datetime':
        return <Calendar className="w-4 h-4" />;
      case 'boolean':
        return <ToggleLeft className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const getColumnTypeConfig = (type: string) => {
    switch (type) {
      case 'numeric':
        return { bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-400', icon: 'text-blue-400' };
      case 'categorical':
        return { bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-400', icon: 'text-emerald-400' };
      case 'datetime':
        return { bg: 'bg-purple-500/10', border: 'border-purple-500/30', text: 'text-purple-400', icon: 'text-purple-400' };
      case 'boolean':
        return { bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-400', icon: 'text-amber-400' };
      default:
        return { bg: 'bg-gray-500/10', border: 'border-gray-500/30', text: 'text-gray-400', icon: 'text-gray-400' };
    }
  };

  const getQualityScoreColor = (score: number) => {
    if (score >= 80) return { text: 'text-emerald-400', bg: 'bg-emerald-500', ring: 'ring-emerald-500/20' };
    if (score >= 60) return { text: 'text-amber-400', bg: 'bg-amber-500', ring: 'ring-amber-500/20' };
    return { text: 'text-red-400', bg: 'bg-red-500', ring: 'ring-red-500/20' };
  };

  const renderCategoricalDistribution = (column: ColumnStats) => {
    if ((column.type !== 'categorical' && column.type !== 'boolean') || !column.topValues || column.topValues.length === 0) return null;
    
    const topEntries = column.topValues.slice(0, 8);
    
    const data = {
      labels: topEntries.map(item => String(item.value).slice(0, 15)),
      datasets: [
        {
          data: topEntries.map(item => item.percent),
          backgroundColor: [
            'rgba(59, 130, 246, 0.8)',
            'rgba(16, 185, 129, 0.8)',
            'rgba(245, 158, 11, 0.8)',
            'rgba(139, 92, 246, 0.8)',
            'rgba(236, 72, 153, 0.8)',
            'rgba(6, 182, 212, 0.8)',
            'rgba(249, 115, 22, 0.8)',
            'rgba(168, 85, 247, 0.8)',
          ],
          borderWidth: 0,
          borderRadius: 4,
        },
      ],
    };
    
    const options = {
      responsive: true,
      maintainAspectRatio: false,
      indexAxis: 'y' as const,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(17, 24, 39, 0.95)',
          titleColor: '#fff',
          bodyColor: '#9ca3af',
          borderColor: 'rgba(75, 85, 99, 0.3)',
          borderWidth: 1,
          padding: 12,
          callbacks: {
            label: function(context: any) {
              return `${context.raw.toFixed(1)}%`;
            }
          }
        }
      },
      scales: {
        x: {
          grid: { color: 'rgba(75, 85, 99, 0.2)' },
          ticks: { color: '#9ca3af' }
        },
        y: {
          grid: { display: false },
          ticks: { color: '#e5e7eb' }
        }
      }
    };
    
    return (
      <div className="h-48">
        <Bar data={data} options={options} />
      </div>
    );
  };

  if (!dataset.preview_data) {
    return (
      <div className="bg-[#0a0f1a] rounded-2xl border border-gray-800 p-12">
        <div className="flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center mb-4">
            <AlertTriangle className="w-8 h-8 text-amber-400" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">No Data Available</h3>
          <p className="text-gray-400">This dataset doesn't have preview data for profiling</p>
        </div>
      </div>
    );
  }

  const scoreColors = getQualityScoreColor(qualityScore);

  return (
    <div className="bg-[#0a0f1a] rounded-2xl border border-gray-800 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-5 border-b border-gray-800 bg-gradient-to-r from-[#0a0f1a] to-[#111827]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <BarChart2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Data Profile</h2>
              <p className="text-sm text-gray-400 mt-0.5">{dataset.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={generateProfile}
              disabled={isLoading}
              className="border-gray-700 hover:border-gray-600 text-gray-300"
            >
              {isLoading ? (
                <RefreshCw className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-2" />
              )}
              {isLoading ? 'Analyzing...' : 'Refresh'}
            </Button>
            {profile && (
              <Button
                variant="outline"
                size="sm"
                className="border-gray-700 hover:border-gray-600 text-gray-300"
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
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            )}
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="p-16 flex flex-col items-center justify-center">
          <div className="relative">
            <div className="w-20 h-20 rounded-full border-4 border-gray-800 border-t-blue-500 animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-blue-400 animate-pulse" />
            </div>
          </div>
          <p className="text-lg font-medium text-white mt-6">Analyzing your data...</p>
          <p className="text-sm text-gray-500 mt-2">This may take a moment for large datasets</p>
        </div>
      ) : !profile ? (
        <div className="p-16 flex flex-col items-center justify-center">
          <div className="w-20 h-20 rounded-2xl bg-gray-800/50 flex items-center justify-center mb-6">
            <Target className="w-10 h-10 text-gray-600" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">Ready to Analyze</h3>
          <p className="text-gray-400 mb-6">Generate a comprehensive profile of your dataset</p>
          <Button onClick={generateProfile} className="bg-blue-600 hover:bg-blue-500">
            <Zap className="w-4 h-4 mr-2" />
            Generate Profile
          </Button>
        </div>
      ) : (
        <>
          {/* Quality Score Banner */}
          <div className="px-6 py-4 bg-gradient-to-r from-gray-900/50 to-transparent border-b border-gray-800/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                {/* Quality Score Circle */}
                <div className={`relative w-16 h-16 rounded-full ${scoreColors.ring} ring-4`}>
                  <svg className="w-16 h-16 transform -rotate-90">
                    <circle
                      cx="32"
                      cy="32"
                      r="28"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                      className="text-gray-800"
                    />
                    <circle
                      cx="32"
                      cy="32"
                      r="28"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                      strokeDasharray={`${qualityScore * 1.76} 176`}
                      className={scoreColors.text}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className={`text-lg font-bold ${scoreColors.text}`}>{qualityScore}</span>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-400">Data Quality Score</p>
                  <p className={`text-lg font-semibold ${scoreColors.text}`}>
                    {qualityScore >= 80 ? 'Excellent' : qualityScore >= 60 ? 'Good' : 'Needs Attention'}
                  </p>
                </div>
              </div>
              
              {/* Quick Stats */}
              <div className="flex items-center gap-8">
                <div className="text-center">
                  <p className="text-2xl font-bold text-white">{profile.totalRows.toLocaleString()}</p>
                  <p className="text-xs text-gray-500 uppercase tracking-wider">Rows</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-white">{profile.columns.length}</p>
                  <p className="text-xs text-gray-500 uppercase tracking-wider">Columns</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-amber-400">{profile.dataQualityIssues?.length || 0}</p>
                  <p className="text-xs text-gray-500 uppercase tracking-wider">Issues</p>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="px-6 border-b border-gray-800">
            <nav className="flex gap-1">
              {[
                { id: 'overview', label: 'Overview', icon: BarChart2 },
                { id: 'columns', label: 'Columns', icon: FileText },
                { id: 'issues', label: 'Issues', icon: AlertCircle, count: profile.dataQualityIssues?.length },
                { id: 'recommendations', label: 'Recommendations', icon: Sparkles, count: profile.recommendations?.length }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-400'
                      : 'border-transparent text-gray-500 hover:text-gray-300'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                  {tab.count !== undefined && tab.count > 0 && (
                    <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${
                      tab.id === 'issues' ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'
                    }`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Column Type Distribution */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Column Types</h3>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    {['numeric', 'categorical', 'datetime', 'boolean', 'text'].map(type => {
                      const count = Object.values(columnProfiles).filter((col: ColumnStats) => col.type === type).length;
                      if (count === 0) return null;
                      const config = getColumnTypeConfig(type);
                      
                      return (
                        <div key={type} className={`p-4 rounded-xl ${config.bg} border ${config.border}`}>
                          <div className="flex items-center gap-2 mb-2">
                            <span className={config.icon}>{getColumnTypeIcon(type)}</span>
                            <span className={`text-sm font-medium ${config.text} capitalize`}>{type}</span>
                          </div>
                          <p className="text-2xl font-bold text-white">{count}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Column Overview Table */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Column Overview</h3>
                  <div className="overflow-x-auto rounded-xl border border-gray-800">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gray-900/50 border-b border-gray-800">
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Column</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Type</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Missing</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Unique</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Sample Values</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-800">
                        {Object.entries(columnProfiles).map(([name, col]) => {
                          const config = getColumnTypeConfig(col.type);
                          return (
                            <tr key={name} className="hover:bg-gray-900/30 transition-colors">
                              <td className="px-4 py-3">
                                <span className="text-sm font-medium text-white">{name}</span>
                              </td>
                              <td className="px-4 py-3">
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${config.bg} ${config.text} ${config.border} border`}>
                                  {getColumnTypeIcon(col.type)}
                                  {col.type}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  <div className="w-16 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                                    <div 
                                      className={`h-full rounded-full ${col.missingPercent > 10 ? 'bg-red-500' : col.missingPercent > 0 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                                      style={{ width: `${Math.min(100, col.missingPercent)}%` }}
                                    />
                                  </div>
                                  <span className={`text-xs font-medium ${col.missingPercent > 10 ? 'text-red-400' : col.missingPercent > 0 ? 'text-amber-400' : 'text-gray-400'}`}>
                                    {col.missingPercent.toFixed(1)}%
                                  </span>
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <span className="text-sm text-gray-300">{col.unique.toLocaleString()}</span>
                                <span className="text-xs text-gray-500 ml-1">({col.uniquePercent.toFixed(0)}%)</span>
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-1.5">
                                  {col.topValues?.slice(0, 3).map((v, i) => (
                                    <span key={i} className="px-2 py-0.5 bg-gray-800 rounded text-xs text-gray-300 truncate max-w-[80px]">
                                      {String(v.value)}
                                    </span>
                                  ))}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'columns' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Column Selector */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Select Column</h3>
                  <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
                    {Object.keys(columnProfiles).map((column) => {
                      const col = columnProfiles[column];
                      const config = getColumnTypeConfig(col.type);
                      return (
                        <button
                          key={column}
                          onClick={() => setSelectedColumn(column)}
                          className={`w-full text-left px-4 py-3 rounded-xl border transition-all ${
                            selectedColumn === column
                              ? 'border-blue-500 bg-blue-500/10'
                              : 'border-gray-800 bg-gray-900/30 hover:border-gray-700 hover:bg-gray-900/50'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-white truncate">{column}</span>
                            <span className={`flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${config.bg} ${config.text}`}>
                              {getColumnTypeIcon(col.type)}
                              {col.type}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                            <span>{col.count} values</span>
                            <span>{col.missingPercent.toFixed(1)}% missing</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Column Details */}
                {selectedColumn && columnProfiles[selectedColumn] && (
                  <div className="lg:col-span-2 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      {/* Statistics Card */}
                      <div className="p-5 bg-gray-900/30 rounded-xl border border-gray-800">
                        <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Statistics</h4>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center py-2 border-b border-gray-800/50">
                            <span className="text-sm text-gray-400">Type</span>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${getColumnTypeConfig(columnProfiles[selectedColumn].type).bg} ${getColumnTypeConfig(columnProfiles[selectedColumn].type).text}`}>
                              {columnProfiles[selectedColumn].type}
                            </span>
                          </div>
                          <div className="flex justify-between items-center py-2 border-b border-gray-800/50">
                            <span className="text-sm text-gray-400">Count</span>
                            <span className="text-sm font-semibold text-white">{columnProfiles[selectedColumn].count.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between items-center py-2 border-b border-gray-800/50">
                            <span className="text-sm text-gray-400">Missing</span>
                            <span className={`text-sm font-semibold ${columnProfiles[selectedColumn].missingPercent > 10 ? 'text-red-400' : 'text-white'}`}>
                              {columnProfiles[selectedColumn].missing.toLocaleString()} ({columnProfiles[selectedColumn].missingPercent.toFixed(1)}%)
                            </span>
                          </div>
                          <div className="flex justify-between items-center py-2 border-b border-gray-800/50">
                            <span className="text-sm text-gray-400">Unique</span>
                            <span className="text-sm font-semibold text-white">
                              {columnProfiles[selectedColumn].unique.toLocaleString()} ({columnProfiles[selectedColumn].uniquePercent.toFixed(1)}%)
                            </span>
                          </div>

                          {columnProfiles[selectedColumn].type === 'numeric' && columnProfiles[selectedColumn].mean !== undefined && (
                            <>
                              <div className="flex justify-between items-center py-2 border-b border-gray-800/50">
                                <span className="text-sm text-gray-400">Mean</span>
                                <span className="text-sm font-semibold text-blue-400">{columnProfiles[selectedColumn].mean?.toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between items-center py-2 border-b border-gray-800/50">
                                <span className="text-sm text-gray-400">Median</span>
                                <span className="text-sm font-semibold text-blue-400">{columnProfiles[selectedColumn].median?.toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between items-center py-2 border-b border-gray-800/50">
                                <span className="text-sm text-gray-400">Std Dev</span>
                                <span className="text-sm font-semibold text-white">{columnProfiles[selectedColumn].std?.toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between items-center py-2">
                                <span className="text-sm text-gray-400">Range</span>
                                <span className="text-sm font-semibold text-white">
                                  {columnProfiles[selectedColumn].min} → {columnProfiles[selectedColumn].max}
                                </span>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                      
                      {/* Distribution Card */}
                      <div className="p-5 bg-gray-900/30 rounded-xl border border-gray-800">
                        <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Distribution</h4>
                        {(columnProfiles[selectedColumn].type === 'categorical' || columnProfiles[selectedColumn].type === 'boolean') ? (
                          renderCategoricalDistribution(columnProfiles[selectedColumn])
                        ) : columnProfiles[selectedColumn].type === 'numeric' ? (
                          <div className="h-48 flex flex-col items-center justify-center text-center">
                            <TrendingUp className="w-10 h-10 text-gray-700 mb-3" />
                            <p className="text-sm text-gray-500">Numeric distribution</p>
                            <p className="text-xs text-gray-600 mt-1">
                              Min: {columnProfiles[selectedColumn].min} | Max: {columnProfiles[selectedColumn].max}
                            </p>
                          </div>
                        ) : (
                          <div className="h-48 flex items-center justify-center">
                            <p className="text-sm text-gray-500">No visualization available</p>
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
                  <div className="p-12 flex flex-col items-center justify-center text-center rounded-xl bg-emerald-500/5 border border-emerald-500/20">
                    <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-4">
                      <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2">No Issues Detected</h3>
                    <p className="text-gray-400">Your dataset looks clean and ready for analysis!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {profile.dataQualityIssues.map((issue, index) => {
                      const severityConfig = {
                        high: { bg: 'bg-red-500/10', border: 'border-red-500/30', icon: 'text-red-400', text: 'text-red-300' },
                        medium: { bg: 'bg-amber-500/10', border: 'border-amber-500/30', icon: 'text-amber-400', text: 'text-amber-300' },
                        low: { bg: 'bg-blue-500/10', border: 'border-blue-500/30', icon: 'text-blue-400', text: 'text-blue-300' }
                      }[issue.severity] || { bg: 'bg-gray-500/10', border: 'border-gray-500/30', icon: 'text-gray-400', text: 'text-gray-300' };
                      
                      return (
                        <div key={index} className={`p-5 rounded-xl ${severityConfig.bg} border ${severityConfig.border}`}>
                          <div className="flex items-start gap-4">
                            <div className={`p-2 rounded-lg ${severityConfig.bg}`}>
                              <AlertTriangle className={`w-5 h-5 ${severityConfig.icon}`} />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="text-base font-semibold text-white capitalize">
                                  {issue.type.replace(/_/g, ' ')}
                                </h4>
                                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${severityConfig.bg} ${severityConfig.icon} border ${severityConfig.border}`}>
                                  {issue.severity}
                                </span>
                              </div>
                              {issue.column && (
                                <p className="text-sm text-gray-400 mb-2">
                                  Column: <span className="font-medium text-white">{issue.column}</span>
                                </p>
                              )}
                              <p className={`text-sm ${severityConfig.text}`}>{issue.description}</p>
                              {issue.affectedRows && (
                                <p className="text-xs text-gray-500 mt-2">
                                  Affects {issue.affectedRows.toLocaleString()} rows ({((issue.affectedRows / profile.totalRows) * 100).toFixed(1)}% of data)
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'recommendations' && (
              <div className="space-y-4">
                {profile.recommendations.length === 0 ? (
                  <div className="p-12 flex flex-col items-center justify-center text-center rounded-xl bg-emerald-500/5 border border-emerald-500/20">
                    <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-4">
                      <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2">Ready for Modeling</h3>
                    <p className="text-gray-400">Your dataset doesn't need any preprocessing!</p>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-sm text-gray-400">
                        Select recommendations to apply automated preprocessing
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-gray-700 text-gray-300"
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
                          className="bg-blue-600 hover:bg-blue-500"
                        >
                          <Zap className="w-4 h-4 mr-2" />
                          Apply ({selectedRecommendations.length})
                        </Button>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      {profile.recommendations.map((rec, index) => {
                        const recId = `${rec.type}-${rec.column || 'global'}-${rec.suggestedMethod}`;
                        const isSelected = selectedRecommendations.includes(recId);
                        
                        return (
                          <div
                            key={index}
                            onClick={() => toggleRecommendation(rec)}
                            className={`p-5 rounded-xl border cursor-pointer transition-all ${
                              isSelected
                                ? 'border-blue-500 bg-blue-500/10'
                                : 'border-gray-800 bg-gray-900/30 hover:border-gray-700'
                            }`}
                          >
                            <div className="flex items-start gap-4">
                              <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                                isSelected
                                  ? 'border-blue-500 bg-blue-500'
                                  : 'border-gray-600'
                              }`}>
                                {isSelected && <Check className="w-4 h-4 text-white" />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-2">
                                  <h4 className="text-base font-semibold text-white capitalize">
                                    {rec.type.replace(/_/g, ' ')}
                                  </h4>
                                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                                    rec.priority === 'high' ? 'bg-emerald-500/20 text-emerald-400' :
                                    rec.priority === 'medium' ? 'bg-blue-500/20 text-blue-400' :
                                    'bg-gray-500/20 text-gray-400'
                                  }`}>
                                    {rec.priority} priority
                                  </span>
                                </div>
                                {rec.column && (
                                  <p className="text-sm text-gray-400 mb-1">
                                    Column: <span className="font-medium text-white">{rec.column}</span>
                                  </p>
                                )}
                                <p className="text-sm text-gray-400">{rec.description}</p>
                                <div className="mt-3 flex items-center gap-2">
                                  <span className="text-xs text-gray-500">Method:</span>
                                  <span className="px-2 py-0.5 bg-gray-800 rounded text-xs font-medium text-blue-400">
                                    {rec.suggestedMethod}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default DataProfiler;
