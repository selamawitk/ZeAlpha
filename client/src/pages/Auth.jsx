import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import authImage from '../assets/images/auth wedding page.png';

const Auth = () => {
  const [mode, setMode] = useState('login');
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (mode === 'login') {
        await login(form.email, form.password);
        navigate('/welcome');
      } else {
        await register(
          form.firstName,
          form.lastName,
          form.email,
          form.password
        );
        setSuccess('Welcome to ZeAlpha!');
        setTimeout(() => navigate('/welcome'), 1500);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const btnGradient = "bg-gradient-to-r from-[#d4af37] via-[#9a793b] to-[#815e08]";

  return (
    <div className="relative h-screen w-full flex items-center justify-center bg-gradient-to-br from-[#fdfcfb] via-white to-[#f3f1ec] px-6 overflow-hidden">
      
      <div className="absolute w-[600px] h-[600px] bg-rose-100/20 blur-[120px] rounded-full -top-32 -left-32 animate-pulse pointer-events-none"></div>
      <div className="absolute w-[600px] h-[600px] bg-amber-50/30 blur-[120px] rounded-full -bottom-32 -right-32 pointer-events-none"></div>

      <div className="relative w-full max-w-6xl flex flex-col md:flex-row items-center justify-between gap-8">

        <div className="hidden md:flex w-1/2 justify-center animate-fadeUp">
          <div className="relative w-full max-w-[480px] h-[520px] rounded-3xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.15)] group border border-white/20">
            <img
              src={authImage}
              alt="Auth Visual"
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
          </div>
        </div>

        <div className="w-full md:w-1/2 flex justify-center animate-fadeUp delay-200">
          <div className="relative w-full max-w-md rounded-[2.5rem] bg-white/70 backdrop-blur-2xl p-8 md:p-10 shadow-[0_30px_60px_rgba(0,0,0,0.12)] border border-white/50">

            <div className="mb-6 md:mb-10 text-center">
              <h2 className="font-serif text-3xl md:text-4xl font-bold tracking-tight text-[#1f1f1f]">
                {mode === 'login' ? 'Welcome Back' : 'Join ZeAlpha'}
              </h2>
              <div className={`mt-3 mx-auto w-12 h-1 ${btnGradient} rounded-full`}></div>
              <p className="mt-4 text-sm md:text-base text-gray-500 font-medium">
                {mode === 'login'
                  ? 'Access your curated registry'
                  : 'Start your journey with us'}
              </p>
            </div>

            <div className="mb-8 flex rounded-full bg-gray-100/50 p-1.5 border border-gray-200/50">
              <button
                type="button"
                onClick={() => setMode('login')}
                className={`flex-1 rounded-full py-2.5 text-sm font-bold transition-all duration-500 ${
                  mode === 'login'
                    ? `${btnGradient} text-white shadow-lg scale-[1.02]`
                    : 'text-gray-500 hover:text-[#9a793b]'
                }`}
              >
                Login
              </button>

              <button
                type="button"
                onClick={() => setMode('signup')}
                className={`flex-1 rounded-full py-2.5 text-sm font-bold transition-all duration-500 ${
                  mode === 'signup'
                    ? `${btnGradient} text-white shadow-lg scale-[1.02]`
                    : 'text-gray-500 hover:text-[#9a793b]'
                }`}
              >
                Signup
              </button>
            </div>

            {error && (
              <div className="mb-6 rounded-2xl bg-red-50 p-4 text-sm text-red-600 border border-red-100">
                {error}
              </div>
            )}

            {success && (
              <div className="mb-6 rounded-2xl bg-green-50 p-4 text-sm text-green-600 border border-green-100">
                {success}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'signup' && (
                <div className="grid grid-cols-2 gap-4">
                  <input
                    placeholder="First Name"
                    value={form.firstName}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, firstName: e.target.value }))
                    }
                    className="w-full rounded-2xl border border-gray-100 bg-gray-50/50 px-5 py-3.5 outline-none focus:ring-2 focus:ring-[#d4af37]/30 focus:bg-white transition-all"
                  />
                  <input
                    placeholder="Last Name"
                    value={form.lastName}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, lastName: e.target.value }))
                    }
                    className="w-full rounded-2xl border border-gray-100 bg-gray-50/50 px-5 py-3.5 outline-none focus:ring-2 focus:ring-[#d4af37]/30 focus:bg-white transition-all"
                  />
                </div>
              )}

              <input
                placeholder="Email Address"
                type="email"
                value={form.email}
                onChange={(e) =>
                  setForm((p) => ({ ...p, email: e.target.value }))
                }
                className="w-full rounded-2xl border border-gray-100 bg-gray-50/50 px-5 py-3.5 outline-none focus:ring-2 focus:ring-[#d4af37]/30 focus:bg-white transition-all"
              />

              <input
                placeholder="Password"
                type="password"
                value={form.password}
                onChange={(e) =>
                  setForm((p) => ({ ...p, password: e.target.value }))
                }
                className="w-full rounded-2xl border border-gray-100 bg-gray-50/50 px-5 py-3.5 outline-none focus:ring-2 focus:ring-[#d4af37]/30 focus:bg-white transition-all"
              />

              <button
                type="submit"
                disabled={loading}
                className={`group relative w-full overflow-hidden rounded-2xl ${btnGradient} py-4.5 font-bold text-white shadow-xl transition-all duration-300 hover:shadow-[#9a793b]/40 hover:scale-[1.02] active:scale-95 disabled:opacity-50 mt-2`}
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {loading ? (
                    <span className="flex gap-1">
                      <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce"></span>
                      <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce delay-100"></span>
                      <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce delay-200"></span>
                    </span>
                  ) : (
                    mode === 'login' ? 'Sign In to Account' : 'Create My Registry'
                  )}
                </span>
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
              </button>
            </form>

            <div className="mt-8 text-center">
              <p className="text-[10px] uppercase tracking-[0.2em] text-gray-400 font-semibold">
                ZeAlpha Studio &copy; 2026
              </p>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};

export default Auth;