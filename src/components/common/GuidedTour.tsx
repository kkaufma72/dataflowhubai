import React, { useState, useEffect } from 'react';
import Joyride, { CallBackProps, STATUS, Step } from 'react-joyride';
import { useLocation, Location } from 'react-router-dom';

interface GuidedTourProps {
  steps: Step[];
  run: boolean;
  onFinish?: () => void;
  onSkip?: () => void;
  location?: Location;
  continuous?: boolean;
  showSkipButton?: boolean;
  showProgress?: boolean;
  disableOverlayClose?: boolean;
  spotlightClicks?: boolean;
}

const GuidedTour: React.FC<GuidedTourProps> = ({ 
  steps, 
  run, 
  onFinish, 
  onSkip,
  location: propLocation,
  continuous = true,
  showSkipButton = true,
  showProgress = true,
  disableOverlayClose = false,
  spotlightClicks = false
}) => {
  const [tourSteps, setTourSteps] = useState<Step[]>([]);
  const routerLocation = useLocation();
  const location = propLocation || routerLocation;

  // Filter steps based on current route
  useEffect(() => {
    // Only show steps that are relevant to the current route
    const filteredSteps = steps.filter(step => {
      // If no route is specified, show on all routes
      if (!step.target && !step.content) return false;
      if (!step.placement) return true;
      
      // If route is specified, check if current route matches
      if (step.placementBeacon && typeof step.placementBeacon === 'object' && 'route' in step.placementBeacon) {
        const route = step.placementBeacon.route as string;
        return location.pathname === route || location.pathname.startsWith(route);
      }
      
      return true;
    });
    
    setTourSteps(filteredSteps);
  }, [steps, location.pathname]);

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status, type } = data;
    
    if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status)) {
      if (status === STATUS.FINISHED && onFinish) {
        onFinish();
      } else if (status === STATUS.SKIPPED && onSkip) {
        onSkip();
      }
    }
  };

  return (
    <Joyride
      steps={tourSteps}
      run={run && tourSteps.length > 0}
      continuous={continuous}
      showProgress={showProgress}
      showSkipButton={showSkipButton}
      disableScrolling={true}
      disableOverlayClose={disableOverlayClose}
      spotlightClicks={spotlightClicks}
      styles={{
        options: {
          primaryColor: '#4F46E5', // Indigo-600
          textColor: '#1F2937', // Gray-800
          backgroundColor: '#FFFFFF',
          arrowColor: '#FFFFFF',
          overlayColor: 'rgba(0, 0, 0, 0.5)',
        },
        buttonNext: {
          backgroundColor: '#4F46E5',
          color: '#FFFFFF',
          fontSize: '14px',
          padding: '8px 16px',
        },
        buttonBack: {
          color: '#4F46E5',
          fontSize: '14px',
          marginRight: 10,
          padding: '8px 16px',
        },
        buttonSkip: {
          color: '#6B7280', // Gray-500
          fontSize: '14px',
          padding: '8px 16px',
        },
        beacon: {
          offsetX: 0,
          offsetY: 0,
        },
        tooltip: {
          borderRadius: '8px',
          fontSize: '14px',
          padding: '16px',
          maxWidth: '350px',
        },
      }}
      callback={handleJoyrideCallback}
      locale={{
        back: 'Back',
        close: 'Close',
        last: 'Finish',
        next: 'Next',
        open: 'Open',
        skip: 'Skip tour'
      }}
    />
  );
};

export default GuidedTour;