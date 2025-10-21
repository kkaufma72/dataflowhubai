import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import App from './App.tsx';
import './index.css';
import { ErrorBoundary } from 'react-error-boundary';
import { AlertCircle } from 'lucide-react';
import Documentation from './pages/Documentation.tsx';
import Dashboard from './pages/Dashboard.tsx';
import DataManagement from './pages/DataManagement.tsx';
import FeatureEngineering from './pages/FeatureEngineering.tsx';
import ModelTraining from './pages/ModelTraining.tsx';
import ModelEvaluation from './pages/ModelEvaluation.tsx';
import Deployment from './pages/Deployment.tsx';
import ModelMonitoring from './pages/ModelMonitoring.tsx';
import Visualizations from './pages/Visualizations.tsx';
import PipelineBuilder from './pages/PipelineBuilder.tsx';
import DataPipelineDashboard from './pages/DataPipelineDashboard.tsx';
import SignIn from './pages/SignIn.tsx';
import { MLProvider } from './context/MLContext.tsx';
import { AuthProvider } from './components/auth/AuthProvider.tsx';
import { UserProvider } from './context/UserContext.tsx';
import PrivateRoute from './components/auth/PrivateRoute.tsx'; 
import AppLayout from './components/layout/AppLayout.tsx';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Toaster } from 'react-hot-toast';
import LandingPage from './pages/LandingPage.tsx';
import LandingLayout from './components/layout/LandingLayout.tsx';
import UserProfile from './pages/UserProfile.tsx';
import AccountSettings from './pages/AccountSettings.tsx';
import PasswordReset from './pages/PasswordReset.tsx';
import DataCenterInfrastructureReport from './pages/DataCenterInfrastructureReport.tsx';
import APIManagement from './components/api/APIManagement.tsx';
import APIReference from './pages/APIReference.tsx';
import { NotificationProvider } from './components/common/NotificationSystem.tsx';
import { TourProvider } from './components/common/TourProvider.tsx';
import AsyncWorkloadDashboard from './pages/AsyncWorkloadDashboard.tsx';
import UserGuideDetail from './pages/UserGuideDetail.tsx';
import APIDocumentation from './pages/APIDocumentation.tsx';
import { AIChatProvider } from './components/ai/GlobalAIAssistant.tsx'; // ADD THIS LINE

const Features = () => <div>Features Page</div>;

function GlobalErrorFallback({ error }: { error: Error }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
        <div className="flex items-center mb-4">
          <AlertCircle className="w-8 h-8 text-red-500 mr-3" />
          <h1 className="text-xl font-bold text-gray-900">Something went wrong</h1>
        </div>
        <p className="text-gray-600 mb-4">
          We're sorry, but something unexpected happened. Please try refreshing the page.
        </p>
        <details className="mb-4">
          <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
            Error details
          </summary>
          <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto">
            {error.message}
          </pre>
        </details>
        <button
          onClick={() => window.location.reload()}
          className="w-full bg-indigo-600 text-white py-2 px-4 rounded hover:bg-indigo-700 transition"
        >
          Reload Page
        </button>
      </div>
    </div>
  );
}

function logError(error: Error, info: { componentStack: string }) {
  console.error('Error caught by boundary:', error, info);
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary FallbackComponent={GlobalErrorFallback} onError={logError}>
      <Router>
        <AuthProvider>
          <UserProvider>
            <MLProvider>
              <AIChatProvider> {/* ADD THIS - wraps everything */}
                <NotificationProvider>
                  <TourProvider>
                    <DndProvider backend={HTML5Backend}>
                      <Toaster 
                        position="top-right" 
                        toastOptions={{
                          duration: 3000,
                          style: {
                            background: '#FFFFFF',
                            color: '#1F2937',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                            borderRadius: '0.375rem',
                            padding: '0.75rem 1rem',
                          },
                          success: {
                            iconTheme: {
                              primary: '#10B981',
                              secondary: '#FFFFFF',
                            },
                            duration: 3000,
                          },
                          error: {
                            iconTheme: {
                              primary: '#EF4444',
                              secondary: '#FFFFFF',
                            },
                            duration: 4000,
                          },
                        }}
                      />
                      <Routes>
                        {/* Landing page routes */}
                        <Route path="/" element={<LandingLayout />}>
                          <Route index element={<LandingPage />} />
                          <Route path="features" element={<Features />} />
                          <Route path="documentation" element={<Documentation />} />
                          <Route path="api-reference" element={<APIReference />} />
                        </Route>
                        
                        <Route path="/signin" element={<SignIn />} />
                        <Route path="/password-reset" element={<PasswordReset />} />
                        
                        {/* Authenticated routes with layout */}
                        <Route path="/app" element={<PrivateRoute><AppLayout /></PrivateRoute>}> 
                          <Route index element={<Dashboard />} />
                          <Route path="documentation" element={<Documentation />} />
                          <Route path="data" element={<DataManagement />} />
                          <Route path="feature-engineering" element={<FeatureEngineering />} />
                          <Route path="train" element={<ModelTraining />} />
                          <Route path="evaluate" element={<ModelEvaluation />} />
                          <Route path="deploy" element={<Deployment />} />
                          <Route path="monitoring" element={<ModelMonitoring />} />
                          <Route path="visualizations" element={<Visualizations />} />
                          <Route path="pipeline" element={<PipelineBuilder />} />
                          <Route path="profile" element={<UserProfile />} />
                          <Route path="settings" element={<AccountSettings />} />
                          <Route path="data-center-report" element={<DataCenterInfrastructureReport />} />
                          <Route path="api-management" element={<APIManagement />} />
                          <Route path="documentation/guides/:guideId" element={<UserGuideDetail />} />
                          <Route path="documentation/api" element={<APIDocumentation />} />
                        </Route>
                        
                        <Route path="/async-workloads" element={<PrivateRoute><AppLayout /></PrivateRoute>}>
                          <Route index element={<AsyncWorkloadDashboard />} />
                        </Route>
                        
                        <Route path="/pipeline/dashboard" element={<PrivateRoute><DataPipelineDashboard /></PrivateRoute>} />
                        <Route path="*" element={<Navigate to="/" replace />} />
                      </Routes>
                    </DndProvider>
                  </TourProvider>
                </NotificationProvider>
              </AIChatProvider> {/* CLOSE IT HERE */}
            </MLProvider>
          </UserProvider>
        </AuthProvider>
      </Router>
    </ErrorBoundary>
  </React.StrictMode>
);