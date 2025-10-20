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
import AIChat from './pages/AIChat.tsx';

function ErrorFallback({ error, resetErrorBoundary }: any) {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="max-w-md p-8 bg-white rounded-lg shadow-lg">
        <div className="flex items-center mb-4">
          <AlertCircle className="w-8 h-8 mr-3 text-red-600" />
          <h1 className="text-xl font-bold text-gray-900">Something went wrong</h1>
        </div>
        <p className="mb-4 text-gray-600">{error.message}</p>
        <button
          onClick={resetErrorBoundary}
          className="w-full px-4 py-2 font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
        >
          Try again
        </button>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <Router>
        <AuthProvider>
          <UserProvider>
            <MLProvider>
              <NotificationProvider>
                <TourProvider>
                  <DndProvider backend={HTML5Backend}>
                    <Toaster position="top-right" />
                    <Routes>
                      <Route path="/" element={<LandingLayout />}>
                        <Route index element={<LandingPage />} />
                        <Route path="documentation" element={<Documentation />} />
                        <Route path="api-reference" element={<APIReference />} />
                      </Route>
                      
                      <Route path="/signin" element={<SignIn />} />
                      <Route path="/reset-password" element={<PasswordReset />} />
                      
                      <Route path="/app" element={<PrivateRoute><AppLayout /></PrivateRoute>}>
                        <Route index element={<Dashboard />} />
                        <Route path="ai-chat" element={<AIChat />} />
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
            </MLProvider>
          </UserProvider>
        </AuthProvider>
      </Router>
    </ErrorBoundary>
  </React.StrictMode>
);