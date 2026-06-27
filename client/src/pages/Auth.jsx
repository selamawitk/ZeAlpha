import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Heart, Gift } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import authImage from '../assets/images/auth wedding page.png';

const goldGradient = 'bg-gradient-to-r from-[#B8860B] via-[#A0700A] to-[#8B5A00]';

const RoleCard = ({ label, description, selected, onSelect, icon }) => (
  <button
    type="button"
    onClick={onSelect}
    className={`flex flex-1 flex-col items-center gap-1.5 rounded-2xl border-2 p-3.5 transition-all duration-200 ${
      selected
        ? 'border-[#B8860B] bg-[#B8860B]/10 shadow-md'
        : 'border-[#e5d7c4] bg-white/40 hover:border-[#d4a843]/50'
    }`}
  >
    <span className="text-[#8B5A00]">{icon}</span>
    <span className={`text-sm font-bold ${selected ? 'text-[#8B5A00]' : 'text-[#6f6257]'}`}>{label}</span>
    <span className="text-[10px] text-[#8c755e] leading-tight">{description}</span>
  </button>
);

const Auth = () => {
  const [mode, setMode] = useState('login');
  const [role, setRole] = useState('couple');
  const [loginStep, setLoginStep] = useState('role');
  const [loginRole, setLoginRole] = useState('couple');
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
        const userData = await login(form.email, form.password);

        if (userData.role === 'admin') {
          navigate('/admin');
        } else if (userData.role === 'couple') {
          navigate('/dashboard');
        } else {
          navigate('/guest');
        }
      } else {
        const newUser = await register(
          form.firstName,
          form.lastName,
          form.email,
          form.password,
          role
        );

        setSuccess('Welcome to ZeAlpha!');

        setTimeout(() => {
          if (newUser.role === 'admin') {
            navigate('/admin');
          } else if (newUser.role === 'couple') {
            navigate('/dashboard');
          } else {
            navigate('/guest');
          }
        }, 1200);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (newMode) => {
    setMode(newMode);
    setError('');
    setSuccess('');
    setLoginStep('role');
    setForm({ firstName: '', lastName: '', email: '', password: '' });
  };

  const handleLoginRoleSelect = (selectedRole) => {
    setLoginRole(selectedRole);
    setLoginStep('form');
  };

  const handleBack = () => {
    setLoginStep('role');
    setError('');
  };

  const getHeading = () => {
    if (mode === 'signup') return 'Create Account';
    if (loginStep === 'role') return 'Welcome Back';
    return loginRole === 'couple' ? 'Couple Login' : 'Guest Login';
  };

  const getSubtitle = () => {
    if (mode === 'signup') return 'Start your luxury registry journey';
    if (loginStep === 'role') return "Choose how you'd like to continue";
    return loginRole === 'couple'
      ? 'Access your couple dashboard'
      : 'Browse and contribute to weddings';
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-[#f7f2ea] via-[#f9f5ef] to-[#eadfce] px-6 py-6">

      {/* Background Glow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-[#d4af37]/10 blur-3xl"></div>
        <div className="absolute bottom-0 right-0 h-72 w-72 rounded-full bg-[#c49b52]/10 blur-3xl"></div>
      </div>

      {/* Main Wrapper */}
      <div className="relative z-10 flex w-full max-w-[1180px] flex-col items-center justify-center gap-[80px] lg:flex-row lg:items-center">

        {/* Image Section */}
        <div className="hidden lg:flex lg:w-[48%]">
          <div className="relative h-[540px] w-full overflow-hidden rounded-[30px] border border-[#e4d5c1] bg-white/40 shadow-[0_14px_40px_rgba(120,90,40,0.14)] backdrop-blur-xl">

            <img
              src={authImage}
              alt="Wedding"
              className="h-full w-full object-cover"
            />

            <div className="absolute inset-0 bg-gradient-to-t from-[#2f1f12]/10 via-transparent to-transparent"></div>
          </div>
        </div>

        {/* Auth Card */}
        <div className="flex w-full items-center justify-center lg:w-[38%]">
          <div className="w-full max-w-[400px] rounded-[28px] border border-[#dec8ab] bg-gradient-to-br from-[#f5ecde]/95 via-[#ead9c0]/92 to-[#d8b78f]/90 p-5 shadow-[0_16px_40px_rgba(90,60,20,0.12)] backdrop-blur-xl">

            {/* Header */}
            <div className="mb-5 text-center">
              <h1 className="text-[30px] font-black tracking-tight text-[#2d2218]">
                {getHeading()}
              </h1>

              <div className={`mx-auto mt-3 h-1 w-14 rounded-full ${goldGradient}`}></div>

              <p className="mt-3 text-sm text-[#6f6257]">
                {getSubtitle()}
              </p>
            </div>

            {/* Toggle */}
            <div className="mb-5 flex rounded-full border border-[#dbc4a4] bg-white/40 p-1.5">
              <button
                type="button"
                onClick={() => switchMode('login')}
                className={`flex-1 rounded-full py-2.5 text-sm font-black transition-all duration-300 ${
                  mode === 'login'
                    ? `${goldGradient} text-white shadow-md`
                    : 'text-[#6f6257] hover:text-[#8B5A00]'
                }`}
              >
                Login
              </button>

              <button
                type="button"
                onClick={() => switchMode('signup')}
                className={`flex-1 rounded-full py-2.5 text-sm font-black transition-all duration-300 ${
                  mode === 'signup'
                    ? `${goldGradient} text-white shadow-md`
                    : 'text-[#6f6257] hover:text-[#8B5A00]'
                }`}
              >
                Signup
              </button>
            </div>

            {/* Error */}
            {error && (
              <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            )}

            {/* Success */}
            {success && (
              <div className="mb-4 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                {success}
              </div>
            )}

            {/* Login - Role Selection */}
            {mode === 'login' && loginStep === 'role' && (
              <div className="mb-4">
                <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-[#8c755e]">Continue as...</label>
                <div className="flex gap-3">
                  <RoleCard
                    icon={<Heart className="h-6 w-6" />}
                    label="Couple"
                    description="Plan your wedding registry"
                    selected={loginRole === 'couple'}
                    onSelect={() => handleLoginRoleSelect('couple')}
                  />
                  <RoleCard
                    icon={<Gift className="h-6 w-6" />}
                    label="Guest"
                    description="Find and contribute to weddings"
                    selected={loginRole === 'guest'}
                    onSelect={() => handleLoginRoleSelect('guest')}
                  />
                </div>
              </div>
            )}

            {/* Login Form / Signup Form */}
            {(mode === 'login' && loginStep === 'form') || mode === 'signup' ? (
              <form onSubmit={handleSubmit} className="space-y-3.5">
                {mode === 'signup' && (
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="First Name"
                      value={form.firstName}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, firstName: e.target.value }))
                      }
                      required
                      className="rounded-2xl border border-[#e5d7c4] bg-white/55 px-4 py-3 text-sm outline-none transition-all focus:border-[#B8860B] focus:ring-4 focus:ring-[#B8860B]/10"
                    />

                    <input
                      type="text"
                      placeholder="Last Name"
                      value={form.lastName}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, lastName: e.target.value }))
                      }
                      required
                      className="rounded-2xl border border-[#e5d7c4] bg-white/55 px-4 py-3 text-sm outline-none transition-all focus:border-[#B8860B] focus:ring-4 focus:ring-[#B8860B]/10"
                    />
                  </div>
                )}

                {mode === 'signup' && (
                  <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-[#8c755e]">I am a...</label>
                    <div className="flex gap-3">
                      <RoleCard
                        icon={<Heart className="h-6 w-6" />}
                        label="Couple"
                        description="Plan your wedding registry"
                        selected={role === 'couple'}
                        onSelect={() => setRole('couple')}
                      />
                      <RoleCard
                        icon={<Gift className="h-6 w-6" />}
                        label="Guest"
                        description="Find and contribute to weddings"
                        selected={role === 'guest'}
                        onSelect={() => setRole('guest')}
                      />
                    </div>
                  </div>
                )}

                <input
                  type="email"
                  placeholder="Email Address"
                  value={form.email}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, email: e.target.value }))
                  }
                  required
                  className="w-full rounded-2xl border border-[#e5d7c4] bg-white/55 px-4 py-3 text-sm outline-none transition-all focus:border-[#B8860B] focus:ring-4 focus:ring-[#B8860B]/10"
                />

                <input
                  type="password"
                  placeholder="Password"
                  value={form.password}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, password: e.target.value }))
                  }
                  required
                  minLength={6}
                  className="w-full rounded-2xl border border-[#e5d7c4] bg-white/55 px-4 py-3 text-sm outline-none transition-all focus:border-[#B8860B] focus:ring-4 focus:ring-[#B8860B]/10"
                />

                <button
                  type="submit"
                  disabled={loading}
                  className={`mt-1 w-full rounded-2xl ${goldGradient} px-5 py-3 text-sm font-black text-white shadow-lg shadow-[#8B5A00]/20 transition-all duration-300 hover:brightness-110 hover:shadow-xl disabled:opacity-60`}
                >
                  {loading
                    ? 'Please wait...'
                    : mode === 'login'
                    ? 'Sign In'
                    : 'Create Account'}
                </button>

                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={handleBack}
                    className="mt-2 w-full text-center text-sm font-semibold text-[#8c755e] transition hover:text-[#5f3d00]"
                  >
                    &larr; Back to role selection
                  </button>
                )}
              </form>
            ) : null}

            {/* Footer */}
            <div className="mt-5 text-center">
              {mode === 'login' && (
                <Link
                  to="/forgot-password"
                  className="text-sm font-semibold text-[#8B5A00] transition hover:text-[#5f3d00]"
                >
                  Forgot Password?
                </Link>
              )}

              <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.22em] text-[#8c755e]">
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
