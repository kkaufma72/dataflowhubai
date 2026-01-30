import React, { useState, useEffect } from 'react';
import { Activity, TrendingUp, AlertTriangle, CheckCircle, Zap, RefreshCw, ExternalLink } from 'lucide-react';
import { MLModel } from '../../types';
import Card from '../common/Card';
import Button from '../common/Button';
import { useNavigate } from 'react-router-dom';

interface MonitoringStepProps {
  model: MLModel;
  onBack: () => void;
  prefillTemplate?: 'drift' | null;
}

const MonitoringStep: React.FC<MonitoringStepProps> = ({ model, onBack, prefillTemplate = null }) => {
  const navigate = useNavigate();
  const [deploymentStatus, setDeploymentStatus] = useState<'idle' | 'deploying' | 'deployed'>('idle');
  const [predictions, setPredictions] = useState(0);
  const [avgLatency, setAvgLatency] = useState(0);

  // Simulate deployment
  const handleDeploy = () => {
    setDeploymentStatus('deploying');
    setTimeout(() => {
      setDeploymentStatus('deployed');
    }, 3000);
  };

  // Simulate live metrics
  useEffect(() => {
    if (deploymentStatus === 'deployed') {
      const interval = setInterval(() => {
        setPredictions(prev => prev + Math.floor(Math.random() * 5));
        setAvgLatency(45 + Math.random() * 20);
      }, 2000);

      return () => clearInterval(interval);
    }
  }, [deploymentStatus]);

  const apiEndpoint = deploymentStatus === 'deployed' 
    ? `https://api.dataflowhub.ai/predict/${model.id}`
    : null;

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="text-center mb-10">
        <h2 className="text-4xl font-bold text-white mb-4 tracking-tight">
          Deploy & Monitor
        </h2>
        <p className="text-gray-400 text-lg leading-relaxed">
          Your model is ready for production
        </p>
      </div>

      {prefillTemplate === 'drift' && (
        <Card className="mb-6 bg-indigo-950/30 border-indigo-500/30">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-white">Drift monitor template ready</p>
              <p className="text-xs text-gray-400 mt-1">
                Defaults applied for drift detection and alert thresholds.
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate(`/app/monitoring?model=${model.id}`)}
              className="px-3 py-2 rounded-lg border border-gray-700 bg-gray-900/40 hover:bg-gray-900 transition text-sm text-white"
            >
              Review template
            </button>
          </div>
        </Card>
      )}

      {/* Model Summary Card */}
      <Card className="mb-6 bg-gradient-to-br from-indigo-950/50 to-purple-950/50 border-indigo-500/40 shadow-xl shadow-indigo-500/20">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-xl font-bold text-white mb-1">{model.name}</h3>
            <p className="text-sm text-gray-400">
              Trained on {new Date(model.createdAt).toLocaleDateString()}
            </p>
          </div>
          <span className="px-3 py-1 text-sm font-medium bg-green-600 text-white rounded-full">
            Ready
          </span>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-gray-900/70 rounded-lg p-4 border border-gray-800">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <p className="text-xs text-gray-400">Accuracy</p>
            </div>
            <p className="text-2xl font-bold text-white">
              {((model.metrics?.accuracy || 0) * 100).toFixed(1)}%
            </p>
          </div>

          <div className="bg-gray-900/70 rounded-lg p-4 border border-gray-800">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-blue-400" />
              <p className="text-xs text-gray-400">Precision</p>
            </div>
            <p className="text-2xl font-bold text-white">
              {((model.metrics?.precision || 0) * 100).toFixed(1)}%
            </p>
          </div>

          <div className="bg-gray-900/70 rounded-lg p-4 border border-gray-800">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="w-4 h-4 text-purple-400" />
              <p className="text-xs text-gray-400">Recall</p>
            </div>
            <p className="text-2xl font-bold text-white">
              {((model.metrics?.recall || 0) * 100).toFixed(1)}%
            </p>
          </div>

          <div className="bg-gray-900/70 rounded-lg p-4 border border-gray-800">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-4 h-4 text-indigo-400" />
              <p className="text-xs text-gray-400">F1 Score</p>
            </div>
            <p className="text-2xl font-bold text-white">
              {((model.metrics?.f1_score || 0) * 100).toFixed(1)}%
            </p>
          </div>
        </div>
      </Card>

      {/* Deployment Card */}
      <div id="ml-deployment">
        <Card className="mb-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Deployment</h3>
              <p className="text-sm text-gray-400">
                Deploy your model to production with one click
              </p>
            </div>

          {deploymentStatus === 'idle' && (
            <div className="text-right">
              <Button onClick={handleDeploy} className="flex items-center gap-2">
                <Zap className="w-4 h-4" />
                Deploy to Production
              </Button>
              <p className="mt-2 text-xs text-gray-500">Deploy — pushes model + enables monitors, ~2 min</p>
            </div>
          )}

          {deploymentStatus === 'deploying' && (
            <Button disabled className="opacity-75">
              <RefreshCw className="w-4 h-4 animate-spin mr-2" />
              Deploying...
            </Button>
          )}

          {deploymentStatus === 'deployed' && (
            <span className="px-3 py-1.5 text-sm font-medium bg-green-600 text-white rounded-lg flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Live
            </span>
          )}
        </div>

          {deploymentStatus === 'deployed' && apiEndpoint && (
            <div className="space-y-4">
            {/* API Endpoint */}
            <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
              <p className="text-xs text-gray-400 mb-2">API Endpoint</p>
              <div className="flex items-center justify-between gap-3">
                <code className="text-sm text-indigo-400 font-mono flex-1">
                  {apiEndpoint}
                </code>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(apiEndpoint);
                  }}
                  className="px-3 py-1.5 text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 rounded transition-colors"
                >
                  Copy
                </button>
              </div>
            </div>

            {/* Sample cURL */}
            <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
              <p className="text-xs text-gray-400 mb-2">Example Request</p>
              <pre className="text-xs text-gray-300 font-mono overflow-x-auto">
{`curl -X POST ${apiEndpoint} \\
  -H "Content-Type: application/json" \\
  -d '{"features": [1, 2, 3]}'`}
              </pre>
            </div>
            </div>
          )}
        </Card>
      </div>

      {/* Live Monitoring */}
      {deploymentStatus === 'deployed' && (
        <Card className="mb-6">
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Live Metrics</h3>
              <span className="flex items-center gap-2 text-sm text-gray-400">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                Real-time
              </span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-400">Predictions</p>
                <Activity className="w-4 h-4 text-indigo-400" />
              </div>
              <p className="text-3xl font-bold text-white mb-1">
                {predictions.toLocaleString()}
              </p>
              <p className="text-xs text-green-400">+{Math.floor(Math.random() * 5)} this minute</p>
            </div>

            <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-400">Avg Latency</p>
                <Zap className="w-4 h-4 text-yellow-400" />
              </div>
              <p className="text-3xl font-bold text-white mb-1">
                {avgLatency.toFixed(0)}ms
              </p>
              <p className="text-xs text-gray-500">Within SLA</p>
            </div>

            <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-400">Error Rate</p>
                <AlertTriangle className="w-4 h-4 text-green-400" />
              </div>
              <p className="text-3xl font-bold text-white mb-1">
                0.1%
              </p>
              <p className="text-xs text-green-400">Healthy</p>
            </div>
          </div>

          {/* Health Status */}
          <div className="flex items-start gap-3 bg-green-950/30 border border-green-500/30 rounded-lg p-4">
            <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-green-300 mb-1">Model is Healthy</h4>
              <p className="text-sm text-gray-400">
                No drift detected. Performance is stable. All systems operational.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Quick Actions */}
      <Card className="mb-6">
        <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => navigate(`/app/monitoring?model=${model.id}`)}
            className="flex items-center gap-3 p-4 bg-gray-800/50 hover:bg-gray-800 border border-gray-700 hover:border-gray-600 rounded-lg transition-all text-left group"
          >
            <Activity className="w-5 h-5 text-indigo-400" />
            <div className="flex-1">
              <p className="font-medium text-white group-hover:text-indigo-400 transition-colors">
                Advanced Monitoring
              </p>
              <p className="text-xs text-gray-500">Drift detection & alerts</p>
            </div>
            <ExternalLink className="w-4 h-4 text-gray-600 group-hover:text-gray-400" />
          </button>

          <button
            onClick={() => navigate(`/app/scenario-testing?model=${model.id}`)}
            className="flex items-center gap-3 p-4 bg-gray-800/50 hover:bg-gray-800 border border-gray-700 hover:border-gray-600 rounded-lg transition-all text-left group"
          >
            <Zap className="w-5 h-5 text-purple-400" />
            <div className="flex-1">
              <p className="font-medium text-white group-hover:text-purple-400 transition-colors">
                Test Predictions
              </p>
              <p className="text-xs text-gray-500">Try what-if scenarios</p>
            </div>
            <ExternalLink className="w-4 h-4 text-gray-600 group-hover:text-gray-400" />
          </button>

          <button
            onClick={() => navigate(`/app/model-training?retrain=${model.id}`)}
            className="flex items-center gap-3 p-4 bg-gray-800/50 hover:bg-gray-800 border border-gray-700 hover:border-gray-600 rounded-lg transition-all text-left group"
          >
            <RefreshCw className="w-5 h-5 text-green-400" />
            <div className="flex-1">
              <p className="font-medium text-white group-hover:text-green-400 transition-colors">
                Retrain Model
              </p>
              <p className="text-xs text-gray-500">Update with new data</p>
            </div>
            <ExternalLink className="w-4 h-4 text-gray-600 group-hover:text-gray-400" />
          </button>

          <button
            onClick={() => navigate(`/app/evaluate?model=${encodeURIComponent(model.id)}`)}
            className="flex items-center gap-3 p-4 bg-gray-800/50 hover:bg-gray-800 border border-gray-700 hover:border-gray-600 rounded-lg transition-all text-left group"
          >
            <TrendingUp className="w-5 h-5 text-blue-400" />
            <div className="flex-1">
              <p className="font-medium text-white group-hover:text-blue-400 transition-colors">
                View Dashboard
              </p>
              <p className="text-xs text-gray-500">See all models</p>
            </div>
            <ExternalLink className="w-4 h-4 text-gray-600 group-hover:text-gray-400" />
          </button>
        </div>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-4">
        <Button
          variant="secondary"
          onClick={onBack}
          className="px-6 py-2.5"
        >
          Back to Training
        </Button>

        <Button
          onClick={() => navigate(`/app/evaluate?model=${encodeURIComponent(model.id)}`)}
          className="px-10 py-3.5 text-base font-semibold flex items-center gap-2 shadow-lg shadow-green-500/30 hover:shadow-green-500/50 transition-all"
        >
          <CheckCircle className="w-5 h-5" />
          Complete & View Dashboard
        </Button>
      </div>
    </div>
  );
};

export default MonitoringStep;
