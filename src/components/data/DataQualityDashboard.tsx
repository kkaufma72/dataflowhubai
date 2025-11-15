import React, { useMemo } from 'react';
import { Dataset } from '../../types';
import { 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  TrendingUp, 
  Database,
  Percent,
  Hash,
  Calendar,
  Type,
  BarChart3,
  AlertCircle,
  Info,
  Sparkles
} from 'lucide-react';

interface DataQualityDashboardProps {
  dataset: Dataset;
  onFixIssue?: (issue: string) => void;
}

interface QualityMetric {
  category: string;
  score: number;
  status: 'excellent' | 'good' | 'warning' | 'critical';
  issues: string[];
  strengths: string[];
}

interface ColumnAnalysis {
  name: string;
  type: 'numeric' | 'text' | 'date' | 'categorical' | 'boolean';
  nullCount: number;
  nullPercentage: number;
  uniqueCount: number;
  uniquePercentage: number;
  hasOutliers?: boolean;
  inconsistentFormat?: boolean;
}

const DataQualityDashboard: React.FC<DataQualityDashboardProps> = ({ dataset, onFixIssue }) => {
  
  // Analyze dataset quality
  const qualityAnalysis = useMemo(() => {
    if (!dataset.preview_data?.rows || !dataset.preview_data?.columns) {
      return null;
    }

    const { rows, columns } = dataset.preview_data;
    const totalRows = rows.length;
    
    // Analyze each column
    const columnAnalyses: ColumnAnalysis[] = columns.map((colName, colIndex) => {
      const values = rows.map(row => row[colIndex]);
      const nonNullValues = values.filter(v => v !== null && v !== undefined && v !== '');
      const uniqueValues = new Set(nonNullValues);
      
      const nullCount = totalRows - nonNullValues.length;
      const nullPercentage = (nullCount / totalRows) * 100;
      const uniqueCount = uniqueValues.size;
      const uniquePercentage = (uniqueCount / totalRows) * 100;
      
      // Detect column type
      let type: ColumnAnalysis['type'] = 'text';
      const sampleValues = nonNullValues.slice(0, 10);
      
      if (sampleValues.every(v => !isNaN(Number(v)))) {
        type = 'numeric';
      } else if (sampleValues.every(v => !isNaN(Date.parse(String(v))))) {
        type = 'date';
      } else if (uniqueCount <= Math.min(10, totalRows * 0.5)) {
        type = 'categorical';
      } else if (sampleValues.every(v => String(v).toLowerCase() === 'true' || String(v).toLowerCase() === 'false')) {
        type = 'boolean';
      }
      
      // Detect outliers for numeric columns
      let hasOutliers = false;
      if (type === 'numeric') {
        const numValues = nonNullValues.map(Number).sort((a, b) => a - b);
        const q1 = numValues[Math.floor(numValues.length * 0.25)];
        const q3 = numValues[Math.floor(numValues.length * 0.75)];
        const iqr = q3 - q1;
        const lowerBound = q1 - 1.5 * iqr;
        const upperBound = q3 + 1.5 * iqr;
        hasOutliers = numValues.some(v => v < lowerBound || v > upperBound);
      }
      
      // Detect inconsistent formats
      const inconsistentFormat = type === 'date' && uniqueCount > totalRows * 0.1;
      
      return {
        name: colName,
        type,
        nullCount,
        nullPercentage,
        uniqueCount,
        uniquePercentage,
        hasOutliers,
        inconsistentFormat
      };
    });
    
    // Calculate quality metrics
    const completenessScore = columnAnalyses.reduce((sum, col) => sum + (100 - col.nullPercentage), 0) / columns.length;
    const uniquenessScore = columnAnalyses.reduce((sum, col) => {
      if (col.type === 'categorical') return sum + 100; // Expected low uniqueness
      return sum + Math.min(col.uniquePercentage, 100);
    }, 0) / columns.length;
    
    const consistencyIssues = columnAnalyses.filter(col => col.inconsistentFormat).length;
    const consistencyScore = 100 - (consistencyIssues / columns.length) * 100;
    
    const outlierIssues = columnAnalyses.filter(col => col.hasOutliers).length;
    const validityScore = 100 - (outlierIssues / columns.length) * 50;
    
    const overallScore = (completenessScore + uniquenessScore + consistencyScore + validityScore) / 4;
    
    // Identify issues and strengths
    const completenessIssues: string[] = [];
    const completenessStrengths: string[] = [];
    
    columnAnalyses.forEach(col => {
      if (col.nullPercentage > 50) {
        completenessIssues.push(`${col.name}: ${col.nullPercentage.toFixed(1)}% missing values`);
      } else if (col.nullPercentage === 0) {
        completenessStrengths.push(`${col.name}: 100% complete`);
      }
    });
    
    const uniquenessIssues: string[] = [];
    const uniquenessStrengths: string[] = [];
    
    columnAnalyses.forEach(col => {
      if (col.type !== 'categorical' && col.uniquePercentage < 10) {
        uniquenessIssues.push(`${col.name}: Only ${col.uniqueCount} unique values`);
      } else if (col.uniquePercentage === 100) {
        uniquenessStrengths.push(`${col.name}: All values unique`);
      }
    });
    
    const consistencyIssuesList = columnAnalyses
      .filter(col => col.inconsistentFormat)
      .map(col => `${col.name}: Inconsistent date formats detected`);
      
    const validityIssues = columnAnalyses
      .filter(col => col.hasOutliers)
      .map(col => `${col.name}: Contains potential outliers`);
    
    const metrics: QualityMetric[] = [
      {
        category: 'Completeness',
        score: completenessScore,
        status: completenessScore >= 95 ? 'excellent' : completenessScore >= 85 ? 'good' : completenessScore >= 70 ? 'warning' : 'critical',
        issues: completenessIssues,
        strengths: completenessStrengths.slice(0, 3)
      },
      {
        category: 'Uniqueness',
        score: uniquenessScore,
        status: uniquenessScore >= 90 ? 'excellent' : uniquenessScore >= 75 ? 'good' : uniquenessScore >= 60 ? 'warning' : 'critical',
        issues: uniquenessIssues,
        strengths: uniquenessStrengths.slice(0, 3)
      },
      {
        category: 'Consistency',
        score: consistencyScore,
        status: consistencyScore >= 95 ? 'excellent' : consistencyScore >= 85 ? 'good' : consistencyScore >= 70 ? 'warning' : 'critical',
        issues: consistencyIssuesList,
        strengths: consistencyIssuesList.length === 0 ? ['All columns have consistent formatting'] : []
      },
      {
        category: 'Validity',
        score: validityScore,
        status: validityScore >= 95 ? 'excellent' : validityScore >= 85 ? 'good' : validityScore >= 70 ? 'warning' : 'critical',
        issues: validityIssues,
        strengths: validityIssues.length === 0 ? ['No outliers detected'] : []
      }
    ];
    
    return {
      overallScore,
      metrics,
      columnAnalyses,
      totalRows,
      totalColumns: columns.length
    };
  }, [dataset]);

  if (!qualityAnalysis) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">No data available for quality analysis</p>
      </div>
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600 bg-green-50 border-green-200';
    if (score >= 75) return 'text-blue-600 bg-blue-50 border-blue-200';
    if (score >= 60) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getStatusIcon = (status: QualityMetric['status']) => {
    switch (status) {
      case 'excellent':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'good':
        return <CheckCircle className="w-5 h-5 text-blue-600" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case 'critical':
        return <XCircle className="w-5 h-5 text-red-600" />;
    }
  };

  const getTypeIcon = (type: ColumnAnalysis['type']) => {
    switch (type) {
      case 'numeric':
        return <Hash className="w-4 h-4 text-blue-600" />;
      case 'text':
        return <Type className="w-4 h-4 text-gray-600" />;
      case 'date':
        return <Calendar className="w-4 h-4 text-primary-600" />;
      case 'categorical':
        return <BarChart3 className="w-4 h-4 text-green-600" />;
      case 'boolean':
        return <CheckCircle className="w-4 h-4 text-primary-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Overall Score */}
      <div className="bg-gradient-to-r from-primary/5 to-primary/5 rounded-lg p-6 border border-primary/10">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <Sparkles className="w-6 h-6 text-primary-600" />
              <h3 className="text-lg font-semibold text-gray-900">Data Quality Score</h3>
            </div>
            <p className="text-sm text-gray-600">
              Based on {qualityAnalysis.totalRows.toLocaleString()} rows and {qualityAnalysis.totalColumns} columns
            </p>
          </div>
          <div className="text-center">
            <div className={`text-5xl font-bold ${getScoreColor(qualityAnalysis.overallScore).split(' ')[0]}`}>
              {Math.round(qualityAnalysis.overallScore)}
            </div>
            <div className="text-sm text-gray-600 mt-1">out of 100</div>
          </div>
        </div>
      </div>

      {/* Quality Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {qualityAnalysis.metrics.map((metric, idx) => (
          <div key={idx} className={`rounded-lg border-2 p-5 ${getScoreColor(metric.score)}`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                {getStatusIcon(metric.status)}
                <h4 className="font-semibold text-gray-900">{metric.category}</h4>
              </div>
              <div className="text-2xl font-bold">
                {Math.round(metric.score)}%
              </div>
            </div>

            {/* Strengths */}
            {metric.strengths.length > 0 && (
              <div className="mb-3">
                <p className="text-xs font-medium text-gray-700 mb-1">✓ Strengths:</p>
                <ul className="space-y-1">
                  {metric.strengths.map((strength, i) => (
                    <li key={i} className="text-xs text-gray-700">• {strength}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Issues */}
            {metric.issues.length > 0 && (
              <div>
                <p className="text-xs font-medium text-gray-700 mb-1">⚠ Issues Found:</p>
                <ul className="space-y-1">
                  {metric.issues.slice(0, 3).map((issue, i) => (
                    <li key={i} className="text-xs text-gray-700">• {issue}</li>
                  ))}
                  {metric.issues.length > 3 && (
                    <li className="text-xs text-gray-600 italic">
                      + {metric.issues.length - 3} more issues
                    </li>
                  )}
                </ul>
              </div>
            )}

            {metric.issues.length === 0 && metric.strengths.length === 0 && (
              <p className="text-xs text-gray-600 italic">No significant issues detected</p>
            )}
          </div>
        ))}
      </div>

      {/* Column Details */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h4 className="font-semibold text-gray-900 flex items-center">
            <Database className="w-5 h-5 mr-2 text-gray-600" />
            Column Analysis
          </h4>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Column Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Completeness
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Unique Values
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Issues
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {qualityAnalysis.columnAnalyses.map((col, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {col.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      {getTypeIcon(col.type)}
                      <span className="text-sm text-gray-700 capitalize">{col.type}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-1 bg-gray-200 rounded-full h-2 mr-2 max-w-[100px]">
                        <div 
                          className={`h-2 rounded-full ${
                            col.nullPercentage < 5 ? 'bg-green-500' :
                            col.nullPercentage < 20 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${100 - col.nullPercentage}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-700">
                        {(100 - col.nullPercentage).toFixed(1)}%
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {col.uniqueCount.toLocaleString()} ({col.uniquePercentage.toFixed(1)}%)
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      {col.nullPercentage > 50 && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          High nulls
                        </span>
                      )}
                      {col.hasOutliers && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          Outliers
                        </span>
                      )}
                      {col.inconsistentFormat && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                          Inconsistent
                        </span>
                      )}
                      {!col.hasOutliers && !col.inconsistentFormat && col.nullPercentage < 5 && (
                        <span className="text-xs text-green-600">✓ Clean</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recommendations */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-5">
        <div className="flex items-start space-x-3">
          <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <h4 className="font-semibold text-blue-900 mb-2">Recommendations</h4>
            <ul className="space-y-2 text-sm text-blue-800">
              {qualityAnalysis.overallScore >= 90 ? (
                <li>• Your data quality is excellent! Consider this dataset ready for analysis.</li>
              ) : (
                <>
                  {qualityAnalysis.metrics.find(m => m.category === 'Completeness' && m.score < 80) && (
                    <li>• Address missing values in columns with high null percentages before analysis</li>
                  )}
                  {qualityAnalysis.metrics.find(m => m.category === 'Consistency' && m.score < 80) && (
                    <li>• Standardize date/time formats across all columns for consistency</li>
                  )}
                  {qualityAnalysis.metrics.find(m => m.category === 'Validity' && m.score < 80) && (
                    <li>• Review and handle outliers - they may indicate data entry errors or valid edge cases</li>
                  )}
                  <li>• Run data cleaning operations to improve overall quality score</li>
                </>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataQualityDashboard;