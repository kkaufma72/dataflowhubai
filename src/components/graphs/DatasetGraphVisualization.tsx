/**
 * Dataset Graph Visualization - Neo4j Integration
 * 
 * Shows relationships between datasets in interactive graph
 */

import React, { useEffect, useRef, useState } from 'react';
import { neo4jClient } from '../../lib/neo4jClient';
import { useAuth } from '../auth/AuthProvider';
import { Network, Share2, Zap, AlertCircle, RefreshCw } from 'lucide-react';
import Button from '../common/Button';
import toast from 'react-hot-toast';

interface DatasetGraphVisualizationProps {
  height?: string;
}

const DatasetGraphVisualization: React.FC<DatasetGraphVisualizationProps> = ({ 
  height = '600px' 
}) => {
  const { user } = useAuth();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [graphData, setGraphData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load graph data
  useEffect(() => {
    loadGraph();
  }, [user]);

  const loadGraph = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Connect to Neo4j
      const connected = await neo4jClient.connect();
      setIsConnected(connected);

      if (!connected) {
        const uri = import.meta.env.VITE_NEO4J_URI;
        if (uri && uri.includes('neo4j.io')) {
          setError('Cannot connect to Neo4j Aura. Please check your password in .env.local or reset it at: https://console.neo4j.io');
        } else {
          setError('Neo4j not configured. Add Neo4j Aura credentials to .env.local or set up local Docker.');
        }
        setIsLoading(false);
        return;
      }

      // Get graph data
      const data = await neo4jClient.getDatasetGraph(user?.id || '');
      setGraphData(data);

      // Render graph
      if (data.nodes.length > 0) {
        renderGraph(data);
      }
    } catch (err: any) {
      console.error('Graph load error:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const renderGraph = (data: any) => {
    console.log('🎨 Rendering graph with', data.nodes?.length || 0, 'nodes');
    
    const canvas = canvasRef.current;
    if (!canvas) {
      console.warn('Canvas not found');
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.warn('Canvas context not available');
      return;
    }

    // Set canvas size to actual display size
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    const width = canvas.width;
    const height = canvas.height;

    console.log('Canvas size:', width, 'x', height);

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    if (!data.nodes || data.nodes.length === 0) {
      console.warn('No nodes to render');
      return;
    }

    // Draw nodes
    data.nodes.forEach((node: any, idx: number) => {
      const x = (width / (data.nodes.length + 1)) * (idx + 1);
      const y = height / 2;
      const radius = 25;

      console.log(`Drawing node ${idx}:`, node.label, 'at', x, y);

      // Draw node circle with gradient
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
      gradient.addColorStop(0, '#818CF8');
      gradient.addColorStop(1, '#6366F1');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, 2 * Math.PI);
      ctx.fill();

      // Draw border
      ctx.strokeStyle = '#4F46E5';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw label (white text)
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(node.label.slice(0, 20), x, y + 4);

      // Draw row count below
      ctx.fillStyle = '#E0E7FF';
      ctx.font = '9px sans-serif';
      ctx.fillText(`${node.size} rows`, x, y - radius - 8);

      // Store position for edges
      node._x = x;
      node._y = y;
    });

    // Draw edges
    if (data.edges && data.edges.length > 0) {
      ctx.strokeStyle = '#94A3B8';
      ctx.lineWidth = 2;
      data.edges.forEach((edge: any) => {
        const from = data.nodes.find((n: any) => n.id === edge.from);
        const to = data.nodes.find((n: any) => n.id === edge.to);

        if (from && to) {
          console.log('Drawing edge:', from.label, '→', to.label);
          ctx.beginPath();
          ctx.moveTo(from._x, from._y);
          ctx.lineTo(to._x, to._y);
          ctx.stroke();
        }
      });
    }

    console.log('✅ Graph rendered!');
  };

  const handleRefresh = () => {
    loadGraph();
    toast.success('Refreshing graph...');
  };

  if (error) {
    return (
      <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-lg font-bold text-yellow-900 mb-2">
              Neo4j Not Connected
            </h3>
            <p className="text-sm text-yellow-800 mb-4">
              {error}
            </p>
            <div className="bg-yellow-100 rounded-lg p-4 mb-4">
              <p className="text-sm font-semibold text-yellow-900 mb-2">
                Quick Setup:
              </p>
              <pre className="text-xs bg-yellow-50 p-3 rounded overflow-x-auto text-yellow-900">
{`docker run -d \\
  --name neo4j \\
  -p 7474:7474 -p 7687:7687 \\
  -e NEO4J_AUTH=neo4j/dataflowhub2024 \\
  neo4j:latest`}
              </pre>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleRefresh} size="sm" variant="outline">
                <RefreshCw className="w-4 h-4 mr-2" />
                Retry Connection
              </Button>
              <Button
                onClick={() => window.open('http://localhost:7474', '_blank')}
                size="sm"
                variant="outline"
              >
                Open Neo4j Browser
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600">Loading knowledge graph...</p>
      </div>
    );
  }

  if (!graphData || graphData.nodes.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
        <Share2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-bold text-gray-900 mb-2">
          No Graph Data Yet
        </h3>
        <p className="text-gray-600 mb-4">
          Upload datasets to see relationship graphs
        </p>
        <Button onClick={handleRefresh} size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh Graph
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Share2 className="w-6 h-6 text-white" />
            <div>
              <h3 className="text-lg font-bold text-white">
                Dataset Knowledge Graph
              </h3>
              <p className="text-sm text-indigo-100">
                {graphData.nodes.length} datasets, {graphData.edges.length} relationships
              </p>
            </div>
          </div>
          <Button
            onClick={handleRefresh}
            variant="outline"
            size="sm"
            className="border-white/30 text-white hover:bg-white/10"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Graph Canvas */}
      <div className="p-6 bg-gray-50">
        <canvas
          ref={canvasRef}
          width={800}
          height={parseInt(height)}
          className="w-full rounded-lg bg-white border border-gray-200"
        />
      </div>

      {/* Legend */}
      <div className="px-6 pb-6">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-indigo-500 rounded-full"></div>
            <span className="text-sm text-gray-600">Dataset</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-0.5 bg-gray-400"></div>
            <span className="text-sm text-gray-600">Relationship</span>
          </div>
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-purple-500" />
            <span className="text-sm text-gray-600">Powered by Neo4j</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DatasetGraphVisualization;

