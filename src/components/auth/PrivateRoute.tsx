import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthProvider';
import { Loader2 } from 'lucide-react';

interface PrivateRouteProps {
  children: React.ReactNode;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  console.log('PrivateRoute - User:', !!user, 'Loading:', loading, 'Path:', location.pathname);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  if (!user) {
    console.log('No user found, redirecting to sign in');
    return <Navigate to="/signin" state={{ from: location.pathname }} replace />;
  }

  console.log('User authenticated, rendering children');
  return <>{children}</>;
};

export default PrivateRoute;