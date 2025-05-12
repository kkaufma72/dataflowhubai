import React from 'react';
import { HelpCircle } from 'lucide-react';
import { useTour } from './TourProvider';
import Button from './Button';

interface TourButtonProps {
  tourName: string;
  className?: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  label?: string;
}

const TourButton: React.FC<TourButtonProps> = ({
  tourName,
  className = '',
  variant = 'outline',
  size = 'sm',
  label = 'Take a tour'
}) => {
  const { startTour, completedTours } = useTour();
  const hasCompletedTour = completedTours.includes(tourName);

  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={() => startTour(tourName)}
      icon={<HelpCircle className="w-4 h-4" />}
    >
      {label}
      {hasCompletedTour && (
        <span className="ml-1 text-xs text-gray-500">(Completed)</span>
      )}
    </Button>
  );
};

export default TourButton;