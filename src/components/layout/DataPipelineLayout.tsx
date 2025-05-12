import React from 'react';
import { Outlet } from 'react-router-dom';
import DataPipelineSidebar from './DataPipelineSidebar';
import DataPipelineTopNav from './DataPipelineTopNav';

const DataPipelineLayout: React.FC = () => {
  return (
    <div className="h-screen flex flex-col">
      {/* Top Navigation */}
      <DataPipelineTopNav />
      
      {/* Main Content Area with Sidebar */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <DataPipelineSidebar />
        
        {/* Main Content */}
        <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DataPipelineLayout;