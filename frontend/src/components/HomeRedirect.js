import { jsx as _jsx } from "react/jsx-runtime";
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getHomeRouteForRole } from '../utils/roleHome';
export const HomeRedirect = () => {
    const { user, isAuthenticated } = useAuth();
    if (!isAuthenticated || !user) {
        return _jsx(Navigate, { to: "/login", replace: true });
    }
    return _jsx(Navigate, { to: getHomeRouteForRole(user.role), replace: true });
};
