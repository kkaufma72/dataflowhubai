import React, { useState, useEffect } from 'react';
import { Card } from '../common/Card';
import { 
  Rocket, 
  Check, 
  AlertTriangle, 
  Clock, 
  RefreshCw,
  Server,
  Globe,
  ArrowRight
} from 'lucide-react';
import Button from '../common/Button';
import { MLModel } from '../../types';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';
import { getDeploymentStatus } from '../../lib/deploymentService';

interface DeploymentStatusMonitorProps {
  model: MLModel;
  deploymentId?: string | null;
}

export interface DeploymentStatus {
  id: string;
  status: 'queued' | 'building' | 'deploying' | 'live' | 'failed';
  url?: string;
  error?: string;
  createdAt: string;
  updatedAt: string;
  logs?: string[];
  progress?: number;
  claimed?: boolean;
  deploy_url?: string;
  claim_url?: string;
}

const DeploymentStatusMonitor: React.FC<DeploymentStatusMonitorProps> = ({
  model,
  deploymentId
}) => {
  const [deploymentStatus, setDeploymentStatus] = useState<DeploymentStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDeploymentStatus = async () => {
    if (!deploymentId && !model.deploymentEndpoint) {
      setError('No deployment information available');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      if (deploymentId) {
        // Use the deployment service to get status
        const status = await getDeploymentStatus({ id: deploymentId });
        setDeploymentStatus(status);
        
        // If deployment is complete, update the model with the deployment URL
        if (status.status === 'live' && status.deploy_url) {
          // In a real implementation, this would update the model in the database
          console.log('Deployment complete:', status);
        }
      } else {
        // For already deployed models, create a status object
        setDeploymentStatus({
          id: 'existing-deployment',
          status: 'live',
          url: model.deploymentEndpoint,
          createdAt: model.deployedAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          progress: 100,
          deploy_url: model.deploymentEndpoint
        });
      }
    } catch (err) {
      console.error('Error fetching deployment status:', err);
      setError('Failed to fetch deployment status. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Start polling when component mounts
  useEffect(() => {
    fetchDeploymentStatus();
    
    // If the deployment is not live or failed, start polling
    if (deploymentId || !model.deploymentEndpoint) {
      setIsPolling(true);
      const interval = setInterval(() => {
        fetchDeploymentStatus();
      }, 5000); // Poll every 5 seconds
      
      return () => {
        clearInterval(interval);
        setIsPolling(false);
      };
    }
  }, [deploymentId, model.id]);

  // Stop polling when deployment is complete
  useEffect(() => {
    if (deploymentStatus?.status === 'live' || deploymentStatus?.status === 'failed') {
      setIsPolling(false);
    }
  }, [deploymentStatus]);

  const getStatusIcon = () => {
    if (!deploymentStatus) return <Clock className="w-6 h-6 text-gray-400" />;
    
    switch (deploymentStatus.status) {
      case 'queued':
        return <Clock className="w-6 h-6 text-amber-500" />;
      case 'building':
        return <Server className="w-6 h-6 text-blue-500" />;
      case 'deploying':
        return <Rocket className="w-6 h-6 text-primary animate-pulse" />;
      case 'live':
        return <Check className="w-6 h-6 text-green-500" />;
      case 'failed':
        return <AlertTriangle className="w-6 h-6 text-red-500" />;
      default:
        return <Clock className="w-6 h-6 text-gray-400" />;
    }
  };

  const getStatusColor = () => {
    if (!deploymentStatus) return 'bg-gray-100';
    
    switch (deploymentStatus.status) {
      case 'queued':
        return 'bg-amber-100';
      case 'building':
        return 'bg-blue-100';
      case 'deploying':
        return 'bg-primary/10';
      case 'live':
        return 'bg-green-100';
      case 'failed':
        return 'bg-red-100';
      default:
        return 'bg-gray-100';
    }
  };

  const getStatusText = () => {
    if (!deploymentStatus) return 'Unknown';
    
    switch (deploymentStatus.status) {
      case 'queued':
        return 'Queued';
      case 'building':
        return 'Building';
      case 'deploying':
        return 'Deploying';
      case 'live':
        return 'Live';
      case 'failed':
        return 'Failed';
      default:
        return 'Unknown';
    }
  };

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <div className={`flex items-center justify-center w-10 h-10 rounded-lg ${getStatusColor()}`}>
            {getStatusIcon()}
          </div>
          <div className="ml-4">
            <h3 className="text-sm font-medium text-gray-900">Deployment Status</h3>
            <p className="mt-1 text-xs text-gray-500">
              {isPolling ? 'Updating in real-time...' : 'Last updated: ' + new Date().toLocaleTimeString()}
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchDeploymentStatus}
          disabled={isLoading || isPolling}
          icon={isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
        >
          {isLoading ? 'Refreshing...' : 'Refresh'}
        </Button>
      </div>

      {error ? (
        <div className="p-4 bg-red-50 rounded-lg">
          <div className="flex">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <p className="mt-1 text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      ) : deploymentStatus ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                deploymentStatus.status === 'live' ? 'bg-green-100 text-green-800' :
                deploymentStatus.status === 'failed' ? 'bg-red-100 text-red-800' :
                'bg-blue-100 text-blue-800'
              }`}>
                {getStatusText()}
              </span>
              {deploymentStatus.status === 'live' && (
                <span className="ml-2 text-sm text-gray-500">
                  Deployed {new Date(deploymentStatus.updatedAt).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>

          {deploymentStatus.progress !== undefined && deploymentStatus.status !== 'live' && deploymentStatus.status !== 'failed' && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-gray-700">Deployment progress</span>
                <span className="text-sm font-medium text-gray-700">{deploymentStatus.progress}%</span>
              </div>
              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary-600 rounded-full transition-all duration-300"
                  style={{ width: `${deploymentStatus.progress}%` }}
                />
              </div>
            </div>
          )}

          {(deploymentStatus.url || deploymentStatus.deploy_url) && (
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <Globe className="w-5 h-5 text-primary" />
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-gray-900">Deployment URL</h3>
                  <p className="mt-1 text-sm text-primary-600 font-mono break-all">
                    {deploymentStatus.deploy_url || deploymentStatus.url}
                  </p>
                </div>
              </div>
              {deploymentStatus.status === 'live' && (
                <div className="mt-3 flex justify-end">
                  <Button
                    size="sm"
                    variant="outline"
                    icon={<ArrowRight className="w-4 h-4" />}
                    onClick={() => window.open(deploymentStatus.deploy_url || deploymentStatus.url, '_blank')}
                  >
                    View API Documentation
                  </Button>
                </div>
              )}
            </div>
          )}

          {deploymentStatus.logs && deploymentStatus.logs.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Deployment Logs</h4>
              <div className="p-3 bg-gray-800 rounded-md text-gray-200 font-mono text-xs overflow-auto max-h-40">
                {deploymentStatus.logs.map((log, index) => (
                  <div key={index} className={log.includes('Error') ? 'text-red-400' : ''}>
                    {log}
                  </div>
                ))}
                {deploymentStatus.status !== 'live' && deploymentStatus.status !== 'failed' && (
                  <div className="flex items-center mt-1">
                    <div className="w-4 h-4 rounded-full border-2 border-blue-500 border-t-transparent animate-spin mr-2"></div>
                    <span>Processing...</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {deploymentStatus.error && (
            <div className="p-4 bg-red-50 rounded-lg">
              <div className="flex">
                <AlertTriangle className="w-5 h-5 text-red-400" />
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Deployment Failed</h3>
                  <p className="mt-1 text-sm text-red-700">{deploymentStatus.error}</p>
                  <div className="mt-3">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        // In a real implementation, this would retry the deployment
                        toast.success('Deployment retry initiated');
                        fetchDeploymentStatus();
                      }}
                    >
                      Retry Deployment
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {deploymentStatus.claim_url && !deploymentStatus.claimed && (
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="flex">
                <Globe className="w-5 h-5 text-blue-500" />
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">Claim Your Deployment</h3>
                  <p className="mt-1 text-sm text-blue-700">
                    Transfer this deployment to your own Netlify account to manage it directly.
                  </p>
                  <div className="mt-3">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.open(deploymentStatus.claim_url, '_blank')}
                    >
                      Claim Deployment
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex items-center justify-center h-40">
          <RefreshCw className="w-8 h-8 text-gray-300 animate-spin" />
        </div>
      )}
    </Card>
  );
};

export default DeploymentStatusMonitor;