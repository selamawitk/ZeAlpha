import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ResetPassword = () => {
  const { resetPass } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setError('Invalid reset link');
    }
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    setError('');
    setMessage('');

    try {
      await resetPass(token, password);
      setMessage('Password reset successfully. Redirecting to login...');
      setTimeout(() => navigate('/auth'), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ivory px-4 py-16">
        <div className="max-w-md w-full rounded-[2rem] bg-white p-8 shadow-premium text-center">
          <h1 className="text-3xl font-semibold text-primary-dark mb-2">Invalid Link</h1>
          <p className="text-secondary">This password reset link is invalid or expired.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-ivory px-4 py-16">
      <div className="max-w-md w-full rounded-[2rem] bg-white p-8 shadow-premium">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-semibold text-primary-dark mb-2">Reset Password</h1>
          <p className="text-secondary">Enter your new password</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-secondary mb-2">New Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full rounded-2xl border border-gray-300 px-4 py-3 focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary mb-2">Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
              className="w-full rounded-2xl border border-gray-300 px-4 py-3 focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {error && <p className="text-red-600 text-sm">{error}</p>}
          {message && <p className="text-green-600 text-sm">{message}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary disabled:opacity-50"
          >
            {loading ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;