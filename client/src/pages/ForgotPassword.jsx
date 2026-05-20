import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ForgotPassword = () => {
  const { forgotPass } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      await forgotPass(email);
      setMessage('Password reset email sent. Check your inbox.');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-ivory px-4 py-16">
      <div className="max-w-md w-full rounded-[2rem] bg-white p-8 shadow-premium">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-semibold text-primary-dark mb-2">Forgot Password</h1>
          <p className="text-secondary">Enter your email to reset your password</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-secondary mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-2xl border border-gray-300 px-4 py-3 focus:border-primary focus:ring-2 focus:ring-primary/20"
              placeholder="your@email.com"
            />
          </div>

          {error && <p className="text-red-600 text-sm">{error}</p>}
          {message && <p className="text-green-600 text-sm">{message}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary disabled:opacity-50"
          >
            {loading ? 'Sending...' : 'Send Reset Email'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link to="/auth" className="text-primary hover:text-primary-dark text-sm">
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;