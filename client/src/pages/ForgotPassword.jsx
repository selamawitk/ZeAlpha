import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const goldGradient = 'bg-gradient-to-r from-[#B8860B] via-[#A0700A] to-[#8B5A00]';

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
      setError(err.response?.data?.message || err.message || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-[#f7f2ea] via-[#f9f5ef] to-[#eadfce] px-4 py-16">

      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-[#d4af37]/10 blur-3xl"></div>
        <div className="absolute bottom-0 right-0 h-72 w-72 rounded-full bg-[#c49b52]/10 blur-3xl"></div>
      </div>

      <div className="relative z-10 w-full max-w-[420px] rounded-[28px] border border-[#dec8ab] bg-gradient-to-br from-[#f5ecde]/95 via-[#ead9c0]/92 to-[#d8b78f]/90 p-7 shadow-[0_16px_40px_rgba(90,60,20,0.12)] backdrop-blur-xl">
        <div className="text-center mb-6">
          <h1 className="text-[28px] font-black tracking-tight text-[#2d2218]">Forgot Password</h1>
          <div className={`mx-auto mt-3 h-1 w-14 rounded-full ${goldGradient}`}></div>
          <p className="mt-3 text-sm text-[#6f6257]">Enter your email to receive a reset link</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="your@email.com"
            className="w-full rounded-2xl border border-[#e5d7c4] bg-white/55 px-4 py-3 text-sm outline-none transition-all focus:border-[#B8860B] focus:ring-4 focus:ring-[#B8860B]/10"
          />

          {error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
          )}
          {message && (
            <div className="rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{message}</div>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`w-full rounded-2xl ${goldGradient} px-5 py-3 text-sm font-black text-white shadow-lg shadow-[#8B5A00]/20 transition-all duration-300 hover:brightness-110 hover:shadow-xl disabled:opacity-60`}
          >
            {loading ? 'Sending...' : 'Send Reset Email'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link to="/auth" className="text-sm font-semibold text-[#8B5A00] transition hover:text-[#5f3d00]">
            Back to Login
          </Link>
          <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.22em] text-[#8c755e]">
            ZeAlpha Studio &copy; 2026
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
