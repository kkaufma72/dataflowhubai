import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Database, 
  FileInput, 
  FileOutput, 
  Filter, 
  CheckSquare, 
  HardDrive, 
  Cpu, 
  ChevronRight, 
  ChevronDown,
  ChevronLeft,
  Plus
} from 'lucide-react';

interface SidebarItemProps {
  icon: React.ElementType;
  title: string;
  path: string;
  children?: { title: string; path: string }[];
  isActive?: boolean;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ 
  icon: Icon, 
  title, 
  path, 
  children,
  isActive
}) => {
  const [isOpen, setIsOpen] = useState(false);
  
  if (children) {
    return (
      <div className="mb-1">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center w-full px-3 py-2 text-sm font-medium rounded-md group transition-colors ${
            isActive
              ? 'text-primary-700 bg-primary/5'
              : 'text-gray-700 hover:text-primary-600 hover:bg-gray-50'
          }`}
        >
          <Icon className="w-5 h-5 mr-3 text-gray-500 group-hover:text-primary" />
          <span className="flex-1">{title}</span>
          {isOpen ? (
            <ChevronDown className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronRight className="w-4 h-4 text-gray-400" />
          )}
        </button>
        
        {isOpen && (
          <div className="ml-8 mt-1 space-y-1">
            {children.map((child, index) => (
              <NavLink
                key={index}
                to={child.path}
                className={({ isActive }) =>
                  `block px-3 py-2 text-sm font-medium rounded-md ${
                    isActive
                      ? 'text-primary-700 bg-primary/5'
                      : 'text-gray-600 hover:text-primary-600 hover:bg-gray-50'
                  }`
                }
              >
                {child.title}
              </NavLink>
            ))}
          </div>
        )}
      </div>
    );
  }
  
  return (
    <NavLink
      to={path}
      className={({ isActive }) =>
        `flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
          isActive
            ? 'text-primary-700 bg-primary/5'
            : 'text-gray-700 hover:text-primary-600 hover:bg-gray-50'
        }`
      }
    >
      <Icon className="w-5 h-5 mr-3 text-gray-500 group-hover:text-primary" />
      <span>{title}</span>
    </NavLink>
  );
};

const DataPipelineSidebar: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  
  const pipelineItems = [
    {
      icon: Database,
      title: 'Data Sources',
      path: '/pipeline/sources',
      children: [
        { title: 'Databases', path: '/pipeline/sources/databases' },
        { title: 'Files', path: '/pipeline/sources/files' },
        { title: 'APIs', path: '/pipeline/sources/apis' },
        { title: 'Streaming', path: '/pipeline/sources/streaming' }
      ]
    },
    {
      icon: FileInput,
      title: 'Data Ingestion',
      path: '/pipeline/ingestion',
      children: [
        { title: 'Batch Import', path: '/pipeline/ingestion/batch' },
        { title: 'Streaming', path: '/pipeline/ingestion/streaming' },
        { title: 'Scheduled', path: '/pipeline/ingestion/scheduled' }
      ]
    },
    {
      icon: Filter,
      title: 'Data Transformation',
      path: '/pipeline/transformation',
      children: [
        { title: 'Cleaning', path: '/pipeline/transformation/cleaning' },
        { title: 'Filtering', path: '/pipeline/transformation/filtering' },
        { title: 'Aggregation', path: '/pipeline/transformation/aggregation' },
        { title: 'Enrichment', path: '/pipeline/transformation/enrichment' }
      ]
    },
    {
      icon: CheckSquare,
      title: 'Data Quality',
      path: '/pipeline/quality',
      children: [
        { title: 'Validation Rules', path: '/pipeline/quality/rules' },
        { title: 'Profiling', path: '/pipeline/quality/profiling' },
        { title: 'Monitoring', path: '/pipeline/quality/monitoring' }
      ]
    },
    {
      icon: HardDrive,
      title: 'Data Storage',
      path: '/pipeline/storage',
      children: [
        { title: 'Warehouses', path: '/pipeline/storage/warehouses' },
        { title: 'Lakes', path: '/pipeline/storage/lakes' },
        { title: 'Caching', path: '/pipeline/storage/caching' }
      ]
    },
    {
      icon: Cpu,
      title: 'Data Processing',
      path: '/pipeline/processing',
      children: [
        { title: 'Batch Processing', path: '/pipeline/processing/batch' },
        { title: 'Stream Processing', path: '/pipeline/processing/stream' },
        { title: 'ML Processing', path: '/pipeline/processing/ml' }
      ]
    },
    {
      icon: FileOutput,
      title: 'Data Output/Export',
      path: '/pipeline/output',
      children: [
        { title: 'Reports', path: '/pipeline/output/reports' },
        { title: 'APIs', path: '/pipeline/output/apis' },
        { title: 'Exports', path: '/pipeline/output/exports' }
      ]
    }
  ];

  return (
    <div className={`bg-white border-r border-gray-200 ${
      collapsed ? 'w-16' : 'w-64'
    } transition-all duration-300 flex flex-col h-full`}>
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        {!collapsed && <h2 className="text-lg font-semibold text-gray-900">Pipeline</h2>}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
        >
          {collapsed ? (
            <ChevronRight className="w-5 h-5" />
          ) : (
            <ChevronLeft className="w-5 h-5" />
          )}
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-3 space-y-1">
        {collapsed ? (
          // Collapsed view - icons only
          <div className="flex flex-col items-center space-y-4 pt-4">
            {pipelineItems.map((item, index) => (
              <NavLink
                key={index}
                to={item.path}
                className={({ isActive }) =>
                  `p-2 rounded-md ${
                    isActive
                      ? 'bg-primary/5 text-primary-600'
                      : 'text-gray-500 hover:bg-gray-50 hover:text-primary-600'
                  }`
                }
                title={item.title}
              >
                <item.icon className="w-6 h-6" />
              </NavLink>
            ))}
          </div>
        ) : (
          // Expanded view - full sidebar
          <>
            {pipelineItems.map((item, index) => (
              <SidebarItem
                key={index}
                icon={item.icon}
                title={item.title}
                path={item.path}
                children={item.children}
              />
            ))}
          </>
        )}
      </div>
      
      {!collapsed && (
        <div className="p-4 border-t border-gray-200">
          <button className="flex items-center justify-center w-full px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700">
            <Plus className="w-4 h-4 mr-2" />
            New Pipeline
          </button>
        </div>
      )}
    </div>
  );
};

export default DataPipelineSidebar;