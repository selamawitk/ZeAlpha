import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../api/api.js';
import bannerA from '../assets/images/auth wedding page.png';
import bannerB from '../assets/images/wedding.png';

const imageOptions = [
  { value: 'bannerA', label: 'Romantic Celebration', src: bannerA },
  { value: 'bannerB', label: 'Elegant Wedding', src: bannerB }
];

const WeddingSetup = () => {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    weddingName: '',
    weddingDate: '',
    bannerImage: imageOptions[0].value,
    description: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user?.managedWedding) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    setForm(prev => ({ ...prev, bannerImage: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const bannerImageUrl = imageOptions.find((option) => option.value === form.bannerImage)?.src || imageOptions[0].src;

      const weddingData = {
        weddingName: form.weddingName,
        weddingDate: form.weddingDate,
        bannerImage: bannerImageUrl,
        description: form.description
      };

      const response = await api.post('/weddings', weddingData);
      if (response.data?._id) {
        updateUser({ managedWedding: response.data._id });
      }
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
            <div className="grid gap-4 sm:grid-cols-2">
              {imageOptions.map((option) => (
                <label key={option.value} className="cursor-pointer rounded-3xl border border-gray-200 p-4 transition hover:border-primary">
                  <input
                    type="radio"
                    name="bannerImage"
                    value={option.value}
                    checked={form.bannerImage === option.value}
                    onChange={handleImageChange}
                    className="mr-2"
                  />
                  <span className="font-medium text-secondary">{option.label}</span>
                  <img src={option.src} alt={option.label} className="mt-3 h-32 w-full rounded-2xl object-cover" />
                </label>
              ))}
            </div>
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