import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const ProtectedRoute = ({ role, children }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen grid place-items-center bg-ivory text-primary-dark">
        <div className="rounded-3xl bg-white p-8 shadow-premium">Checking access...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const roles = Array.isArray(role) ? role : [role];

  if (!roles.includes(user.role)) {
    if (user.role === 'admin') {
      return <Navigate to="/admin" replace />;
    }
    if (user.role === 'couple') {
      return <Navigate to="/dashboard" replace />;
    }
    return <Navigate to="/auth" replace />;
  }

  return children;
};

export default ProtectedRoute;
