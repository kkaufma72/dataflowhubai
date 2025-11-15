import React, { useState, useEffect, useRef } from 'react';
import { Card } from '../common/Card';
import Button from '../common/Button';
import { 
  GitBranch, 
  GitMerge, 
  ArrowRight, 
  Database, 
  FileText, 
  Filter, 
  Layers, 
  Download,
  ZoomIn,
  ZoomOut,
  Move,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { Dataset } from '../../types';
import * as d3 from 'd3';
import toast from 'react-hot-toast';

interface LineageNode {
  id: string;
  type: 'dataset' | 'transformation' | 'source' | 'destination';
  name: string;
  description?: string;
  metadata?: Record<string, any>;
}

interface LineageEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
}

interface DataLineageProps {
  dataset: Dataset;
  width?: number;
  height?: number;
}

const DataLineage: React.FC<DataLineageProps> = ({
  dataset,
  width = 800,
  height = 500
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [nodes, setNodes] = useState<LineageNode[]>([]);
  const [edges, setEdges] = useState<LineageEdge[]>([]);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Generate sample lineage data based on dataset
  useEffect(() => {
    // Create nodes
    const newNodes: LineageNode[] = [
      {
        id: dataset.id,
        type: 'dataset',
        name: dataset.name,
        description: dataset.description,
        metadata: {
          rows: dataset.rows,
          columns: dataset.columns,
          dateUploaded: dataset.dateUploaded
        }
      },
      {
        id: `source-${dataset.id}`,
        type: 'source',
        name: 'Original Data Source',
        description: 'Raw data from external system',
        metadata: {
          type: dataset.fileType,
          size: dataset.fileSize,
          date: new Date(new Date(dataset.dateUploaded).getTime() - 86400000).toISOString() // 1 day before
        }
      },
      {
        id: `transform-1-${dataset.id}`,
        type: 'transformation',
        name: 'Data Cleaning',
        description: 'Removed duplicates and handled missing values',
        metadata: {
          type: 'cleaning',
          date: new Date(new Date(dataset.dateUploaded).getTime() - 43200000).toISOString() // 12 hours before
        }
      },
      {
        id: `transform-2-${dataset.id}`,
        type: 'transformation',
        name: 'Feature Engineering',
        description: 'Created derived features and normalized data',
        metadata: {
          type: 'feature_engineering',
          date: new Date(new Date(dataset.dateUploaded).getTime() - 21600000).toISOString() // 6 hours before
        }
      },
      {
        id: `derived-1-${dataset.id}`,
        type: 'dataset',
        name: `${dataset.name} - Processed`,
        description: 'Processed version ready for modeling',
        metadata: {
          rows: dataset.rows,
          columns: dataset.columns + 3, // Added features
          date: new Date().toISOString()
        }
      },
      {
        id: `derived-2-${dataset.id}`,
        type: 'dataset',
        name: `${dataset.name} - Training`,
        description: 'Training subset (80%)',
        metadata: {
          rows: Math.floor(dataset.rows * 0.8),
          columns: dataset.columns + 3,
          date: new Date().toISOString()
        }
      },
      {
        id: `derived-3-${dataset.id}`,
        type: 'dataset',
        name: `${dataset.name} - Testing`,
        description: 'Testing subset (20%)',
        metadata: {
          rows: Math.floor(dataset.rows * 0.2),
          columns: dataset.columns + 3,
          date: new Date().toISOString()
        }
      }
    ];
    
    // Create edges
    const newEdges: LineageEdge[] = [
      {
        id: `edge-1-${dataset.id}`,
        source: `source-${dataset.id}`,
        target: `transform-1-${dataset.id}`,
        label: 'imports'
      },
      {
        id: `edge-2-${dataset.id}`,
        source: `transform-1-${dataset.id}`,
        target: dataset.id,
        label: 'produces'
      },
      {
        id: `edge-3-${dataset.id}`,
        source: dataset.id,
        target: `transform-2-${dataset.id}`,
        label: 'inputs to'
      },
      {
        id: `edge-4-${dataset.id}`,
        source: `transform-2-${dataset.id}`,
        target: `derived-1-${dataset.id}`,
        label: 'produces'
      },
      {
        id: `edge-5-${dataset.id}`,
        source: `derived-1-${dataset.id}`,
        target: `derived-2-${dataset.id}`,
        label: 'splits into'
      },
      {
        id: `edge-6-${dataset.id}`,
        source: `derived-1-${dataset.id}`,
        target: `derived-3-${dataset.id}`,
        label: 'splits into'
      }
    ];
    
    setNodes(newNodes);
    setEdges(newEdges);
  }, [dataset]);

  // Render the lineage graph using D3
  useEffect(() => {
    if (!svgRef.current || nodes.length === 0 || edges.length === 0) return;
    
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();
    
    const g = svg.append('g');
    
    // Define arrow marker for edges
    svg.append('defs').append('marker')
      .attr('id', 'arrowhead')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 20)
      .attr('refY', 0)
      .attr('orient', 'auto')
      .attr('markerWidth', 8)
      .attr('markerHeight', 8)
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', '#9CA3AF');
    
    // Create a hierarchical layout
    const nodeWidth = 180;
    const nodeHeight = 80;
    const nodeSpacing = 100;
    
    // Organize nodes into levels
    const levels: { [key: string]: LineageNode[] } = {
      'source': nodes.filter(n => n.type === 'source'),
      'raw': [nodes.find(n => n.id === dataset.id)!],
      'transformation': nodes.filter(n => n.type === 'transformation'),
      'derived': nodes.filter(n => n.id.startsWith('derived'))
    };
    
    // Position nodes
    let y = 50;
    Object.entries(levels).forEach(([level, levelNodes]) => {
      const levelWidth = levelNodes.length * (nodeWidth + nodeSpacing);
      let x = (width - levelWidth) / 2 + nodeWidth / 2;
      
      levelNodes.forEach(node => {
        node['x'] = x;
        node['y'] = y;
        x += nodeWidth + nodeSpacing;
      });
      
      y += nodeHeight + 100;
    });
    
    // Draw edges
    const edgeGroup = g.append('g').attr('class', 'edges');
    
    edges.forEach(edge => {
      const source = nodes.find(n => n.id === edge.source);
      const target = nodes.find(n => n.id === edge.target);
      
      if (!source || !target) return;
      
      // Create a path
      const path = edgeGroup.append('path')
        .attr('d', `M${source['x']},${source['y'] + nodeHeight/2} C${source['x']},${(source['y'] + target['y'])/2} ${target['x']},${(source['y'] + target['y'])/2} ${target['x']},${target['y'] - nodeHeight/2}`)
        .attr('stroke', '#9CA3AF')
        .attr('stroke-width', 1.5)
        .attr('fill', 'none')
        .attr('marker-end', 'url(#arrowhead)')
        .attr('class', 'lineage-edge')
        .attr('id', `edge-${edge.id}`);
      
      // Add edge label
      if (edge.label) {
        const pathNode = path.node();
        if (pathNode) {
          const pathLength = pathNode.getTotalLength();
          const midPoint = pathNode.getPointAtLength(pathLength / 2);
          
          edgeGroup.append('rect')
            .attr('x', midPoint.x - 40)
            .attr('y', midPoint.y - 10)
            .attr('width', 80)
            .attr('height', 20)
            .attr('fill', 'white')
            .attr('rx', 4)
            .attr('ry', 4)
            .attr('stroke', '#E5E7EB')
            .attr('stroke-width', 1);
          
          edgeGroup.append('text')
            .attr('x', midPoint.x)
            .attr('y', midPoint.y + 4)
            .attr('text-anchor', 'middle')
            .attr('font-size', '10px')
            .attr('fill', '#6B7280')
            .text(edge.label);
        }
      }
    });
    
    // Draw nodes
    const nodeGroup = g.append('g').attr('class', 'nodes');
    
    nodes.forEach(node => {
      const group = nodeGroup.append('g')
        .attr('transform', `translate(${node['x'] - nodeWidth/2}, ${node['y'] - nodeHeight/2})`)
        .attr('class', 'lineage-node')
        .attr('id', `node-${node.id}`)
        .style('cursor', 'pointer')
        .on('click', () => {
          setSelectedNode(selectedNode === node.id ? null : node.id);
        });
      
      // Node background
      group.append('rect')
        .attr('width', nodeWidth)
        .attr('height', nodeHeight)
        .attr('rx', 6)
        .attr('ry', 6)
        .attr('fill', node.id === selectedNode ? '#EEF2FF' : 'white')
        .attr('stroke', node.id === selectedNode ? '#6366F1' : '#E5E7EB')
        .attr('stroke-width', node.id === selectedNode ? 2 : 1);
      
      // Node icon
      const iconMap = {
        'dataset': Database,
        'transformation': Filter,
        'source': FileText,
        'destination': Layers
      };
      
      const iconColor = {
        'dataset': '#4F46E5',
        'transformation': '#10B981',
        'source': '#F59E0B',
        'destination': '#EC4899'
      };
      
      // Node title
      group.append('text')
        .attr('x', 40)
        .attr('y', 25)
        .attr('font-size', '12px')
        .attr('font-weight', 'bold')
        .attr('fill', '#111827')
        .text(node.name.length > 20 ? node.name.substring(0, 20) + '...' : node.name);
      
      // Node description
      if (node.description) {
        group.append('text')
          .attr('x', 40)
          .attr('y', 45)
          .attr('font-size', '10px')
          .attr('fill', '#6B7280')
          .text(node.description.length > 25 ? node.description.substring(0, 25) + '...' : node.description);
      }
      
      // Node metadata
      if (node.metadata) {
        let metadataText = '';
        if (node.metadata.rows) metadataText += `${node.metadata.rows.toLocaleString()} rows`;
        if (node.metadata.columns) metadataText += metadataText ? `, ${node.metadata.columns} cols` : `${node.metadata.columns} cols`;
        
        group.append('text')
          .attr('x', 40)
          .attr('y', 60)
          .attr('font-size', '10px')
          .attr('fill', '#9CA3AF')
          .text(metadataText);
      }
      
      // Icon background
      group.append('rect')
        .attr('x', 10)
        .attr('y', 15)
        .attr('width', 24)
        .attr('height', 24)
        .attr('rx', 4)
        .attr('fill', `${iconColor[node.type]}20`);
      
      // We can't directly use Lucide icons in SVG, so we'll use basic shapes
      if (node.type === 'dataset') {
        group.append('rect')
          .attr('x', 16)
          .attr('y', 21)
          .attr('width', 12)
          .attr('height', 12)
          .attr('rx', 2)
          .attr('fill', iconColor[node.type]);
      } else if (node.type === 'transformation') {
        group.append('path')
          .attr('d', 'M16,21 L28,21 L28,27 L22,33 L16,27 Z')
          .attr('fill', iconColor[node.type]);
      } else if (node.type === 'source') {
        group.append('rect')
          .attr('x', 16)
          .attr('y', 21)
          .attr('width', 12)
          .attr('height', 12)
          .attr('rx', 1)
          .attr('fill', iconColor[node.type]);
        
        group.append('line')
          .attr('x1', 18)
          .attr('y1', 24)
          .attr('x2', 26)
          .attr('y2', 24)
          .attr('stroke', 'white')
          .attr('stroke-width', 1);
        
        group.append('line')
          .attr('x1', 18)
          .attr('y1', 27)
          .attr('x2', 26)
          .attr('y2', 27)
          .attr('stroke', 'white')
          .attr('stroke-width', 1);
        
        group.append('line')
          .attr('x1', 18)
          .attr('y1', 30)
          .attr('x2', 22)
          .attr('y2', 30)
          .attr('stroke', 'white')
          .attr('stroke-width', 1);
      }
    });
    
    // Add zoom behavior
    const zoom = d3.zoom()
      .scaleExtent([0.5, 2])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
        setZoom(event.transform.k);
      });
    
    svg.call(zoom as any);
    
  }, [nodes, edges, width, height, selectedNode]);

  const handleZoomIn = () => {
    if (!svgRef.current) return;
    
    const svg = d3.select(svgRef.current);
    const currentZoom = d3.zoomTransform(svg.node() as any);
    
    svg.transition()
      .duration(300)
      .call((d3.zoom() as any).transform, 
        d3.zoomIdentity.translate(currentZoom.x, currentZoom.y).scale(currentZoom.k + 0.2)
      );
  };

  const handleZoomOut = () => {
    if (!svgRef.current) return;
    
    const svg = d3.select(svgRef.current);
    const currentZoom = d3.zoomTransform(svg.node() as any);
    
    svg.transition()
      .duration(300)
      .call((d3.zoom() as any).transform, 
        d3.zoomIdentity.translate(currentZoom.x, currentZoom.y).scale(Math.max(0.5, currentZoom.k - 0.2))
      );
  };

  const handleReset = () => {
    if (!svgRef.current) return;
    
    const svg = d3.select(svgRef.current);
    
    svg.transition()
      .duration(300)
      .call((d3.zoom() as any).transform, d3.zoomIdentity);
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    
    if (!isFullscreen) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
    
    setIsFullscreen(!isFullscreen);
  };

  const exportSVG = () => {
    if (!svgRef.current) return;
    
    const svgData = new XMLSerializer().serializeToString(svgRef.current);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const svgUrl = URL.createObjectURL(svgBlob);
    
    const downloadLink = document.createElement('a');
    downloadLink.href = svgUrl;
    downloadLink.download = `${dataset.name}-lineage.svg`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    
    toast.success('Lineage diagram exported as SVG');
  };

  return (
    <div ref={containerRef} className={isFullscreen ? 'fixed inset-0 z-50 bg-white p-6' : ''}>
      <Card className={isFullscreen ? 'h-full' : ''}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <div className="flex items-center justify-center w-10 h-10 bg-primary/10 rounded-lg">
              <GitBranch className="w-6 h-6 text-primary-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-900">Data Lineage</h3>
              <p className="mt-1 text-xs text-gray-500">
                Track the origin and transformations of your data
              </p>
            </div>
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleZoomIn}
              icon={<ZoomIn className="w-4 h-4" />}
            >
              Zoom In
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleZoomOut}
              icon={<ZoomOut className="w-4 h-4" />}
            >
              Zoom Out
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              icon={<Move className="w-4 h-4" />}
            >
              Reset
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={exportSVG}
              icon={<Download className="w-4 h-4" />}
            >
              Export
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={toggleFullscreen}
              icon={isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            >
              {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            </Button>
          </div>
        </div>

        <div className={`relative overflow-hidden border border-gray-200 rounded-lg ${isFullscreen ? 'h-[calc(100%-80px)]' : ''}`}>
          <svg 
            ref={svgRef} 
            width={isFullscreen ? '100%' : width} 
            height={isFullscreen ? '100%' : height}
            className="bg-gray-50"
          ></svg>
          
          <div className="absolute bottom-4 left-4 bg-white p-2 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-primary mr-1"></div>
                <span className="text-xs text-gray-600">Dataset</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-green-500 mr-1"></div>
                <span className="text-xs text-gray-600">Transformation</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-amber-500 mr-1"></div>
                <span className="text-xs text-gray-600">Source</span>
              </div>
            </div>
          </div>
        </div>

        {selectedNode && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium text-gray-900">Node Details</h4>
              <button
                onClick={() => setSelectedNode(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {(() => {
              const node = nodes.find(n => n.id === selectedNode);
              if (!node) return null;
              
              return (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h5 className="text-xs font-medium text-gray-500 uppercase mb-2">Basic Information</h5>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Name:</span>
                        <span className="text-sm font-medium text-gray-900">{node.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Type:</span>
                        <span className="text-sm font-medium text-gray-900">{node.type}</span>
                      </div>
                      {node.description && (
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-500">Description:</span>
                          <span className="text-sm font-medium text-gray-900">{node.description}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {node.metadata && (
                    <div>
                      <h5 className="text-xs font-medium text-gray-500 uppercase mb-2">Metadata</h5>
                      <div className="space-y-2">
                        {Object.entries(node.metadata).map(([key, value]) => (
                          <div key={key} className="flex justify-between">
                            <span className="text-sm text-gray-500">{key}:</span>
                            <span className="text-sm font-medium text-gray-900">
                              {typeof value === 'object' ? JSON.stringify(value) : value.toString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
            
            <div className="mt-4">
              <h5 className="text-xs font-medium text-gray-500 uppercase mb-2">Connections</h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h6 className="text-xs text-gray-500 mb-1">Incoming</h6>
                  <div className="space-y-2">
                    {edges.filter(edge => edge.target === selectedNode).map(edge => {
                      const sourceNode = nodes.find(n => n.id === edge.source);
                      return (
                        <div key={edge.id} className="flex items-center p-2 bg-white rounded border border-gray-200">
                          <div className="w-2 h-2 rounded-full bg-primary mr-2"></div>
                          <span className="text-sm text-gray-900">{sourceNode?.name || edge.source}</span>
                          {edge.label && (
                            <span className="ml-2 text-xs text-gray-500">({edge.label})</span>
                          )}
                        </div>
                      );
                    })}
                    {edges.filter(edge => edge.target === selectedNode).length === 0 && (
                      <p className="text-sm text-gray-500">No incoming connections</p>
                    )}
                  </div>
                </div>
                
                <div>
                  <h6 className="text-xs text-gray-500 mb-1">Outgoing</h6>
                  <div className="space-y-2">
                    {edges.filter(edge => edge.source === selectedNode).map(edge => {
                      const targetNode = nodes.find(n => n.id === edge.target);
                      return (
                        <div key={edge.id} className="flex items-center p-2 bg-white rounded border border-gray-200">
                          <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
                          <span className="text-sm text-gray-900">{targetNode?.name || edge.target}</span>
                          {edge.label && (
                            <span className="ml-2 text-xs text-gray-500">({edge.label})</span>
                          )}
                        </div>
                      );
                    })}
                    {edges.filter(edge => edge.source === selectedNode).length === 0 && (
                      <p className="text-sm text-gray-500">No outgoing connections</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default DataLineage;