import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const WelcomeSplash = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/dashboard');
    }, 2500);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-yellow-400 via-yellow-500 to-gray-800">
      <div className="text-center text-white">
        <h1 className="mb-6 text-4xl font-serif leading-tight">
          Welcome to your Forever, {user?.name || 'User'}.
        </h1>
        <p className="text-xl opacity-90">
          ZeAlpha is preparing your registry...
        </p>
        <div className="mt-8">
          <div className="mx-auto h-2 w-32 rounded-full bg-white/30">
            <div className="h-2 w-1/2 animate-pulse rounded-full bg-white"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WelcomeSplash;