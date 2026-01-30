import { useState } from "react";
import MLTrainingPipeline from "@/components/ml-studio/MLTrainingPipeline";
import { Play, RotateCcw } from "lucide-react";

export default function MLPipelineDemo() {
  const [currentStep, setCurrentStep] = useState(1);
  const [trainingProgress, setTrainingProgress] = useState(0);
  const [isTraining, setIsTraining] = useState(false);

  const startTraining = () => {
    setIsTraining(true);
    setCurrentStep(1);
    setTrainingProgress(0);

    // Simulate training progress through steps
    const interval = setInterval(() => {
      setTrainingProgress((prev) => {
        if (prev >= 100) {
          setCurrentStep((step) => {
            if (step >= 8) {
              clearInterval(interval);
              setIsTraining(false);
              return 8;
            }
            return step + 1;
          });
          return 0;
        }
        return prev + 5;
      });
    }, 200);
  };

  const resetTraining = () => {
    setCurrentStep(1);
    setTrainingProgress(0);
    setIsTraining(false);
  };

  return (
    <div className="relative w-full h-screen">
      {/* Control Panel */}
      <div className="absolute top-8 left-8 z-50 bg-black/80 backdrop-blur-lg border border-white/20 rounded-lg p-6 shadow-xl max-w-sm">
        <h2 className="text-white text-xl font-bold mb-4">ML Training Pipeline</h2>
        <p className="text-white/70 text-sm mb-6">
          Interactive visualization of the machine learning training process. Click nodes to explore each step.
        </p>

        <div className="space-y-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-white/70">Current Step:</span>
            <span className="text-white font-mono font-bold">
              {currentStep}/8
            </span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-white/70">Progress:</span>
            <span className="text-white font-mono font-bold">
              {trainingProgress}%
            </span>
          </div>

          <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300"
              style={{ width: `${((currentStep - 1) * 100 + trainingProgress) / 8}%` }}
            ></div>
          </div>

          <div className="flex gap-2 pt-4">
            <button
              onClick={startTraining}
              disabled={isTraining}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium text-sm"
            >
              <Play size={16} />
              {isTraining ? "Training..." : "Start Training"}
            </button>

            <button
              onClick={resetTraining}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-all"
            >
              <RotateCcw size={16} />
            </button>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-white/10">
          <h3 className="text-white text-sm font-semibold mb-2">Instructions</h3>
          <ul className="text-white/60 text-xs space-y-1">
            <li>• Click any node to view details</li>
            <li>• Connected nodes pulse when selected</li>
            <li>• Click background to deselect</li>
            <li>• Nodes rotate automatically when idle</li>
          </ul>
        </div>
      </div>

      {/* Pipeline Visualization */}
      <MLTrainingPipeline
        datasetName="Sales Dataset (10,000 rows)"
        modelType="Random Forest Classifier"
        currentStep={currentStep}
        trainingProgress={trainingProgress}
      />
    </div>
  );
}
