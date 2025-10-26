import React from 'react';
import React from 'react';
const DndProvider = React.lazy(() => import('react-dnd').then(m => ({ default: m.DndProvider })));
const loadHTML5Backend = () => import('react-dnd-html5-backend').then(m => m.HTML5Backend);
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

      <React.Suspense fallback={null}>
        {/* @ts-ignore */}
        <DndProvider backend={loadHTML5Backend as any}>
        <PipelineBuilder />
        </DndProvider>
      </React.Suspense>
    </div>
  );
};

export default PipelineBuilderPage;