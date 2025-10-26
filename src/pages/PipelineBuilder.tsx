import React from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import PipelineBuilder from '../components/pipeline/PipelineBuilder';

const PipelineBuilderPage: React.FC = () => {
  return (
    <div>
      <div className="flex flex-col justify-between mb-6 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pipeline Builder</h1>
          <p className="mt-1 text-sm text-gray-500">
            Create and manage machine learning pipelines with drag-and-drop
          </p>
        </div>
      </div>

      <DndProvider backend={HTML5Backend}>
        <PipelineBuilder />
      </DndProvider>
    </div>
  );
};

export default PipelineBuilderPage;