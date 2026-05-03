import { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';

const DashboardSettings = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState({
    weddingName: user?.name || '',
    venue: '',
    date: '',
    notes: '',
  });
  const [saved, setSaved] = useState(false);

  const handleSave = (event) => {
    event.preventDefault();
    setSaved(true);
    localStorage.setItem('weddingProfile', JSON.stringify(profile));
  };

  return (
    <div className="space-y-8">
      <div className="rounded-[2rem] bg-white p-8 shadow-premium">
        <h1 className="text-3xl font-semibold text-primary-dark">Wedding Profile</h1>
        <p className="mt-2 text-sm text-secondary">Update registry details and keep your wedding story current.</p>

        <form onSubmit={handleSave} className="mt-8 space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2 text-sm text-secondary">
              Wedding name
              <input
                value={profile.weddingName}
                onChange={(e) => setProfile((prev) => ({ ...prev, weddingName: e.target.value }))}
                className="w-full rounded-3xl border border-gray-300 px-4 py-3 focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </label>
            <label className="space-y-2 text-sm text-secondary">
              Venue
              <input
                value={profile.venue}
                onChange={(e) => setProfile((prev) => ({ ...prev, venue: e.target.value }))}
                className="w-full rounded-3xl border border-gray-300 px-4 py-3 focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2 text-sm text-secondary">
              Ceremony date
              <input
                type="date"
                value={profile.date}
                onChange={(e) => setProfile((prev) => ({ ...prev, date: e.target.value }))}
                className="w-full rounded-3xl border border-gray-300 px-4 py-3 focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </label>
            <label className="space-y-2 text-sm text-secondary">
              Special notes
              <input
                value={profile.notes}
                onChange={(e) => setProfile((prev) => ({ ...prev, notes: e.target.value }))}
                className="w-full rounded-3xl border border-gray-300 px-4 py-3 focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </label>
          </div>

          <button className="btn-primary">
            Save wedding profile
          </button>
          {saved && <p className="text-sm text-emerald-700">Wedding profile saved successfully.</p>}
        </form>
      </div>
    </div>
  );
};

export default DashboardSettings;
