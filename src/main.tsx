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
import PremiumRoute from './components/auth/PremiumRoute.tsx';
import AppLayout from './components/layout/AppLayoutKoyfin.tsx'; // Dark Koyfin theme
import { Toaster } from 'react-hot-toast';
import { NotificationProvider } from './components/common/NotificationSystem.tsx';
import { TourProvider } from './components/common/TourProvider.tsx';
import { AIChatProvider } from './components/ai/GlobalAIAssistant.tsx';
import { DemoProvider } from './context/DemoContext.tsx';
import SupabaseConfigError from './components/common/SupabaseConfigError.tsx';
import { isSupabaseConfigured } from './lib/supabase.ts';
import { logStripeConfig } from './lib/stripeConfigCheck.ts';
import StripeConfigWarning from './components/common/StripeConfigWarning.tsx';

// Lazy load all pages for better code splitting and performance
const Documentation = lazy(() => import('./pages/Documentation.tsx'));
const Dashboard = lazy(() => import('./pages/DashboardKoyfin.tsx')); // Dark terminal-style dashboard
const DataManagement = lazy(() => import('./pages/DataManagementHybrid.tsx')); // Unified: Data catalog + browse + upload + quality
const DatasetInsights = lazy(() => import('./pages/DatasetInsights.tsx'));
const FeatureEngineering = lazy(() => import('./pages/FeatureEngineering.tsx'));
const ModelTraining = lazy(() => import('./pages/ModelTraining.tsx'));
const ModelEvaluation = lazy(() => import('./pages/ModelEvaluation.tsx'));
const Deployment = lazy(() => import('./pages/Deployment.tsx'));
const ModelMonitoring = lazy(() => import('./pages/ModelMonitoring.tsx'));
const SignIn = lazy(() => import('./pages/SignIn.tsx'));
const LandingPage = lazy(() => import('./pages/LandingPageLinear.tsx')); // Linear-style minimalist landing
const PricingPage = lazy(() => import('./pages/PricingPage.tsx'));
const SecurityPage = lazy(() => import('./pages/SecurityPage.tsx')); // Security & compliance
const PrivacyPage = lazy(() => import('./pages/PrivacyPage.tsx')); // Privacy policy
const CaseStudiesPage = lazy(() => import('./pages/CaseStudiesPage.tsx')); // Customer success stories
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
const AsyncMLOperations = lazy(() => import('./pages/AsyncMLOperations.tsx')); // Celery async operations
const MetricsDashboard = lazy(() => import('./pages/MetricsDashboard.tsx')); // Real-time InfluxDB metrics
const DatasetCleanup = lazy(() => import('./pages/DatasetCleanup.tsx')); // Dataset cleanup utility

// Loading fallback component for lazy loaded routes
function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-primary/5/20">
      <div className="text-center">
        <div className="relative">
          {/* Outer spinning circle */}
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-indigo-600"></div>
          
          {/* Inner pulsing circle */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-8 w-8 bg-primary-600/20 rounded-full animate-pulse"></div>
          </div>
        </div>
        
        <p className="mt-6 text-gray-600 font-medium">Loading amazing features...</p>
        <div className="mt-3 flex items-center justify-center gap-1">
          <div className="w-2 h-2 bg-primary-600 rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-primary-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
          <div className="w-2 h-2 bg-primary-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        </div>
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
          className="w-full bg-primary-600 text-white py-2 px-4 rounded hover:bg-primary-700 transition"
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

// Log Stripe configuration on app startup
if (import.meta.env.DEV) {
  logStripeConfig();
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
                            duration: 3500,
                            style: {
                              background: '#FFFFFF',
                              color: '#1F2937',
                              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                              borderRadius: '0.75rem',
                              padding: '1rem 1.25rem',
                              fontSize: '0.9375rem',
                              fontWeight: '500',
                              maxWidth: '420px',
                            },
                            success: {
                              iconTheme: {
                                primary: '#10B981',
                                secondary: '#FFFFFF',
                              },
                              duration: 3500,
                              style: {
                                border: '2px solid #10B981',
                              },
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
                        <StripeConfigWarning />
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
                            <Route path="/security" element={<SecurityPage />} />
                            <Route path="/privacy" element={<PrivacyPage />} />
                            <Route path="/case-studies" element={<CaseStudiesPage />} />
                            <Route path="/api-reference" element={<APIReference />} />
                            <Route path="/signin" element={<SignIn />} />
                            <Route path="/password-reset" element={<PasswordReset />} />
                            <Route path="/demo" element={<DemoPage />} />
                            <Route path="/product-tour" element={<ProductTourDemo />} />
                            <Route path="/signup-complete" element={<SignupComplete />} />

                            {/* Authenticated routes with layout */}
                            <Route path="/app" element={<PrivateRoute><AppLayout /></PrivateRoute>}>
                              <Route index element={<Dashboard />} />
                              <Route path="data" element={<DataManagement />} />
                              <Route path="insights" element={<DatasetInsights />} />
                              <Route path="dataset-overview" element={<DatasetInsights />} />
                              <Route path="visualizations" element={<DatasetInsights />} />
                              <Route path="feature-engineering" element={<FeatureEngineering />} />
                              <Route path="train" element={<ModelTraining />} />
                              <Route path="evaluate" element={<ModelEvaluation />} />
                              
                              {/* Premium Features - Require Pro/Team subscription */}
                              <Route path="deploy" element={<PremiumRoute requiredFeature="canDeploy"><Deployment /></PremiumRoute>} />
                              <Route path="monitoring" element={<PremiumRoute requiredFeature="canMonitor"><ModelMonitoring /></PremiumRoute>} />
                              <Route path="metrics" element={<PremiumRoute requiredFeature="canMonitor"><MetricsDashboard /></PremiumRoute>} />
                              <Route path="async-ml" element={<PremiumRoute requiredFeature="advancedAnalytics"><AsyncMLOperations /></PremiumRoute>} />
                              
                              {/* User Account & Settings */}
                              <Route path="profile" element={<UserProfile />} />
                              <Route path="settings" element={<AccountSettings />} />
                              <Route path="documentation" element={<Documentation />} />
                              <Route path="documentation/guides/:guideId" element={<UserGuideDetail />} />
                              <Route path="usage" element={<UsageDashboard />} />
                              <Route path="trash" element={<TrashBin />} />
                              <Route path="cleanup" element={<DatasetCleanup />} />
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

// Render the app
