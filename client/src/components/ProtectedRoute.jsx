import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const ProtectedRoute = ({ role, children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center bg-ivory text-primary-dark">
        <div className="rounded-3xl bg-white p-8 shadow-premium">Checking access...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (user.role !== role) {
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
