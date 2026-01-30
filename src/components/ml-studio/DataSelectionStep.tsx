import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Database, Search, ChevronRight, Sparkles } from 'lucide-react';
import { useMLContext } from '../../context/MLContext';
import { Dataset } from '../../types';
import Card from '../common/Card';
import Button from '../common/Button';

interface DataSelectionStepProps {
  onNext: (dataset: Dataset) => void;
  selectedDataset?: Dataset | null;
}

const DataSelectionStep: React.FC<DataSelectionStepProps> = ({ onNext, selectedDataset }) => {
  const { datasets } = useMLContext();
  const [searchQuery, setSearchQuery] = useState('');
  const [selected, setSelected] = useState<Dataset | null>(selectedDataset || null);
  const hasLoggedDatasetsRef = useRef(false);

  useEffect(() => {
    if (selectedDataset && selectedDataset.id !== selected?.id) {
      setSelected(selectedDataset);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDataset?.id]);

  useEffect(() => {
    if (!import.meta.env.DEV) return;
    if (hasLoggedDatasetsRef.current) return;
    if (!datasets || datasets.length === 0) return;

    // eslint-disable-next-line no-console
    console.log('[MLStudio][DataSelectionStep] datasets sample:',
      datasets.slice(0, 8).map((d) => ({
        id: d.id,
        name: d.name,
        nameLength: d.name?.length ?? 0,
      }))
    );

    hasLoggedDatasetsRef.current = true;
  }, [datasets]);

  const filteredDatasets = useMemo(() => {
    if (!searchQuery.trim()) return datasets;
    
    const query = searchQuery.toLowerCase();
    return datasets.filter(
      (d) =>
        (d.name ?? '').toLowerCase().includes(query) ||
        (d.description ?? '').toLowerCase().includes(query)
    );
  }, [datasets, searchQuery]);

  const handleSelectAndContinue = () => {
    if (selected) {
      onNext(selected);
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="text-center mb-10">
        <h2 className="text-4xl font-bold text-white mb-4 tracking-tight">
          Select Your Training Data
        </h2>
        <p className="text-gray-400 text-lg leading-relaxed">
          Choose a dataset to train your machine learning model
        </p>
      </div>

      {/* Search */}
      <div className="relative mb-8">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          placeholder="Search datasets..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-4 py-3.5 bg-gray-900/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
        />
      </div>

      {/* Dataset Grid */}
      {filteredDatasets.length === 0 ? (
        <Card className="text-center py-12">
          <Database className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400 mb-2">No datasets found</p>
          <p className="text-sm text-gray-500">
            {searchQuery ? 'Try a different search term' : 'Upload a dataset to get started'}
          </p>
        </Card>
      ) : (
        <div id="ml-dataset-grid" className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {filteredDatasets.map((dataset) => {
            const isSelected = selected?.id === dataset.id;
            const datasetTitle = dataset.name?.trim() ? dataset.name.trim() : 'Untitled dataset';
            
            return (
              <div
                key={dataset.id}
                onClick={() => setSelected(dataset)}
              >
              <Card
                className={`
                  cursor-pointer transition-all duration-200
                  bg-white border-gray-200 text-gray-900
                  dark:bg-gray-900 dark:border-gray-800 dark:text-white
                  ${
                    isSelected
                      ? 'ring-2 ring-indigo-500 border-indigo-500 shadow-lg shadow-indigo-500/20 dark:bg-indigo-950/30'
                      : 'hover:border-gray-300 hover:shadow-md dark:hover:border-gray-700 dark:hover:bg-gray-800/80'
                  }
                `}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Database className="w-5 h-5 text-indigo-400" />
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {datasetTitle}
                      </h3>
                      {isSelected && (
                        <span className="px-2 py-0.5 text-xs font-medium bg-indigo-600 text-white rounded">
                          Selected
                        </span>
                      )}
                    </div>
                    
                    {dataset.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                        {dataset.description}
                      </p>
                    )}

                    <div className="flex flex-wrap gap-3 text-xs text-gray-500 dark:text-gray-500">
                      <span className="flex items-center gap-1">
                        <span className="font-medium text-gray-700 dark:text-gray-400">
                          {dataset.rows?.toLocaleString() || 0}
                        </span>{' '}
                        rows
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="font-medium text-gray-700 dark:text-gray-400">
                          {dataset.columns || 0}
                        </span>{' '}
                        columns
                      </span>
                      <span className="text-gray-400 dark:text-gray-600">•</span>
                      <span>{dataset.fileType?.toUpperCase() || 'CSV'}</span>
                    </div>
                  </div>

                  {/* Radio indicator */}
                  <div
                    className={`
                      w-5 h-5 rounded-full border-2 flex items-center justify-center
                      ${
                        isSelected
                          ? 'border-indigo-500 bg-indigo-500'
                          : 'border-gray-600'
                      }
                    `}
                  >
                    {isSelected && (
                      <div className="w-2 h-2 rounded-full bg-white" />
                    )}
                  </div>
                </div>
              </Card>
              </div>
            );
          })}
        </div>
      )}

      {/* AI Suggestion */}
      {selected && (
        <Card className="bg-gradient-to-br from-indigo-950/50 to-purple-950/50 border-indigo-500/40 mb-6 shadow-lg shadow-indigo-500/10">
          <div className="flex items-start gap-3 p-1">
            <div className="p-2 bg-indigo-500/20 rounded-lg">
              <Sparkles className="w-5 h-5 text-indigo-400 flex-shrink-0" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-indigo-300 mb-1.5">
                AI Recommendation
              </p>
              <p className="text-sm text-gray-300 leading-relaxed">
                This dataset looks great for <span className="font-semibold text-white">classification</span> tasks.
                I'll auto-configure the best algorithm for you.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Continue Button */}
      <div className="flex justify-end pt-4">
        <div className="text-right">
          <Button
            onClick={handleSelectAndContinue}
            disabled={!selected}
            className="px-10 py-3.5 text-base font-semibold flex items-center gap-2 shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 transition-all"
          >
            Continue to Training
            <ChevronRight className="w-5 h-5" />
          </Button>
          <p className="mt-2 text-xs text-gray-500">Continue — auto-detect target + preselect features, ~30s</p>
        </div>
      </div>
    </div>
  );
};

export default DataSelectionStep;
