import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

/**
 * Wraps admin-only routes. Redirects unauthenticated visitors to sign in,
 * and non-admin teachers back to the dashboard.
 * This is a UX convenience only — every admin endpoint enforces the check
 * again server-side via requireAdmin(), which is the real access control.
 */
export default function AdminRoute({ children }) {
    const { isAuthenticated, teacher } = useAuth();
    const location = useLocation();

    if (!isAuthenticated) {
        return <Navigate to="/teacher/login" state={{ from: location }} replace />;
    }
    if (!teacher?.isAdmin) {
        return <Navigate to="/teacher" replace />;
    }

    return children;
}
