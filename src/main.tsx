import React, { Suspense, lazy } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './index.css';
import { ErrorBoundary } from 'react-error-boundary';
import { AlertCircle } from 'lucide-react';
import { MLProvider } from './context/MLContext.tsx';
import { AuthProvider } from './components/auth/AuthProvider.tsx';
import { UserProvider } from './context/UserContext.tsx';
import PrivateRoute from './components/auth/PrivateRoute.tsx';
import AppLayout from './components/layout/AppLayout.tsx';
import { Toaster } from 'react-hot-toast';
import { NotificationProvider } from './components/common/NotificationSystem.tsx';
import { TourProvider } from './components/common/TourProvider.tsx';
import { AIChatProvider } from './components/ai/GlobalAIAssistant.tsx';
import { DemoProvider } from './context/DemoContext.tsx';

// Lazy load all pages for better code splitting and performance
const Documentation = lazy(() => import('./pages/Documentation.tsx'));
const Dashboard = lazy(() => import('./pages/Dashboard.tsx'));
const DataManagement = lazy(() => import('./pages/DataManagement.tsx'));
const FeatureEngineering = lazy(() => import('./pages/FeatureEngineering.tsx'));
const ModelTraining = lazy(() => import('./pages/ModelTraining.tsx'));
const ModelEvaluation = lazy(() => import('./pages/ModelEvaluation.tsx'));
const Deployment = lazy(() => import('./pages/Deployment.tsx'));
const ModelMonitoring = lazy(() => import('./pages/ModelMonitoring.tsx'));
const Visualizations = lazy(() => import('./pages/Visualizations.tsx'));
const PipelineBuilder = lazy(() => import('./pages/PipelineBuilder.tsx'));
const DataPipelineDashboard = lazy(() => import('./pages/DataPipelineDashboard.tsx'));
const SignIn = lazy(() => import('./pages/SignIn.tsx'));
const LandingPage = lazy(() => import('./pages/LandingPage.tsx'));
const PricingPage = lazy(() => import('./pages/PricingPage.tsx'));
const UserProfile = lazy(() => import('./pages/UserProfile.tsx'));
const AccountSettings = lazy(() => import('./pages/AccountSettings.tsx'));
const PasswordReset = lazy(() => import('./pages/PasswordReset.tsx'));
const DataCenterInfrastructureReport = lazy(() => import('./pages/DataCenterInfrastructureReport.tsx'));
const APIManagement = lazy(() => import('./components/api/APIManagement.tsx'));
const APIReference = lazy(() => import('./pages/APIReference.tsx'));
const AsyncWorkloadDashboard = lazy(() => import('./pages/AsyncWorkloadDashboard.tsx'));
const UserGuideDetail = lazy(() => import('./pages/UserGuideDetail.tsx'));
const APIDocumentation = lazy(() => import('./pages/APIDocumentation.tsx'));
const UsageDashboard = lazy(() => import('./pages/UsageDashboard.tsx'));
const DemoPage = lazy(() => import('./pages/DemoPage.tsx'));
const TrashBin = lazy(() => import('./pages/TrashBin.tsx'));
const SignupComplete = lazy(() => import('./pages/SignupComplete.tsx'));

// Loading fallback component for lazy loaded routes
function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        <p className="mt-4 text-gray-600">Loading...</p>
      </div>
    </div>
  );
}

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
              <DemoProvider>
                <AIChatProvider>
                  <NotificationProvider>
                    <TourProvider>
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
                      <Suspense fallback={<LoadingFallback />}>
                        <Routes>
                          {/* Landing page and other public routes */}
                          <Route path="/" element={<LandingPage />} />
                          <Route path="/dashboard" element={<Navigate to="/app" replace />} />
                          <Route path="/features" element={<div>Features Page</div>} />
                          <Route path="/pricing" element={<PricingPage />} />
                          <Route path="/documentation" element={<Documentation />} />
                          <Route path="/api-reference" element={<APIReference />} />
                          <Route path="/signin" element={<SignIn />} />
                          <Route path="/password-reset" element={<PasswordReset />} />
                          <Route path="/demo" element={<DemoPage />} />
                          <Route path="/signup-complete" element={<SignupComplete />} />

                          {/* Authenticated routes with layout */}
                          <Route path="/app" element={<PrivateRoute><AppLayout /></PrivateRoute>}>
                            <Route index element={<Dashboard />} />
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
                            <Route path="documentation" element={<Documentation />} />
                            <Route path="data-center-report" element={<DataCenterInfrastructureReport />} />
                            <Route path="api-management" element={<APIManagement />} />
                            <Route path="documentation/guides/:guideId" element={<UserGuideDetail />} />
                            <Route path="documentation/api" element={<APIDocumentation />} />
                            <Route path="usage" element={<UsageDashboard />} />
                            <Route path="trash" element={<TrashBin />} />
                          </Route>

                          <Route path="/async-workloads" element={<PrivateRoute><AppLayout /></PrivateRoute>}>
                            <Route index element={<AsyncWorkloadDashboard />} />
                          </Route>

                          <Route path="/pipeline/dashboard" element={<PrivateRoute><DataPipelineDashboard /></PrivateRoute>} />
                          <Route path="*" element={<Navigate to="/" replace />} />
                        </Routes>
                      </Suspense>
                    </TourProvider>
                  </NotificationProvider>
                </AIChatProvider>
              </DemoProvider>
            </MLProvider>
          </UserProvider>
        </AuthProvider>
      </Router>
    </ErrorBoundary>
  </React.StrictMode>
);