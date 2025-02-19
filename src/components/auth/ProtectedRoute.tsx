import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export const ProtectedRoute = ({ children, requireAdmin = false }: ProtectedRouteProps) => {
  const { user } = useAuth();

  console.log('Protected Route Check:', {
    user,
    requireAdmin,
    isAdmin: user?.isAdmin,
    hasAccess: !requireAdmin || user?.isAdmin
  });

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Check for admin access if required
  if (requireAdmin && !user.isAdmin) {
    console.log('Admin access denied, redirecting to dashboard');
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};