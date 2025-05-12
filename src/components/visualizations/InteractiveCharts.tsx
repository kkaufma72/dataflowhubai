import React, { useState, useEffect, useRef } from 'react';
import { Card } from '../common/Card';
import Button from '../common/Button';
import { BarChart2, PieChart, LineChart, ScatterChart as ScatterPlot, Download, Share, Maximize2, Minimize2, Settings, RefreshCw, Filter, Eye, EyeOff, ChevronDown, ChevronUp, Sliders, Save } from 'lucide-react';
import { Bar, Line, Pie, Scatter, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { saveAs } from 'file-saver';
import * as d3 from 'd3';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string | string[];
    borderWidth?: number;
    fill?: boolean;
    tension?: number;
    pointRadius?: number;
    pointHoverRadius?: number;
  }[];
}

interface ChartOptions {
  responsive: boolean;
  maintainAspectRatio: boolean;
  plugins: {
    legend: {
      position: 'top' | 'bottom' | 'left' | 'right';
      display: boolean;
    };
    title: {
      display: boolean;
      text: string;
    };
    tooltip: {
      mode?: 'index' | 'point' | 'nearest' | 'dataset';
      intersect?: boolean;
    };
  };
  scales?: {
    x?: {
      title?: {
        display?: boolean;
        text?: string;
      };
      grid?: {
        display?: boolean;
      };
      ticks?: {
        autoSkip?: boolean;
        maxRotation?: number;
      };
    };
    y?: {
      title?: {
        display?: boolean;
        text?: string;
      };
      beginAtZero?: boolean;
      grid?: {
        display?: boolean;
      };
    };
  };
}

interface InteractiveChartProps {
  type: 'bar' | 'line' | 'pie' | 'scatter' | 'doughnut';
  data: ChartData;
  options?: Partial<ChartOptions>;
  title?: string;
  description?: string;
  height?: number;
  allowDownload?: boolean;
  allowFullscreen?: boolean;
  allowSettings?: boolean;
  onRefresh?: () => void;
  isLoading?: boolean;
}

const defaultOptions: ChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top',
      display: true
    },
    title: {
      display: false,
      text: ''
    },
    tooltip: {
      mode: 'index',
      intersect: false
    }
  },
  scales: {
    x: {
      title: {
        display: false,
        text: ''
      },
      grid: {
        display: false
      }
    },
    y: {
      beginAtZero: true,
      title: {
        display: false,
        text: ''
      }
    }
  }
};

