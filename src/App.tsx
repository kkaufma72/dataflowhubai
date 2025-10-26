import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './components/auth/AuthProvider';

function App() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Don't redirect if still loading or if already on /app
    if (loading || location.pathname === '/app' || location.pathname.startsWith('/app/')) {
      return;
    }

    // If user is authenticated, redirect to app dashboard
    if (user) {
      console.log('App: User authenticated, redirecting to /app');
      navigate('/app', { replace: true });
    }
  }, [user, loading, navigate, location.pathname]);

  // The App component now just redirects to the landing page
  // The actual landing page content is in LandingPage.tsx
  return null;
}

export default App;