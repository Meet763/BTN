import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getHomeRouteForRole } from '../utils/roleHome';

export const HomeRedirect = () => {
  const { user, isAuthenticated } = useAuth();
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }
  return <Navigate to={getHomeRouteForRole(user.role)} replace />;
};
