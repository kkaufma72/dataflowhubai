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
import { Toaster } from 'react-hot-toast';
import { NotificationProvider } from './components/common/NotificationSystem.tsx';
import { TourProvider } from './components/common/TourProvider.tsx';
import { AIChatProvider } from './components/ai/GlobalAIAssistant.tsx';
import { DemoProvider } from './context/DemoContext.tsx';
import SupabaseConfigError from './components/common/SupabaseConfigError.tsx';
import { isSupabaseConfigured } from './lib/supabase.ts';
import { AppShell } from './app/layout/AppShell.tsx';

// Lazy load all pages for better code splitting and performance
const Documentation = lazy(() => import('./pages/Documentation.tsx'));
const TalkToYourData = lazy(() => import('./pages/TalkToYourData.tsx'));
const Dashboard = lazy(() => import('./pages/DashboardKoyfin.tsx')); // Koyfin-style terminal dashboard
const DataManagement = lazy(() => import('./pages/DataManagementHybrid.tsx')); // Hybrid: Excel tabs + Quality cards + AI helper
const DatasetInsights = lazy(() => import('./pages/DatasetInsights.tsx'));
const FeatureEngineering = lazy(() => import('./pages/FeatureEngineering.tsx'));
const ModelTraining = lazy(() => import('./pages/ModelTraining.tsx'));
const ModelEvaluation = lazy(() => import('./pages/ModelEvaluation.tsx'));
const Deployment = lazy(() => import('./pages/Deployment.tsx'));
const ModelMonitoring = lazy(() => import('./pages/ModelMonitoring.tsx'));
const SignIn = lazy(() => import('./pages/SignIn.tsx'));
const LandingPage = lazy(() => import('./pages/LandingPageLinear.tsx')); // Linear-style minimalist landing
const PricingPage = lazy(() => import('./pages/PricingPage.tsx'));
const UserProfile = lazy(() => import('./pages/UserProfile.tsx'));
const AccountSettings = lazy(() => import('./pages/AccountSettings.tsx'));
const PasswordReset = lazy(() => import('./pages/PasswordReset.tsx'));
const APIReference = lazy(() => import('./pages/APIReference.tsx'));
const UserGuideDetail = lazy(() => import('./pages/UserGuideDetail.tsx'));
const UsageDashboard = lazy(() => import('./pages/UsageDashboard.tsx'));
const DemoPage = lazy(() => import('./pages/DemoPage.tsx'));
const ProductTourDemo = lazy(() => import('./pages/ProductTourDemo.tsx'));
const TrashBin = lazy(() => import('./pages/TrashBin.tsx'));
const SignupComplete = lazy(() => import('./pages/SignupComplete.tsx'));
const OAuthCallback = lazy(() => import('./components/auth/OAuthCallback.tsx'));
const ProjectsOverview = lazy(() => import('./app/pages/projects/ProjectsOverview.tsx'));
const PipelineWorkspace = lazy(() => import('./app/pages/pipelines/PipelineWorkspace.tsx'));
const DeploymentsOverview = lazy(() => import('./app/pages/deployments/DeploymentsOverview.tsx'));
const MonitoringOverview = lazy(() => import('./app/pages/monitoring/MonitoringOverview.tsx'));
const AutomationHub = lazy(() => import('./app/pages/automations/AutomationHub.tsx'));
const CopilotWorkspace = lazy(() => import('./app/pages/copilot/CopilotWorkspace.tsx'));

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

function logError(error: Error, info: any) {
  console.error('Error caught by boundary:', error, info);
}

// Check if Supabase is configured before rendering the full app
if (!isSupabaseConfigured) {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <SupabaseConfigError />
    </React.StrictMode>
  );
} else {
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
                            {/* OAuth callback handler - must be before /app route */}
                            <Route path="/app/auth/callback" element={<OAuthCallback />} />

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
                            <Route path="/product-tour" element={<ProductTourDemo />} />
                            <Route path="/signup-complete" element={<SignupComplete />} />

                              {/* Authenticated routes with layout */}
                              <Route path="/app" element={<PrivateRoute><AppShell /></PrivateRoute>}>
                                <Route index element={<Dashboard />} />
                                <Route path="projects" element={<ProjectsOverview />} />
                                <Route path="pipelines" element={<PipelineWorkspace />} />
                                <Route path="deployments" element={<DeploymentsOverview />} />
                                <Route path="monitoring" element={<MonitoringOverview />} />
                                <Route path="automations" element={<AutomationHub />} />
                                <Route path="copilot" element={<CopilotWorkspace />} />
                                <Route path="data" element={<DataManagement />} />
                                <Route path="talk-to-data" element={<TalkToYourData />} />
                                <Route path="insights" element={<DatasetInsights />} />
                                <Route path="dataset-overview" element={<DatasetInsights />} />
                                <Route path="visualizations" element={<DatasetInsights />} />
                                <Route path="feature-engineering" element={<FeatureEngineering />} />
                                <Route path="train" element={<ModelTraining />} />
                                <Route path="evaluate" element={<ModelEvaluation />} />
                                <Route path="deploy" element={<Deployment />} />
                                <Route path="monitoring/legacy" element={<ModelMonitoring />} />
                                <Route path="profile" element={<UserProfile />} />
                                <Route path="settings" element={<AccountSettings />} />
                                <Route path="documentation" element={<Documentation />} />
                                <Route path="documentation/guides/:guideId" element={<UserGuideDetail />} />
                                <Route path="usage" element={<UsageDashboard />} />
                                <Route path="trash" element={<TrashBin />} />
                              </Route>

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
}

console.log('🚀 LOCAL DEV SERVER - Build timestamp:', new Date().toISOString());
console.log('🔧 FIXED VERSION - All agent errors resolved!');