const InteractiveChart: React.FC<InteractiveChartProps> = ({
  type,
  data,
  options = {},
  title,
  description,
  height = 300,
  allowDownload = true,
  allowFullscreen = true,
  allowSettings = true,
  onRefresh,
  isLoading = false
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [chartOptions, setChartOptions] = useState<ChartOptions>({
    ...defaultOptions,
    ...options
  });
  const [visibleDatasets, setVisibleDatasets] = useState<number[]>(
    data.datasets.map((_, index) => index)
  );
  const [customTitle, setCustomTitle] = useState(title || '');
  const [xAxisTitle, setXAxisTitle] = useState(chartOptions.scales?.x?.title?.text || '');
  const [yAxisTitle, setYAxisTitle] = useState(chartOptions.scales?.y?.title?.text || '');
  const [legendPosition, setLegendPosition] = useState<'top' | 'bottom' | 'left' | 'right'>(
    chartOptions.plugins.legend.position
  );
  const [showLegend, setShowLegend] = useState(chartOptions.plugins.legend.display);
  const [showGridLines, setShowGridLines] = useState(!!chartOptions.scales?.y?.grid?.display);
  
  const chartRef = useRef(null);
  const containerRef = useRef(null);

  // Update chart options when settings change
  useEffect(() => {
    setChartOptions(prev => ({
      ...prev,
      plugins: {
        ...prev.plugins,
        legend: {
          ...prev.plugins.legend,
          position: legendPosition,
          display: showLegend
        },
        title: {
          ...prev.plugins.title,
          display: !!customTitle,
          text: customTitle
        }
      },
      scales: {
        x: {
          ...prev.scales?.x,
          title: {
            display: !!xAxisTitle,
            text: xAxisTitle
          }
        },
        y: {
          ...prev.scales?.y,
          title: {
            display: !!yAxisTitle,
            text: yAxisTitle
          },
          grid: {
            display: showGridLines
          }
        }
      }
    }));
  }, [customTitle, xAxisTitle, yAxisTitle, legendPosition, showLegend, showGridLines]);

  // Filter visible datasets
  const filteredData = {
    ...data,
    datasets: data.datasets.filter((_, index) => visibleDatasets.includes(index))
  };

  // Toggle dataset visibility
  const toggleDataset = (index: number) => {
    if (visibleDatasets.includes(index)) {
      setVisibleDatasets(visibleDatasets.filter(i => i !== index));
    } else {
      setVisibleDatasets([...visibleDatasets, index].sort());
    }
  };

  // Toggle fullscreen mode
  const toggleFullscreen = () => {
    if (!isFullscreen) {
      if (containerRef.current?.requestFullscreen) {
        containerRef.current.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
    setIsFullscreen(!isFullscreen);
  };

  // Download chart as image
  const downloadChart = () => {
    if (chartRef.current) {
      const canvas = chartRef.current;
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `${customTitle || 'chart'}.png`;
      link.href = dataUrl;
      link.click();
    }
  };

  // Download chart data as CSV
  const downloadData = () => {
    const csvRows = [];
    
    // Add header row
    const headers = ['Label', ...data.datasets.map(ds => ds.label)];
    csvRows.push(headers.join(','));
    
    // Add data rows
    data.labels.forEach((label, i) => {
      const row = [label];
      data.datasets.forEach(dataset => {
        row.push(dataset.data[i]);
      });
      csvRows.push(row.join(','));
    });
    
    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8' });
    saveAs(blob, `${customTitle || 'chart-data'}.csv`);
  };

  // Render the appropriate chart type
  const renderChart = () => {
    const chartProps = {
      data: filteredData,
      options: chartOptions,
      ref: chartRef
    };

    switch (type) {
      case 'bar':
        return <Bar {...chartProps} />;
      case 'line':
        return <Line {...chartProps} />;
      case 'pie':
        return <Pie {...chartProps} />;
      case 'doughnut':
        return <Doughnut {...chartProps} />;
      case 'scatter':
        return <Scatter {...chartProps} />;
      default:
        return <Bar {...chartProps} />;
    }
  };

  // Get the appropriate icon for the chart type
  const getChartIcon = () => {
    switch (type) {
      case 'bar':
        return <BarChart2 className="w-5 h-5 text-indigo-600" />;
      case 'line':
        return <LineChart className="w-5 h-5 text-green-600" />;
      case 'pie':
      case 'doughnut':
        return <PieChart className="w-5 h-5 text-amber-600" />;
      case 'scatter':
        return <ScatterPlot className="w-5 h-5 text-purple-600" />;
      default:
        return <BarChart2 className="w-5 h-5 text-indigo-600" />;
    }
  };

  return (
    <div 
      ref={containerRef}
      className={`transition-all ${isFullscreen ? 'fixed inset-0 z-50 bg-white p-6' : ''}`}
    >
      <Card className={isFullscreen ? 'h-full' : ''}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            {getChartIcon()}
            <div className="ml-3">
              <h3 className="text-sm font-medium text-gray-900">{customTitle || title || 'Chart'}</h3>
              {description && <p className="mt-1 text-xs text-gray-500">{description}</p>}
            </div>
          </div>
          <div className="flex space-x-2">
            {allowSettings && (
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
                title="Settings"
              >
                <Settings className="w-4 h-4" />
              </button>
            )}
            {onRefresh && (
              <button
                onClick={onRefresh}
                className={`p-1.5 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 ${
                  isLoading ? 'animate-spin' : ''
                }`}
                title="Refresh"
                disabled={isLoading}
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            )}
            {allowDownload && (
              <div className="relative group">
                <button
                  className="p-1.5 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
                  title="Download"
                >
                  <Download className="w-4 h-4" />
                </button>
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg hidden group-hover:block z-10">
                  <div className="py-1">
                    <button
                      onClick={downloadChart}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Download as Image
                    </button>
                    <button
                      onClick={downloadData}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Download as CSV
                    </button>
                  </div>
                </div>
              </div>
            )}
            {allowFullscreen && (
              <button
                onClick={toggleFullscreen}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
                title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
              >
                {isFullscreen ? (
                  <Minimize2 className="w-4 h-4" />
                ) : (
                  <Maximize2 className="w-4 h-4" />
                )}
              </button>
            )}
          </div>
        </div>

        {showSettings && (
          <div className="mb-4 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium text-gray-700">Chart Settings</h4>
              <button
                onClick={() => setShowSettings(false)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
              >
                <ChevronUp className="w-4 h-4" />
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Chart Title
                </label>
                <input
                  type="text"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="Enter chart title"
                />
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Legend Position
                </label>
                <select
                  value={legendPosition}
                  onChange={(e) => setLegendPosition(e.target.value as any)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                >
                  <option value="top">Top</option>
                  <option value="bottom">Bottom</option>
                  <option value="left">Left</option>
                  <option value="right">Right</option>
                </select>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  X-Axis Title
                </label>
                <input
                  type="text"
                  value={xAxisTitle}
                  onChange={(e) => setXAxisTitle(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="X-Axis"
                />
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Y-Axis Title
                </label>
                <input
                  type="text"
                  value={yAxisTitle}
                  onChange={(e) => setYAxisTitle(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="Y-Axis"
                />
              </div>
              
              <div className="flex items-center">
                <input
                  id="show-legend"
                  type="checkbox"
                  checked={showLegend}
                  onChange={(e) => setShowLegend(e.target.checked)}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="show-legend" className="ml-2 block text-sm text-gray-900">
                  Show Legend
                </label>
              </div>
              
              <div className="flex items-center">
                <input
                  id="show-grid"
                  type="checkbox"
                  checked={showGridLines}
                  onChange={(e) => setShowGridLines(e.target.checked)}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="show-grid" className="ml-2 block text-sm text-gray-900">
                  Show Grid Lines
                </label>
              </div>
            </div>
            
            <div className="mt-4">
              <h4 className="text-xs font-medium text-gray-700 mb-2">Visible Datasets</h4>
              <div className="flex flex-wrap gap-2">
                {data.datasets.map((dataset, index) => (
                  <button
                    key={index}
                    onClick={() => toggleDataset(index)}
                    className={`inline-flex items-center px-2.5 py-1.5 border text-xs font-medium rounded ${
                      visibleDatasets.includes(index)
                        ? 'bg-indigo-100 text-indigo-800 border-indigo-200'
                        : 'bg-gray-100 text-gray-800 border-gray-200'
                    }`}
                  >
                    {visibleDatasets.includes(index) ? (
                      <Eye className="w-3 h-3 mr-1" />
                    ) : (
                      <EyeOff className="w-3 h-3 mr-1" />
                    )}
                    {dataset.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        <div 
          style={{ height: isFullscreen ? 'calc(100% - 100px)' : `${height}px` }}
          className="relative"
        >
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-70 z-10">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
          )}
          {renderChart()}
        </div>
      </Card>
    </div>
  );
};

// Multi-chart dashboard component
interface ChartDashboardProps {
  charts: {
    id: string;
    type: 'bar' | 'line' | 'pie' | 'scatter' | 'doughnut';
    title: string;
    description?: string;
    data: ChartData;
    options?: Partial<ChartOptions>;
  }[];
  layout?: 'grid' | 'rows';
  title?: string;
  onRefresh?: () => void;
}

export const ChartDashboard: React.FC<ChartDashboardProps> = ({
  charts,
  layout = 'grid',
  title,
  onRefresh
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleRefresh = () => {
    if (onRefresh) {
      setIsLoading(true);
      onRefresh();
      setTimeout(() => setIsLoading(false), 1000);
    }
  };

  return (
    <div className="space-y-6">
      {title && (
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium text-gray-900">{title}</h2>
          {onRefresh && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isLoading}
              icon={isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            >
              {isLoading ? 'Refreshing...' : 'Refresh All'}
            </Button>
          )}
        </div>
      )}

      <div className={`grid gap-6 ${
        layout === 'grid' 
          ? 'md:grid-cols-2' 
          : 'grid-cols-1'
      }`}>
        {charts.map(chart => (
          <InteractiveChart
            key={chart.id}
            type={chart.type}
            data={chart.data}
            options={chart.options}
            title={chart.title}
            description={chart.description}
            height={layout === 'grid' ? 300 : 400}
            isLoading={isLoading}
          />
        ))}
      </div>
    </div>
  );
};

// Advanced D3 visualization component
interface D3VisualizationProps {
  data: any[];
  type: 'force-directed' | 'tree' | 'sankey' | 'heatmap';
  width?: number;
  height?: number;
  title?: string;
  description?: string;
}

export const D3Visualization: React.FC<D3VisualizationProps> = ({
  data,
  type,
  width = 600,
  height = 400,
  title,
  description
}) => {
  const svgRef = useRef(null);
  
  useEffect(() => {
    if (!svgRef.current) return;
    
    // Clear previous visualization
    d3.select(svgRef.current).selectAll('*').remove();
    
    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height);
    
    switch (type) {
      case 'force-directed':
        renderForceDirected(svg, data, width, height);
        break;
      case 'tree':
        renderTree(svg, data, width, height);
        break;
      case 'heatmap':
        renderHeatmap(svg, data, width, height);
        break;
      default:
        break;
    }
  }, [data, type, width, height]);
  
  // Force-directed graph
  const renderForceDirected = (svg, data, width, height) => {
    const nodes = data.nodes || [];
    const links = data.links || [];
    
    const simulation = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(links).id(d => d.id).distance(100))
      .force('charge', d3.forceManyBody().strength(-200))
      .force('center', d3.forceCenter(width / 2, height / 2));
    
    const link = svg.append('g')
      .selectAll('line')
      .data(links)
      .enter().append('line')
      .attr('stroke', '#999')
      .attr('stroke-opacity', 0.6)
      .attr('stroke-width', d => Math.sqrt(d.value || 1));
    
    const node = svg.append('g')
      .selectAll('circle')
      .data(nodes)
      .enter().append('circle')
      .attr('r', 5)
      .attr('fill', d => d.color || '#4F46E5')
      .call(d3.drag()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended));
    
    node.append('title')
      .text(d => d.name || d.id);
    
    simulation.on('tick', () => {
      link
        .attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y);
      
      node
        .attr('cx', d => d.x)
        .attr('cy', d => d.y);
    });
    
    function dragstarted(event) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }
    
    function dragged(event) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }
    
    function dragended(event) {
      if (!event.active) simulation.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
    }
  };
  
  // Tree visualization
  const renderTree = (svg, data, width, height) => {
    const root = d3.hierarchy(data);
    const treeLayout = d3.tree().size([width - 100, height - 100]);
    treeLayout(root);
    
    const g = svg.append('g').attr('transform', 'translate(50,50)');
    
    // Links
    g.selectAll('.link')
      .data(root.links())
      .enter().append('path')
      .attr('class', 'link')
      .attr('fill', 'none')
      .attr('stroke', '#999')
      .attr('d', d3.linkHorizontal()
        .x(d => d.y)
        .y(d => d.x));
    
    // Nodes
    const node = g.selectAll('.node')
      .data(root.descendants())
      .enter().append('g')
      .attr('class', 'node')
      .attr('transform', d => `translate(${d.y},${d.x})`);
    
    node.append('circle')
      .attr('r', 4)
      .attr('fill', d => d.children ? '#4F46E5' : '#10B981');
    
    node.append('text')
      .attr('dy', '0.31em')
      .attr('x', d => d.children ? -8 : 8)
      .attr('text-anchor', d => d.children ? 'end' : 'start')
      .text(d => d.data.name)
      .attr('font-size', '10px')
      .attr('fill', '#4B5563');
  };
  
  // Heatmap visualization
  const renderHeatmap = (svg, data, width, height) => {
    const margin = { top: 30, right: 30, bottom: 70, left: 70 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;
    
    const x = d3.scaleBand()
      .domain(data.map(d => d.x))
      .range([0, innerWidth])
      .padding(0.05);
    
    const y = d3.scaleBand()
      .domain(data.map(d => d.y))
      .range([innerHeight, 0])
      .padding(0.05);
    
    const color = d3.scaleSequential()
      .interpolator(d3.interpolateInferno)
      .domain([0, d3.max(data, d => d.value)]);
    
    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);
    
    // Heatmap cells
    g.selectAll('rect')
      .data(data)
      .enter().append('rect')
      .attr('x', d => x(d.x))
      .attr('y', d => y(d.y))
      .attr('width', x.bandwidth())
      .attr('height', y.bandwidth())
      .attr('fill', d => color(d.value))
      .append('title')
      .text(d => `${d.x}, ${d.y}: ${d.value}`);
    
    // X axis
    g.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(d3.axisBottom(x))
      .selectAll('text')
      .attr('transform', 'translate(-10,0)rotate(-45)')
      .style('text-anchor', 'end')
      .attr('font-size', '10px');
    
    // Y axis
    g.append('g')
      .call(d3.axisLeft(y))
      .selectAll('text')
      .attr('font-size', '10px');
    
    // Color legend
    const legendWidth = 20;
    const legendHeight = innerHeight;
    
    const legendScale = d3.scaleSequential()
      .interpolator(d3.interpolateInferno)
      .domain([0, d3.max(data, d => d.value)]);
    
    const legend = svg.append('g')
      .attr('transform', `translate(${width - margin.right + 20},${margin.top})`);
    
    const legendGradient = legend.append('defs')
      .append('linearGradient')
      .attr('id', 'legend-gradient')
      .attr('gradientTransform', 'rotate(90)');
    
    legendGradient.selectAll('stop')
      .data(d3.range(0, 1.01, 0.1))
      .enter().append('stop')
      .attr('offset', d => d)
      .attr('stop-color', d => legendScale(d * d3.max(data, d => d.value)));
    
    legend.append('rect')
      .attr('width', legendWidth)
      .attr('height', legendHeight)
      .style('fill', 'url(#legend-gradient)');
    
    const legendAxis = d3.axisRight(d3.scaleLinear()
      .domain([0, d3.max(data, d => d.value)])
      .range([legendHeight, 0]));
    
    legend.append('g')
      .attr('transform', `translate(${legendWidth},0)`)
      .call(legendAxis);
  };
  
  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <BarChart2 className="w-5 h-5 text-indigo-600 mr-2" />
          <div>
            <h3 className="text-sm font-medium text-gray-900">{title || 'D3 Visualization'}</h3>
            {description && <p className="mt-1 text-xs text-gray-500">{description}</p>}
          </div>
        </div>
        <div className="flex space-x-2">
          <button
            className="p-1.5 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
            title="Download"
            onClick={() => {
              if (svgRef.current) {
                const svgData = new XMLSerializer().serializeToString(svgRef.current);
                const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
                saveAs(svgBlob, `${title || 'visualization'}.svg`);
              }
            }}
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>
      <div className="overflow-auto">
        <svg ref={svgRef} width={width} height={height}></svg>
      </div>
    </Card>
  );
};

export default InteractiveChart;