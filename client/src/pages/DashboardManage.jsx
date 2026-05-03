import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import api, { uploadImage } from '../api/api.js';

const DashboardManage = () => {
  const { user, loading } = useAuth();
  const [gifts, setGifts] = useState([]);
  const [loadingGifts, setLoadingGifts] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ name: '', description: '', totalPrice: '', type: 'fractional', imageFile: null });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const weddingId = user?.weddingId || localStorage.getItem('weddingId');

  useEffect(() => {
    const fetchGifts = async () => {
      if (!weddingId) {
        setLoadingGifts(false);
        return;
      }

      try {
        const response = await api.get(`/gifts/wedding/${weddingId}`);
        setGifts(response.data);
      } catch (err) {
        setError('Failed to load gifts.');
      } finally {
        setLoadingGifts(false);
      }
    };

    fetchGifts();
  }, [weddingId]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (event) => {
    setForm((prev) => ({ ...prev, imageFile: event.target.files[0] }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!weddingId) {
      setError('Wedding ID is required to save gifts.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      let imageUrl = '';
      if (form.imageFile) {
        const uploadRes = await uploadImage(form.imageFile);
        imageUrl = uploadRes.url;
      }

      const payload = {
        weddingId,
        name: form.name,
        description: form.description,
        totalPrice: Number(form.totalPrice),
        type: form.type,
        imageUrl,
      };
      const response = await api.post('/gifts', payload);
      setGifts((prev) => [response.data, ...prev]);
      setForm({ name: '', description: '', totalPrice: '', type: 'fractional', imageFile: null });
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to save gift.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-primary-dark">Gift Management</h1>
          <p className="text-secondary mt-2">Add gifts, keep the registry fresh, and stay organized.</p>
        </div>
        <Link to="/dashboard" className="btn-primary inline-flex">
          Back to Dashboard
        </Link>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1.4fr_2fr]">
        <div className="rounded-3xl bg-white p-8 shadow-premium">
          <h2 className="text-xl font-semibold text-primary-dark mb-4">Add New Gift</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-secondary mb-2">Gift name</label>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                className="w-full rounded-2xl border border-gray-300 px-4 py-3 focus:border-primary focus:ring-2 focus:ring-primary/20"
                placeholder="e.g. Premium Espresso Machine"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary mb-2">Description</label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows="4"
                className="w-full rounded-2xl border border-gray-300 px-4 py-3 focus:border-primary focus:ring-2 focus:ring-primary/20"
                placeholder="Help guests understand why it matters."
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-secondary mb-2">Amount</label>
                <input
                  name="totalPrice"
                  type="number"
                  value={form.totalPrice}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-gray-300 px-4 py-3 focus:border-primary focus:ring-2 focus:ring-primary/20"
                  placeholder="ETB 0"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary mb-2">Gift type</label>
                <select
                  name="type"
                  value={form.type}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-gray-300 px-4 py-3 focus:border-primary focus:ring-2 focus:ring-primary/20"
                >
                  <option value="fractional">Shareable</option>
                  <option value="individual">Unique</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary mb-2">Gift Image</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="w-full rounded-2xl border border-gray-300 px-4 py-3 focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
            {error && <div className="rounded-2xl bg-red-50 border border-red-200 p-3 text-sm text-red-700">{error}</div>}
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary disabled:cursor-not-allowed disabled:bg-gray-300"
            >
              {isSubmitting ? 'Saving...' : 'Save Gift'}
            </button>
          </form>
        </div>

        <div className="rounded-3xl bg-white p-8 shadow-premium">
          <h2 className="text-xl font-semibold text-primary-dark mb-4">Current Registry Gifts</h2>
          {loadingGifts ? (
            <div className="text-center text-secondary">Loading gifts...</div>
          ) : !weddingId ? (
            <div className="rounded-2xl bg-yellow-50 border border-yellow-200 p-4 text-sm text-yellow-700">
              Set <strong>weddingId</strong> in your couple profile to load gift data.
            </div>
          ) : gifts.length === 0 ? (
            <div className="text-secondary">No gifts yet. Add one to build your registry.</div>
          ) : (
            <div className="space-y-4">
              {gifts.map((gift) => (
                <div key={gift._id} className="rounded-2xl border border-gray-200 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h3 className="font-semibold text-primary-dark">{gift.name}</h3>
                      <p className="text-sm text-secondary mt-1">{gift.type} • {gift.currentCollected || 0}/{gift.totalPrice} ETB</p>
                    </div>
                    <div className="flex gap-2">
                      <button className="rounded-full border border-primary px-3 py-2 text-sm text-primary hover:bg-primary/5">
                        Edit
                      </button>
                      <button className="rounded-full border border-red-300 px-3 py-2 text-sm text-red-600 hover:bg-red-50">
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardManage;
