import React from 'react';
import { CreditCard, AlertCircle } from 'lucide-react';

export const StripeDemoInfo: React.FC = () => {
  const testCards = [
    {
      type: 'Successful Payment',
      number: '4242 4242 4242 4242',
      description: 'Use this card for testing successful payments',
    },
    {
      type: 'Payment Requires Authentication',
      number: '4000 0025 0000 3155',
      description: 'Use this card to test 3D Secure authentication',
    },
    {
      type: 'Declined Payment',
      number: '4000 0000 0000 9995',
      description: 'Use this card to test payment failures',
    },
  ];

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
      <div className="flex items-start gap-3 mb-4">
        <AlertCircle className="h-6 w-6 text-yellow-600 mt-0.5" />
        <div>
          <h3 className="text-lg font-semibold text-yellow-900 mb-2">
            Test Mode Active
          </h3>
          <p className="text-sm text-yellow-800 mb-4">
            This is a demo environment. Use these test cards to simulate payments:
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {testCards.map((card, index) => (
          <div
            key={index}
            className="bg-white rounded-lg p-4 border border-yellow-200"
          >
            <div className="flex items-start gap-3">
              <CreditCard className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 mb-1">{card.type}</h4>
                <p className="text-sm text-gray-600 mb-2">{card.description}</p>
                <div className="bg-gray-50 rounded px-3 py-2 font-mono text-sm text-gray-800">
                  {card.number}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 text-xs text-yellow-700">
        <p className="mb-1">
          <strong>Expiry:</strong> Any future date
        </p>
        <p className="mb-1">
          <strong>CVC:</strong> Any 3 digits
        </p>
        <p>
          <strong>ZIP:</strong> Any 5 digits
        </p>
      </div>

      <div className="mt-4 pt-4 border-t border-yellow-200">
        <p className="text-sm text-yellow-800">
          Learn more about test cards in the{' '}
          <a
            href="https://stripe.com/docs/testing"
            target="_blank"
            rel="noopener noreferrer"
            className="text-yellow-900 underline hover:text-yellow-700"
          >
            Stripe Testing Documentation
          </a>
        </p>
      </div>
    </div>
  );
};
