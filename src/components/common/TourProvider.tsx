import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Step } from 'react-joyride';
import { useLocation } from 'react-router-dom';
import GuidedTour from './GuidedTour';

// Define tour steps for different sections of the app
const dashboardTourSteps: Step[] = [
  {
    target: 'body',
    content: 'Welcome to the DataFlowHub AI! This is your dashboard where you can see an overview of your projects, datasets, and models.',
    disableBeacon: true,
    placement: 'center',
  },
  {
    target: '.quick-actions',
    content: 'Use these quick actions to upload datasets, train models, and more.',
    placement: 'bottom',
  },
  {
    target: '.stats-cards',
    content: 'Here you can see key statistics about your datasets and models.',
    placement: 'bottom',
  },
  {
    target: '.workflow-steps',
    content: 'This shows your current progress in the ML workflow. Follow these steps to build and deploy your models.',
    placement: 'bottom',
  },
  {
    target: '.quick-actions',
    content: 'You can create a new project anytime using the New Project button in the top right.',
    placement: 'left',
  },
];

const dataTourSteps: Step[] = [
  {
    target: '.data-management-header',
    content: 'This is the Data Management section where you can upload, explore, and preprocess your datasets.',
    disableBeacon: true,
    placement: 'bottom',
  },
  {
    target: '.data-upload-button',
    content: 'Click here to upload a new dataset.',
    placement: 'bottom',
  },
  {
    target: '.dataset-cards',
    content: 'Your uploaded datasets will appear here. Click on a dataset to view details and perform operations.',
    placement: 'top',
  },
];

const modelTrainingTourSteps: Step[] = [
  {
    target: '.model-training-header',
    content: 'This is the Model Training section where you can train machine learning models on your datasets.',
    disableBeacon: true,
    placement: 'bottom',
  },
  {
    target: '.model-training-form',
    content: 'Configure your model training parameters here.',
    placement: 'right',
  },
  {
    target: '.algorithm-selection',
    content: 'Select one or more algorithms to train your model.',
    placement: 'left',
  },
];

const deploymentTourSteps: Step[] = [
  {
    target: '.deployment-header',
    content: 'This is the Deployment section where you can deploy your trained models as APIs.',
    disableBeacon: true,
    placement: 'bottom',
  },
  {
    target: '.model-selection',
    content: 'Select a model to deploy from your trained models.',
    placement: 'right',
  },
  {
    target: '.deployment-config',
    content: 'Configure your deployment settings here.',
    placement: 'left',
  },
];

// Combine all tour steps
const allTourSteps: Record<string, Step[]> = {
  dashboard: dashboardTourSteps,
  data: dataTourSteps,
  training: modelTrainingTourSteps,
  deployment: deploymentTourSteps,
};

interface TourContextType {
  startTour: (tourName: string) => void;
  endTour: () => void;
  isTourRunning: boolean;
  completedTours: string[];
}

const TourContext = createContext<TourContextType | undefined>(undefined);

export const useTour = () => {
  const context = useContext(TourContext);
  if (!context) {
    throw new Error('useTour must be used within a TourProvider');
  }
  return context;
};

interface TourProviderProps {
  children: ReactNode;
}

export const TourProvider: React.FC<TourProviderProps> = ({ children }) => {
  const [activeTour, setActiveTour] = useState<string | null>(null);
  const [isTourRunning, setIsTourRunning] = useState(false);
  const [completedTours, setCompletedTours] = useState<string[]>([]);
  const location = useLocation();

  // Load completed tours from localStorage on mount
  useEffect(() => {
    try {
      const savedTours = localStorage.getItem('completedTours');
      if (savedTours) {
        setCompletedTours(JSON.parse(savedTours));
      }
    } catch (error) {
      console.error('Failed to load completed tours from localStorage:', error);
    }
  }, []);

  // Save completed tours to localStorage when updated
  useEffect(() => {
    try {
      localStorage.setItem('completedTours', JSON.stringify(completedTours));
    } catch (error) {
      console.error('Failed to save completed tours to localStorage:', error);
    }
  }, [completedTours]);

  const startTour = (tourName: string) => {
    if (tourName in allTourSteps) {
      setActiveTour(tourName);
      setIsTourRunning(true);
    } else {
      console.warn(`Tour "${tourName}" not found`);
    }
  };

  const endTour = () => {
    if (activeTour) {
      setCompletedTours(prev => [...prev, activeTour]);
    }
    setIsTourRunning(false);
    setActiveTour(null);
  };

  const handleTourFinish = () => {
    if (activeTour) {
      setCompletedTours(prev => [...prev, activeTour]);
    }
    setIsTourRunning(false);
    setActiveTour(null);
  };

  const handleTourSkip = () => {
    setIsTourRunning(false);
    setActiveTour(null);
  };

  return (
    <TourContext.Provider
      value={{
        startTour,
        endTour,
        isTourRunning,
        completedTours,
      }}
    >
      {children}
      {activeTour && (
        <GuidedTour
          steps={allTourSteps[activeTour]}
          run={isTourRunning}
          onFinish={handleTourFinish}
          onSkip={handleTourSkip}
          location={location}
          continuous={true}
          showSkipButton={true}
          showProgress={true}
          disableOverlayClose={false}
          spotlightClicks={false}
        />
      )}
    </TourContext.Provider>
  );
};

export default TourProvider;