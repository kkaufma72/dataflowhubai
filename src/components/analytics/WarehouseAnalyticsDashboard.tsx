/**
 * Data Warehouse Analytics Dashboard
 * 
 * Business intelligence and historical analytics
 */

import React, { useState, useEffect } from 'react';
import { dataWarehouse } from '../../lib/dataWarehouse';
import { 
  TrendingUp, 
  Users, 
  Database, 
  Activity,
  AlertCircle,
  RefreshCw,
  BarChart2,
  Calendar
} from 'lucide-react';
import Card from '../common/Card';
import Button from '../common/Button';
import toast from 'react-hot-toast';

const WarehouseAnalyticsDashboard: React.FC = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [usageStats, setUsageStats] = useState<any[]>([]);
  const [topDatasets, setTopDatasets] = useState<any[]>([]);
  const [userEngagement, setUserEngagement] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Connect to warehouse
      const connected = await dataWarehouse.connect();
      setIsConnected(connected);

      if (!connected) {
        setError('Data Warehouse not connected. Run: docker run -d --name postgres-warehouse -e POSTGRES_PASSWORD=warehouse2024 -e POSTGRES_USER=analytics -e POSTGRES_DB=datawarehouse -p 5433:5432 postgres:16-alpine');
        setIsLoading(false);
        return;
      }

      // Load analytics data
      const [usage, top, engagement] = await Promise.all([
        dataWarehouse.getDailyUsageStats(30),
        dataWarehouse.getTopDatasets(10),
        dataWarehouse.getUserEngagement(30)
      ]);

      setUsageStats(usage);
      setTopDatasets(top);
      setUserEngagement(engagement);

      toast.success('Analytics loaded');
    } catch (err: any) {
      console.error('Analytics error:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (error) {
    return (
      <Card className="p-6 bg-yellow-50 border-yellow-200">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-6 h-6 text-yellow-600 flex-shrink-0" />
          <div className="flex-1">
            <h3 className="text-lg font-bold text-yellow-900 mb-2">
              Data Warehouse Not Connected
            </h3>
            <p className="text-sm text-yellow-800 mb-4">
              {error}
            </p>
            <div className="bg-yellow-100 rounded-lg p-4">
              <p className="text-sm font-semibold text-yellow-900 mb-2">
                Quick Setup:
              </p>
              <pre className="text-xs bg-yellow-50 p-3 rounded overflow-x-auto text-yellow-900">
{`docker run -d --name postgres-warehouse \\
  -e POSTGRES_PASSWORD=warehouse2024 \\
  -e POSTGRES_USER=analytics \\
  -e POSTGRES_DB=datawarehouse \\
  -p 5433:5432 \\
  postgres:16-alpine`}
              </pre>
            </div>
            <Button onClick={loadAnalytics} className="mt-4" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry Connection
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className="p-12 text-center">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600">Loading analytics from data warehouse...</p>
      </Card>
    );
  }

  // Calculate summary metrics
  const totalUploads = usageStats.reduce((sum, day) => sum + (day.total_uploads || 0), 0);
  const totalAnalyses = usageStats.reduce((sum, day) => sum + (day.total_analyses || 0), 0);
  const totalAIChats = usageStats.reduce((sum, day) => sum + (day.total_ai_chats || 0), 0);
  const uniqueUsers = usageStats.length > 0 ? usageStats[0].unique_users || 0 : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Data Warehouse Analytics
          </h2>
          <p className="text-gray-600 mt-1">
            Historical insights and business intelligence
          </p>
        </div>
        <Button onClick={loadAnalytics} variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-blue-700 uppercase mb-1">
                Total Uploads
              </p>
              <p className="text-3xl font-bold text-blue-900">
                {totalUploads.toLocaleString()}
              </p>
              <p className="text-xs text-blue-600 mt-1">Last 30 days</p>
            </div>
            <Database className="w-10 h-10 text-blue-600" />
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-primary-700 uppercase mb-1">
                Analyses
              </p>
              <p className="text-3xl font-bold text-primary-900">
                {totalAnalyses.toLocaleString()}
              </p>
              <p className="text-xs text-primary-600 mt-1">Last 30 days</p>
            </div>
            <BarChart2 className="w-10 h-10 text-primary-600" />
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-green-700 uppercase mb-1">
                AI Chats
              </p>
              <p className="text-3xl font-bold text-green-900">
                {totalAIChats.toLocaleString()}
              </p>
              <p className="text-xs text-green-600 mt-1">Last 30 days</p>
            </div>
            <Activity className="w-10 h-10 text-green-600" />
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-orange-700 uppercase mb-1">
                Active Users
              </p>
              <p className="text-3xl font-bold text-orange-900">
                {uniqueUsers}
              </p>
              <p className="text-xs text-orange-600 mt-1">Today</p>
            </div>
            <Users className="w-10 h-10 text-orange-600" />
          </div>
        </Card>
      </div>

      {/* Top Datasets */}
      <Card className="p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
          <TrendingUp className="w-5 h-5 text-primary-600 mr-2" />
          Most Analyzed Datasets
        </h3>
        <div className="space-y-3">
          {topDatasets.map((dataset, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                  <span className="text-sm font-bold text-primary-600">
                    #{idx + 1}
                  </span>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">
                    {dataset.name}
                  </p>
                  <p className="text-sm text-gray-600">
                    {dataset.total_rows?.toLocaleString()} rows
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-primary-600">
                  {dataset.analysis_count}
                </p>
                <p className="text-xs text-gray-500">analyses</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* User Engagement */}
      <Card className="p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
          <Users className="w-5 h-5 text-primary-600 mr-2" />
          User Engagement (Last 30 Days)
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-700 uppercase">
                  User
                </th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-700 uppercase">
                  Company
                </th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-700 uppercase">
                  Use Case
                </th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-gray-700 uppercase">
                  Datasets Used
                </th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-gray-700 uppercase">
                  Total Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {userEngagement.slice(0, 10).map((user, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="py-3 px-4 text-sm text-gray-900">
                    {user.email}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600">
                    {user.company || '-'}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600">
                    {user.use_case || 'General'}
                  </td>
                  <td className="py-3 px-4 text-sm font-semibold text-gray-900 text-right">
                    {user.datasets_used}
                  </td>
                  <td className="py-3 px-4 text-sm font-semibold text-primary-600 text-right">
                    {user.total_actions}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Daily Usage Trend */}
      <Card className="p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
          <Calendar className="w-5 h-5 text-green-600 mr-2" />
          Daily Usage Trend
        </h3>
        <div className="space-y-2">
          {usageStats.slice(0, 7).map((day, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
            >
              <div>
                <p className="font-semibold text-gray-900">
                  {new Date(day.date).toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric'
                  })}
                </p>
              </div>
              <div className="flex gap-6 text-sm">
                <div>
                  <span className="text-gray-600">Uploads:</span>
                  <span className="font-semibold text-gray-900 ml-2">
                    {day.total_uploads || 0}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Analyses:</span>
                  <span className="font-semibold text-gray-900 ml-2">
                    {day.total_analyses || 0}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">AI Chats:</span>
                  <span className="font-semibold text-gray-900 ml-2">
                    {day.total_ai_chats || 0}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default WarehouseAnalyticsDashboard;

