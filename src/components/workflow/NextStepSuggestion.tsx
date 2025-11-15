import React from 'react';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import Card from '../common/Card';

interface NextStepSuggestionProps {
  title: string;
  description: string;
  href: string;
  icon: React.ElementType;
}

const NextStepSuggestion: React.FC<NextStepSuggestionProps> = ({
  title,
  description,
  href,
  icon: Icon
}) => {
  return (
    <Card className="transition-all hover:shadow-md">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className="flex items-center justify-center w-10 h-10 bg-primary/10 rounded-lg">
            <Icon className="w-6 h-6 text-primary-600" />
          </div>
          <div className="ml-4">
            <h3 className="text-sm font-medium text-gray-900">{title}</h3>
            <p className="mt-1 text-sm text-gray-500">{description}</p>
          </div>
        </div>
        <Link
          to={href}
          className="flex items-center text-sm font-medium text-primary-600 hover:text-primary"
        >
          Continue <ArrowRight className="w-4 h-4 ml-1" />
        </Link>
      </div>
    </Card>
  );
};

export default NextStepSuggestion;