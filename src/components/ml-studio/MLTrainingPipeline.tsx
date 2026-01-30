import {
  Database,
  Split,
  Brain,
  TrendingUp,
  CheckCircle,
  Activity,
  Gauge,
  Target,
} from "lucide-react";
import RadialOrbitalTimeline, {
  TimelineItem,
} from "@/components/ui/radial-orbital-timeline";

interface MLTrainingPipelineProps {
  datasetName?: string;
  modelType?: string;
  currentStep?: number;
  trainingProgress?: number;
  heightClass?: string;
}

export default function MLTrainingPipeline({
  datasetName = "Your Dataset",
  modelType = "Neural Network",
  currentStep = 1,
  trainingProgress = 0,
  heightClass = "h-screen",
}: MLTrainingPipelineProps) {
  // Determine status based on currentStep and trainingProgress
  const getStepStatus = (stepId: number): "completed" | "in-progress" | "pending" => {
    if (stepId < currentStep) return "completed";
    if (stepId === currentStep) return "in-progress";
    return "pending";
  };

  const getStepEnergy = (stepId: number): number => {
    if (stepId < currentStep) return 100;
    if (stepId === currentStep) return trainingProgress;
    return 0;
  };

  const timelineData: TimelineItem[] = [
    {
      id: 1,
      title: "Data Loading",
      date: "Step 1",
      content: `Loading ${datasetName} into memory. Validating data integrity and schema consistency.`,
      category: "Data",
      icon: Database,
      relatedIds: [2],
      status: getStepStatus(1),
      energy: getStepEnergy(1),
    },
    {
      id: 2,
      title: "Preprocessing",
      date: "Step 2",
      content: "Cleaning data, handling missing values, normalizing features, and encoding categorical variables.",
      category: "Preparation",
      icon: Activity,
      relatedIds: [1, 3],
      status: getStepStatus(2),
      energy: getStepEnergy(2),
    },
    {
      id: 3,
      title: "Train/Test Split",
      date: "Step 3",
      content: "Splitting dataset into training and testing sets. Applying stratification for balanced distribution.",
      category: "Splitting",
      icon: Split,
      relatedIds: [2, 4],
      status: getStepStatus(3),
      energy: getStepEnergy(3),
    },
    {
      id: 4,
      title: "Model Training",
      date: "Step 4",
      content: `Training ${modelType} model with optimized hyperparameters. Running gradient descent iterations.`,
      category: "Training",
      icon: Brain,
      relatedIds: [3, 5, 6],
      status: getStepStatus(4),
      energy: getStepEnergy(4),
    },
    {
      id: 5,
      title: "Validation",
      date: "Step 5",
      content: "Evaluating model performance on validation set. Computing accuracy, precision, recall metrics.",
      category: "Validation",
      icon: Gauge,
      relatedIds: [4, 6],
      status: getStepStatus(5),
      energy: getStepEnergy(5),
    },
    {
      id: 6,
      title: "Optimization",
      date: "Step 6",
      content: "Fine-tuning hyperparameters. Running grid search and cross-validation for optimal performance.",
      category: "Tuning",
      icon: Target,
      relatedIds: [4, 5, 7],
      status: getStepStatus(6),
      energy: getStepEnergy(6),
    },
    {
      id: 7,
      title: "Evaluation",
      date: "Step 7",
      content: "Final model evaluation on test set. Generating confusion matrix and ROC curves.",
      category: "Testing",
      icon: TrendingUp,
      relatedIds: [6, 8],
      status: getStepStatus(7),
      energy: getStepEnergy(7),
    },
    {
      id: 8,
      title: "Deployment",
      date: "Step 8",
      content: "Model ready for production deployment. Serializing weights and preparing inference pipeline.",
      category: "Deployment",
      icon: CheckCircle,
      relatedIds: [7],
      status: getStepStatus(8),
      energy: getStepEnergy(8),
    },
  ];

  return <RadialOrbitalTimeline timelineData={timelineData} heightClass={heightClass} />;
}
