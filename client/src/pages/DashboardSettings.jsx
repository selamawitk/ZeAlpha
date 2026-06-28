import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../api/api.js';

const DashboardSettings = () => {
  const { user } = useAuth();

  const [profile, setProfile] = useState({
    weddingName: '',
    weddingDate: '',
    description: '',
    bannerImage: '',
  });

  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (user?.managedWedding) {
      setFetching(true);
      api.get(`/weddings/${user.managedWedding}`)
        .then(res => {
          const w = res.data;
          setProfile({
            weddingName: w.weddingName || '',
            weddingDate: w.weddingDate ? w.weddingDate.split('T')[0] : '',
            description: w.description || '',
            bannerImage: w.bannerImage || '',
          });
        })
        .catch(err => console.error('Failed to load wedding profile', err))
        .finally(() => setFetching(false));
    } else {
      setFetching(false);
    }
  }, [user]);

  useEffect(() => {
    if (saved) {
      const timer = setTimeout(() => setSaved(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [saved]);

  const handleSave = async (event) => {
    event.preventDefault();
    if (!user?.managedWedding) return;
    setLoading(true);
    try {
      await api.put(`/weddings/${user.managedWedding}`, {
        weddingName: profile.weddingName,
        weddingDate: profile.weddingDate,
        description: profile.description,
        bannerImage: profile.bannerImage,
      });
      setSaved(true);
    } catch (err) {
      console.error('Failed to save wedding profile', err);
    } finally {
      setLoading(false);
    }
  };

  const pageBackground =
    'bg-gradient-to-br from-[#f5f1ea] via-[#f8f5ef] to-[#ece2d4]';

  const glassCard =
    'bg-white/60 backdrop-blur-xl border border-[#D4C39B] shadow-[0_4px_16px_rgba(0,0,0,0.05)] rounded-[28px]';

  const goldGradient =
    'bg-gradient-to-r from-[#B8860B] via-[#A0700A] to-[#8B5A00]';

  const textPrimary = 'text-[#2d2218]';
  const textMuted = 'text-[#6f6257]';

  return (
    <div
      className={`relative min-h-screen overflow-hidden ${pageBackground} p-5`}
    >
      {/* Background Glow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-[#d4af37]/10 blur-3xl"></div>

        <div className="absolute bottom-0 right-0 h-72 w-72 rounded-full bg-[#c49b52]/10 blur-3xl"></div>
      </div>

      <div className="relative z-10 mx-auto max-w-5xl">
        <div className={`rounded-[28px] p-8 ${glassCard}`}>
          {/* Header */}
          <div className="mb-8">
            <h1
              className={`text-3xl font-black tracking-tight ${textPrimary}`}
            >
              Wedding Profile
            </h1>

            <p className={`mt-2 text-sm ${textMuted}`}>
              Update registry details and keep your wedding story current.
            </p>
          </div>

          {fetching ? (
            <div className="space-y-5 animate-pulse">
              <div className="grid gap-5 md:grid-cols-2">
                <div className="h-12 rounded-2xl bg-[#ead9c0]"></div>
                <div className="h-12 rounded-2xl bg-[#ead9c0]"></div>
              </div>
              <div className="h-24 rounded-2xl bg-[#ead9c0]"></div>
              <div className="h-12 w-40 rounded-2xl bg-[#ead9c0]"></div>
            </div>
          ) : (
          /* Form */
          <form
            onSubmit={handleSave}
            className="space-y-5"
          >
            {/* Row 1 */}
            <div className="grid gap-5 md:grid-cols-2">
              <label className="space-y-2">
                <span
                  className={`text-sm font-bold ${textMuted}`}
                >
                  Wedding Name
                </span>

                <input
                  value={profile.weddingName}
                  onChange={(e) =>
                    setProfile((prev) => ({
                      ...prev,
                      weddingName: e.target.value,
                    }))
                  }
                  className="w-full rounded-2xl border border-[#dcc6a7] bg-white/60 px-4 py-3 text-sm outline-none transition-all focus:border-[#B8860B] focus:ring-4 focus:ring-[#B8860B]/10"
                />
              </label>

              <label className="space-y-2">
                <span
                  className={`text-sm font-bold ${textMuted}`}
                >
                  Ceremony Date
                </span>

                <input
                  type="date"
                  value={profile.weddingDate}
                  onChange={(e) =>
                    setProfile((prev) => ({
                      ...prev,
                      weddingDate: e.target.value,
                    }))
                  }
                  className="w-full rounded-2xl border border-[#dcc6a7] bg-white/60 px-4 py-3 text-sm outline-none transition-all focus:border-[#B8860B] focus:ring-4 focus:ring-[#B8860B]/10"
                />
              </label>
            </div>

            {/* Row 2 */}
            <div className="grid gap-5 md:grid-cols-2">
              <label className="space-y-2">
                <span
                  className={`text-sm font-bold ${textMuted}`}
                >
                  Description
                </span>

                <textarea
                  value={profile.description}
                  onChange={(e) =>
                    setProfile((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  rows={3}
                  className="w-full rounded-2xl border border-[#dcc6a7] bg-white/60 px-4 py-3 text-sm outline-none transition-all focus:border-[#B8860B] focus:ring-4 focus:ring-[#B8860B]/10"
                />
              </label>
            </div>

            {/* Button */}
            <div className="pt-2">
              <button
                className={`rounded-2xl ${goldGradient} px-6 py-3.5 text-sm font-black text-white shadow-lg shadow-[#8B5A00]/20 transition-all duration-300 hover:brightness-110`}
                type="submit"
              >
                {loading ? 'Saving...' : 'Save Wedding Profile'}
              </button>
            </div>

            {/* Success */}
            {saved && (
              <div className="rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-semibold text-green-700">
                Wedding profile saved successfully.
              </div>
            )}
          </form>
          )}

        </div>
      </div>
    </div>
  );
};

export default DashboardSettings;