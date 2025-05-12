import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
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
import Sidebar from './components/layout/Sidebar.tsx';
import Navbar from './components/layout/Navbar.tsx';
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

// Global error handler for uncaught errors
const GlobalErrorFallback = ({ error, resetErrorBoundary }: { error: Error, resetErrorBoundary: () => void }) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white p-6 rounded-lg shadow-md max-w-md w-full">
        <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full">
          <AlertCircle className="w-6 h-6 text-red-600" />
        </div>
        <h2 className="mb-4 text-xl font-semibold text-center text-gray-900">Something went wrong</h2>
        <div className="p-3 mb-4 overflow-auto text-sm bg-red-50 rounded-md text-red-600 max-h-32">
          {error.message}
        </div>
        <p className="mb-4 text-sm text-gray-600">
          We apologize for the inconvenience. Please try refreshing the page or contact support if the problem persists.
        </p>
        <div className="flex justify-center">
          <button
            onClick={resetErrorBoundary}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Try Again
          </button>
        </div>
      </div>
    </div>
  );
};

// Log errors to console in development
const logError = (error: Error, info: { componentStack: string }) => {
  console.error('Uncaught error:', error);
  console.error('Component stack:', info.componentStack);
};

// Layout component for authenticated routes
const AppLayout = () => {
  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-y-auto p-6 dark:bg-gray-800 dark:text-gray-100">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary FallbackComponent={GlobalErrorFallback} onError={logError}>
      <Router>
        <AuthProvider>
          <UserProvider>
            <MLProvider>
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
            </MLProvider>
          </UserProvider>
        </AuthProvider>
      </Router>
    </ErrorBoundary>
  </React.StrictMode>
);