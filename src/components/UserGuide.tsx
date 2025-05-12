import React from 'react';
import { Book, ArrowRight, CheckCircle } from 'lucide-react';
import Card from './common/Card';
import Button from './common/Button';

interface UserGuideProps {
  title: string;
  description: string;
  steps: {
    title: string;
    description: string;
    image?: string;
  }[];
  relatedGuides?: {
    title: string;
    path: string;
  }[];
}

const UserGuide: React.FC<UserGuideProps> = ({
  title,
  description,
  steps,
  relatedGuides = []
}) => {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <div className="flex items-center justify-center w-10 h-10 bg-indigo-100 rounded-lg">
            <Book className="w-6 h-6 text-indigo-600" />
          </div>
          <h1 className="ml-4 text-2xl font-bold text-gray-900">{title}</h1>
        </div>
        <p className="text-gray-600">{description}</p>
      </div>

      <Card className="mb-8">
        <div className="space-y-8">
          {steps.map((step, index) => (
            <div key={index} className="flex">
              <div className="flex-shrink-0 mr-4">
                <div className="flex items-center justify-center w-8 h-8 text-white bg-indigo-600 rounded-full">
                  {index + 1}
                </div>
              </div>
              <div className="flex-1">
                <h3 className="mb-2 text-lg font-medium text-gray-900">{step.title}</h3>
                <p className="mb-4 text-gray-600">{step.description}</p>
                {step.image && (
                  <div className="mt-4 overflow-hidden border border-gray-200 rounded-lg">
                    <img src={step.image} alt={step.title} className="w-full" />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {relatedGuides.length > 0 && (
        <div className="mb-8">
          <h2 className="mb-4 text-xl font-semibold text-gray-900">Related Guides</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {relatedGuides.map((guide, index) => (
              <Card key={index} className="transition-all hover:shadow-md">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-gray-900">{guide.title}</h3>
                  <Button
                    variant="outline"
                    size="sm"
                    icon={<ArrowRight className="w-4 h-4" />}
                    onClick={() => window.location.href = guide.path}
                  >
                    View
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      <div className="p-4 bg-green-50 rounded-lg">
        <div className="flex">
          <div className="flex-shrink-0">
            <CheckCircle className="w-5 h-5 text-green-400" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-green-800">Need more help?</h3>
            <div className="mt-2 text-sm text-green-700">
              <p>
                If you need additional assistance, our support team is available to help.
                Contact us at support@dataflowhub.ai or visit our help center.
              </p>
            </div>
            <div className="mt-4">
              <Button
                variant="outline"
                size="sm"
                className="text-green-700 border-green-300 hover:bg-green-100"
              >
                Contact Support
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserGuide;