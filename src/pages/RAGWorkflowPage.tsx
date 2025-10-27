// RAG Workflow Page - Showcases the complete RAG implementation
// This page demonstrates all RAG features integrated with DataFlowHub AI

import React from 'react';
import { useAuth } from '../components/auth/AuthProvider';
import RAGWorkflowDemo from '../components/workflows/RAGWorkflowDemo';

export const RAGWorkflowPage: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <nav className="flex" aria-label="Breadcrumb">
                <ol className="inline-flex items-center space-x-1 md:space-x-3">
                  <li className="inline-flex items-center">
                    <a href="/" className="inline-flex items-center text-sm font-medium text-gray-700 hover:text-blue-600">
                      Home
                    </a>
                  </li>
                  <li>
                    <div className="flex items-center">
                      <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 111.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                      <span className="ml-1 text-sm font-medium text-gray-500 md:ml-2">RAG Workflow</span>
                    </div>
                  </li>
                </ol>
              </nav>
            </div>
            {user && (
              <div className="text-sm text-gray-600">
                Welcome back, {user.email}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <RAGWorkflowDemo />
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-sm text-gray-600">
            <p>RAG (Retrieval-Augmented Generation) Workflow Demo</p>
            <p className="mt-1">Part of DataFlowHub AI - Your Enterprise AutoML Platform</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default RAGWorkflowPage;
