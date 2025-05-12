import React, { useState } from 'react';
import { Card } from '../common/Card';
import { Bell, AlertTriangle, Activity, Clock, X, Plus, Save } from 'lucide-react';
import Button from '../common/Button';

interface AlertConfig {
  id: string;
  type: 'drift' | 'performance' | 'latency' | 'volume';
  metric: string;
  condition: 'above' | 'below' | 'change';
  threshold: number;
  severity: 'info' | 'warning' | 'critical';
  enabled: boolean;
}

interface NotificationChannel {
  id: string;
  type: 'email' | 'slack' | 'webhook';
  destination: string;
  enabled: boolean;
}

interface AlertsConfigurationProps {
  onClose: () => void;
  onSave: (config: {
    alerts: AlertConfig[];
    channels: NotificationChannel[];
  }) => void;
}

const AlertsConfiguration: React.FC<AlertsConfigurationProps> = ({
  onClose,
  onSave
}) => {
  const [alerts, setAlerts] = useState<AlertConfig[]>([
    {
      id: '1',
      type: 'drift',
      metric: 'data_drift_score',
      condition: 'above',
      threshold: 0.7,
      severity: 'critical',
      enabled: true
    },
    {
      id: '2',
      type: 'performance',
      metric: 'accuracy',
      condition: 'below',
      threshold: 0.8,
      severity: 'warning',
      enabled: true
    },
    {
      id: '3',
      type: 'latency',
      metric: 'response_time',
      condition: 'above',
      threshold: 100,
      severity: 'warning',
      enabled: true
    }
  ]);
  
  const [channels, setChannels] = useState<NotificationChannel[]>([
    {
      id: '1',
      type: 'email',
      destination: 'alerts@example.com',
      enabled: true
    },
    {
      id: '2',
      type: 'slack',
      destination: '#model-alerts',
      enabled: false
    }
  ]);
  
  const [newAlert, setNewAlert] = useState<Partial<AlertConfig>>({
    type: 'drift',
    metric: 'data_drift_score',
    condition: 'above',
    threshold: 0.5,
    severity: 'warning',
    enabled: true
  });
  
  const [newChannel, setNewChannel] = useState<Partial<NotificationChannel>>({
    type: 'email',
    destination: '',
    enabled: true
  });
  
  const [showNewAlertForm, setShowNewAlertForm] = useState(false);
  const [showNewChannelForm, setShowNewChannelForm] = useState(false);

  const handleToggleAlert = (alertId: string) => {
    setAlerts(alerts.map(alert => 
      alert.id === alertId ? { ...alert, enabled: !alert.enabled } : alert
    ));
  };

  const handleToggleChannel = (channelId: string) => {
    setChannels(channels.map(channel => 
      channel.id === channelId ? { ...channel, enabled: !channel.enabled } : channel
    ));
  };

  const handleDeleteAlert = (alertId: string) => {
    setAlerts(alerts.filter(alert => alert.id !== alertId));
  };

  const handleDeleteChannel = (channelId: string) => {
    setChannels(channels.filter(channel => channel.id !== channelId));
  };

  const handleAddAlert = () => {
    if (!newAlert.metric) return;
    
    const alert: AlertConfig = {
      id: Date.now().toString(),
      type: newAlert.type as 'drift' | 'performance' | 'latency' | 'volume',
      metric: newAlert.metric,
      condition: newAlert.condition as 'above' | 'below' | 'change',
      threshold: newAlert.threshold || 0,
      severity: newAlert.severity as 'info' | 'warning' | 'critical',
      enabled: newAlert.enabled || true
    };
    
    setAlerts([...alerts, alert]);
    setShowNewAlertForm(false);
    setNewAlert({
      type: 'drift',
      metric: 'data_drift_score',
      condition: 'above',
      threshold: 0.5,
      severity: 'warning',
      enabled: true
    });
  };

  const handleAddChannel = () => {
    if (!newChannel.destination) return;
    
    const channel: NotificationChannel = {
      id: Date.now().toString(),
      type: newChannel.type as 'email' | 'slack' | 'webhook',
      destination: newChannel.destination,
      enabled: newChannel.enabled || true
    };
    
    setChannels([...channels, channel]);
    setShowNewChannelForm(false);
    setNewChannel({
      type: 'email',
      destination: '',
      enabled: true
    });
  };

  const handleSave = () => {
    onSave({ alerts, channels });
  };

  return (
    <Card>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <div className="flex items-center justify-center w-10 h-10 bg-indigo-100 rounded-lg">
            <Bell className="w-6 h-6 text-indigo-600" />
          </div>
          <div className="ml-4">
            <h3 className="text-sm font-medium text-gray-900">Alert Configuration</h3>
            <p className="mt-1 text-xs text-gray-500">
              Configure alerts and notification channels
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onClose}
          icon={<X className="w-4 h-4" />}
        >
          Close
        </Button>
      </div>

      <div className="space-y-6">
        <div>
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-medium text-gray-700">Alert Rules</h4>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowNewAlertForm(!showNewAlertForm)}
              icon={showNewAlertForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            >
              {showNewAlertForm ? 'Cancel' : 'Add Alert'}
            </Button>
          </div>
          
          {showNewAlertForm && (
            <div className="p-4 bg-gray-50 rounded-lg mb-4">
              <h5 className="text-sm font-medium text-gray-700 mb-3">New Alert Rule</h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700">
                    Alert Type
                  </label>
                  <select
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    value={newAlert.type}
                    onChange={(e) => setNewAlert({ ...newAlert, type: e.target.value as any })}
                  >
                    <option value="drift">Data Drift</option>
                    <option value="performance">Model Performance</option>
                    <option value="latency">Response Time</option>
                    <option value="volume">Request Volume</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-700">
                    Metric
                  </label>
                  <select
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    value={newAlert.metric}
                    onChange={(e) => setNewAlert({ ...newAlert, metric: e.target.value })}
                  >
                    {newAlert.type === 'drift' && (
                      <>
                        <option value="data_drift_score">Data Drift Score</option>
                        <option value="feature_drift">Feature Drift</option>
                        <option value="concept_drift">Concept Drift</option>
                      </>
                    )}
                    {newAlert.type === 'performance' && (
                      <>
                        <option value="accuracy">Accuracy</option>
                        <option value="precision">Precision</option>
                        <option value="recall">Recall</option>
                        <option value="f1_score">F1 Score</option>
                      </>
                    )}
                    {newAlert.type === 'latency' && (
                      <>
                        <option value="response_time">Response Time</option>
                        <option value="p95_latency">P95 Latency</option>
                        <option value="p99_latency">P99 Latency</option>
                      </>
                    )}
                    {newAlert.type === 'volume' && (
                      <>
                        <option value="requests_per_minute">Requests per Minute</option>
                        <option value="requests_per_hour">Requests per Hour</option>
                        <option value="error_rate">Error Rate</option>
                      </>
                    )}
                  </select>
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-700">
                    Condition
                  </label>
                  <select
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    value={newAlert.condition}
                    onChange={(e) => setNewAlert({ ...newAlert, condition: e.target.value as any })}
                  >
                    <option value="above">Above</option>
                    <option value="below">Below</option>
                    <option value="change">Change by</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-700">
                    Threshold
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    value={newAlert.threshold}
                    onChange={(e) => setNewAlert({ ...newAlert, threshold: parseFloat(e.target.value) })}
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-700">
                    Severity
                  </label>
                  <select
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    value={newAlert.severity}
                    onChange={(e) => setNewAlert({ ...newAlert, severity: e.target.value as any })}
                  >
                    <option value="info">Info</option>
                    <option value="warning">Warning</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
              </div>
              
              <div className="mt-4 flex justify-end">
                <Button
                  onClick={handleAddAlert}
                  icon={<Plus className="w-4 h-4" />}
                >
                  Add Alert
                </Button>
              </div>
            </div>
          )}
          
          {alerts.length === 0 ? (
            <div className="text-center py-6 bg-gray-50 rounded-lg">
              <AlertTriangle className="mx-auto h-10 w-10 text-gray-300" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No alerts configured</h3>
              <p className="mt-1 text-sm text-gray-500">
                Add an alert to get notified when your model needs attention.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {alerts.map((alert) => (
                <div 
                  key={alert.id} 
                  className={`p-4 rounded-lg border ${
                    alert.enabled 
                      ? alert.severity === 'critical'
                        ? 'border-red-200 bg-red-50'
                        : alert.severity === 'warning'
                        ? 'border-amber-200 bg-amber-50'
                        : 'border-blue-200 bg-blue-50'
                      : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      {alert.type === 'drift' ? (
                        <AlertTriangle className={`w-5 h-5 mr-2 ${
                          alert.enabled 
                            ? alert.severity === 'critical'
                              ? 'text-red-500'
                              : alert.severity === 'warning'
                              ? 'text-amber-500'
                              : 'text-blue-500'
                            : 'text-gray-400'
                        }`} />
                      ) : alert.type === 'performance' ? (
                        <Activity className={`w-5 h-5 mr-2 ${
                          alert.enabled 
                            ? alert.severity === 'critical'
                              ? 'text-red-500'
                              : alert.severity === 'warning'
                              ? 'text-amber-500'
                              : 'text-blue-500'
                            : 'text-gray-400'
                        }`} />
                      ) : (
                        <Clock className={`w-5 h-5 mr-2 ${
                          alert.enabled 
                            ? alert.severity === 'critical'
                              ? 'text-red-500'
                              : alert.severity === 'warning'
                              ? 'text-amber-500'
                              : 'text-blue-500'
                            : 'text-gray-400'
                        }`} />
                      )}
                      <div>
                        <p className={`text-sm font-medium ${
                          alert.enabled 
                            ? alert.severity === 'critical'
                              ? 'text-red-800'
                              : alert.severity === 'warning'
                              ? 'text-amber-800'
                              : 'text-blue-800'
                            : 'text-gray-700'
                        }`}>
                          {alert.metric.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                        </p>
                        <p className={`text-xs ${
                          alert.enabled 
                            ? alert.severity === 'critical'
                              ? 'text-red-700'
                              : alert.severity === 'warning'
                              ? 'text-amber-700'
                              : 'text-blue-700'
                            : 'text-gray-500'
                        }`}>
                          {alert.condition === 'above' ? 'Above' : alert.condition === 'below' ? 'Below' : 'Changes by'} {alert.threshold}
                          {alert.metric.includes('accuracy') || alert.metric.includes('precision') || alert.metric.includes('recall') || alert.metric.includes('f1') || alert.metric.includes('drift') ? '%' : 
                           alert.metric.includes('latency') || alert.metric.includes('time') ? 'ms' : ''}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleToggleAlert(alert.id)}
                        className={`relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                          alert.enabled ? 'bg-indigo-600' : 'bg-gray-200'
                        }`}
                      >
                        <span className="sr-only">Toggle alert</span>
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200 ${
                            alert.enabled ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                      <button
                        onClick={() => handleDeleteAlert(alert.id)}
                        className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="border-t border-gray-200 pt-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-medium text-gray-700">Notification Channels</h4>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowNewChannelForm(!showNewChannelForm)}
              icon={showNewChannelForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            >
              {showNewChannelForm ? 'Cancel' : 'Add Channel'}
            </Button>
          </div>
          
          {showNewChannelForm && (
            <div className="p-4 bg-gray-50 rounded-lg mb-4">
              <h5 className="text-sm font-medium text-gray-700 mb-3">New Notification Channel</h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700">
                    Channel Type
                  </label>
                  <select
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    value={newChannel.type}
                    onChange={(e) => setNewChannel({ ...newChannel, type: e.target.value as any })}
                  >
                    <option value="email">Email</option>
                    <option value="slack">Slack</option>
                    <option value="webhook">Webhook</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-700">
                    {newChannel.type === 'email' 
                      ? 'Email Address' 
                      : newChannel.type === 'slack' 
                      ? 'Slack Channel' 
                      : 'Webhook URL'}
                  </label>
                  <input
                    type="text"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    value={newChannel.destination}
                    onChange={(e) => setNewChannel({ ...newChannel, destination: e.target.value })}
                    placeholder={
                      newChannel.type === 'email' 
                        ? 'alerts@example.com' 
                        : newChannel.type === 'slack' 
                        ? '#alerts' 
                        : 'https://example.com/webhook'
                    }
                  />
                </div>
              </div>
              
              <div className="mt-4 flex justify-end">
                <Button
                  onClick={handleAddChannel}
                  icon={<Plus className="w-4 h-4" />}
                >
                  Add Channel
                </Button>
              </div>
            </div>
          )}
          
          {channels.length === 0 ? (
            <div className="text-center py-6 bg-gray-50 rounded-lg">
              <Bell className="mx-auto h-10 w-10 text-gray-300" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No notification channels</h3>
              <p className="mt-1 text-sm text-gray-500">
                Add a channel to receive alert notifications.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {channels.map((channel) => (
                <div 
                  key={channel.id} 
                  className={`p-4 rounded-lg border ${
                    channel.enabled ? 'border-indigo-200 bg-indigo-50' : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Bell className={`w-5 h-5 mr-2 ${
                        channel.enabled ? 'text-indigo-500' : 'text-gray-400'
                      }`} />
                      <div>
                        <p className={`text-sm font-medium ${
                          channel.enabled ? 'text-indigo-900' : 'text-gray-700'
                        }`}>
                          {channel.type.charAt(0).toUpperCase() + channel.type.slice(1)}
                        </p>
                        <p className={`text-xs ${
                          channel.enabled ? 'text-indigo-700' : 'text-gray-500'
                        }`}>
                          {channel.destination}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleToggleChannel(channel.id)}
                        className={`relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                          channel.enabled ? 'bg-indigo-600' : 'bg-gray-200'
                        }`}
                      >
                        <span className="sr-only">Toggle channel</span>
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200 ${
                            channel.enabled ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                      <button
                        onClick={() => handleDeleteChannel(channel.id)}
                        className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="flex justify-end pt-4 border-t border-gray-200">
          <div className="flex space-x-3">
            <Button
              variant="outline"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              icon={<Save className="w-4 h-4" />}
            >
              Save Configuration
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default AlertsConfiguration;