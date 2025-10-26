import React from 'react';
import { AlertCircle, Settings, ExternalLink } from 'lucide-react';

const SupabaseConfigError: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
        <div className="flex items-center mb-4">
          <AlertCircle className="w-8 h-8 text-red-500 mr-3" />
          <h1 className="text-xl font-bold text-gray-900">Configuration Required</h1>
        </div>

        <p className="text-gray-600 mb-4">
          This application requires configuration to connect to its backend services. Please contact your administrator or check the deployment configuration.
        </p>

        <div className="bg-gray-100 rounded-lg p-4 mb-4">
          <div className="flex items-center mb-2">
            <Settings className="w-4 h-4 text-gray-500 mr-2" />
            <span className="text-sm font-medium text-gray-700">Missing Environment Variables:</span>
          </div>
          <ul className="text-sm text-gray-600 space-y-1 ml-6">
            <li>• VITE_SUPABASE_URL</li>
            <li>• VITE_SUPABASE_ANON_KEY</li>
            <li>• VITE_OPENAI_API_KEY</li>
          </ul>
        </div>

        <div className="text-sm text-gray-500">
          <p className="mb-2">To fix this issue:</p>
          <ol className="list-decimal list-inside space-y-1">
            <li>Go to your deployment platform (Netlify/Vercel)</li>
            <li>Add the missing environment variables</li>
            <li>Trigger a new deployment</li>
          </ol>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-200">
          <a
            href="https://github.com/kkaufma72/dataflowhubai"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
          >
            View Repository
            <ExternalLink className="w-3 h-3 ml-1" />
          </a>
        </div>
      </div>
    </div>
  );
};

export default SupabaseConfigError;
