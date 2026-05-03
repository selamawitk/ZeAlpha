import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import api, { uploadImage } from '../api/api.js';

const WeddingSetup = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    weddingName: '',
    weddingDate: '',
    bannerImage: null,
    description: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Redirect if user already has a wedding
  if (user?.managedWedding) {
    navigate('/dashboard');
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    setForm(prev => ({ ...prev, bannerImage: e.target.files[0] }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      let bannerImageUrl = '';
      if (form.bannerImage) {
        const uploadRes = await uploadImage(form.bannerImage);
        bannerImageUrl = uploadRes.url;
      }

      const weddingData = {
        weddingName: form.weddingName,
        weddingDate: form.weddingDate,
        bannerImage: bannerImageUrl,
        description: form.description
      };

      await api.post('/weddings', weddingData);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create wedding');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-ivory flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white rounded-[2rem] p-8 shadow-premium">
        <h1 className="text-3xl font-semibold text-primary-dark mb-6">Set Up Your Wedding</h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-secondary mb-2">Wedding Name</label>
            <input
              type="text"
              name="weddingName"
              value={form.weddingName}
              onChange={handleChange}
              required
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-secondary mb-2">Wedding Date</label>
            <input
              type="date"
              name="weddingDate"
              value={form.weddingDate}
              onChange={handleChange}
              required
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-secondary mb-2">Banner Image</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="w-full p-3 border border-gray-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-secondary mb-2">Description (Optional)</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={3}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
            />
          </div>
          {error && <p className="text-red-500">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-white py-3 rounded-lg font-semibold hover:bg-primary-dark disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Wedding'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default WeddingSetup;