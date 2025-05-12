import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './components/auth/AuthProvider';

function App() {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // If user is authenticated, redirect to app dashboard
    if (user) {
      navigate('/app', { replace: true });
    }
  }, [user, navigate]);

  // The App component now just redirects to the landing page
  // The actual landing page content is in LandingPage.tsx
  return null;
}

export default App;