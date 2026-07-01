import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import api, { uploadImage } from '../api/api.js';

const waitForServer = async (maxRetries = 10, delay = 2000) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      await api.get('/health');
      return;
    } catch {
      await new Promise((r) => setTimeout(r, delay));
    }
  }
};

const DashboardManage = () => {
  const { user } = useAuth();

  const [gifts, setGifts] = useState([]);
  const [loadingGifts, setLoadingGifts] = useState(true);
  const [error, setError] = useState('');
  const [editGiftId, setEditGiftId] = useState(null);

  const [form, setForm] = useState({
    name: '',
    description: '',
    totalPrice: '',
    type: 'fractional',
    fulfillmentPreference: 'cash',
    imageFile: null,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadPhase, setUploadPhase] = useState('');
  const [fileInputKey, setFileInputKey] = useState(0);
  const [previewUrl, setPreviewUrl] = useState('');

  const [weddingId, setWeddingId] = useState(
    user?.managedWedding || localStorage.getItem('weddingId') || ''
  );

  const goldGradient =
    'bg-gradient-to-r from-[#B8860B] via-[#A0700A] to-[#8B5A00]';

  const glassCard =
    'bg-white/60 backdrop-blur-xl border border-[#D4C39B] shadow-[0_4px_16px_rgba(0,0,0,0.05)] rounded-[28px]';

  const pageBackground =
    'bg-gradient-to-br from-[#f5f1ea] via-[#f8f5ef] to-[#ece2d4]';

  const textPrimary = 'text-[#2d2218]';
  const textMuted = 'text-[#6f6257]';

  useEffect(() => {
    setError('');

    const load = async () => {
      if (!weddingId || weddingId.length < 5) {
        setLoadingGifts(false);
        return;
      }

      await waitForServer();

      try {
        const response = await api.get(
          `/gifts/wedding/${weddingId}`
        );
        setGifts(response.data);
        setError('');
      } catch (err) {
        setGifts([]);
        if (err.response?.status === 404) {
          setError('Your wedding was not found. Please create a new one.');
        } else {
          setError(err.response?.data?.message || 'Failed to load gifts.');
        }
      } finally {
        setLoadingGifts(false);
      }
    };

    load();
  }, [weddingId]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const compressImage = (file) => new Promise((resolve) => {
    if (!file.type.startsWith('image/')) return resolve(file);
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
      const max = 800;
      if (width > max || height > max) {
        if (width > height) { height = Math.round((height / width) * max); width = max; }
        else { width = Math.round((width / height) * max); height = max; }
      }
      const canvas = document.createElement('canvas');
      canvas.width = width; canvas.height = height;
      canvas.getContext('2d').drawImage(img, 0, 0, width, height);
      canvas.toBlob((blob) => resolve(new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' })), 'image/jpeg', 0.6);
    };
    img.src = url;
  });

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    setPreviewUrl(URL.createObjectURL(file));
    const compressed = await compressImage(file);
    setForm((prev) => ({
      ...prev,
      imageFile: compressed,
    }));
  };

  const handleDelete = async (giftId) => {
    if (!window.confirm('Are you sure you want to delete this gift?')) return;
    try {
      await api.delete(`/gifts/${giftId}`);
      setGifts(prev => prev.filter(g => g._id !== giftId));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete gift');
    }
  };

  const handleEdit = (gift) => {
    setForm({
      name: gift.name,
      description: gift.description || '',
      totalPrice: gift.totalPrice,
      type: gift.type,
      fulfillmentPreference: 'cash',
      imageFile: null,
    });
    setEditGiftId(gift._id);
    setPreviewUrl(gift.imageUrl || '');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!weddingId) {
      setError('Wedding ID is required to save gifts.');
      return;
    }

    if (!form.name.trim()) {
      setError('Gift name is required.');
      return;
    }
    if (!form.description.trim()) {
      setError('Gift description is required.');
      return;
    }
    if (!form.totalPrice || Number(form.totalPrice) <= 0) {
      setError('A valid amount is required.');
      return;
    }
    if (!editGiftId && !form.imageFile) {
      setError('A gift image is required.');
      return;
    }

    setIsSubmitting(true);
    setError('');
    setUploadPhase('');

    try {
      await waitForServer();

      let imageUrl = '';
      if (form.imageFile) {
        setUploadPhase('Uploading image...');
        const uploadRes = await uploadImage(form.imageFile);
        imageUrl = uploadRes.url;
        setUploadPhase('Saving gift...');
      } else if (editGiftId) {
        const existing = gifts.find(g => g._id === editGiftId);
        if (existing) imageUrl = existing.imageUrl || '';
      }

      const payload = {
        weddingId,
        name: form.name.trim(),
        description: form.description.trim(),
        totalPrice: Number(form.totalPrice),
        type: form.type,
        fulfillmentPreference: 'cash',
        imageUrl,
      };

      let response;
      if (editGiftId) {
        response = await api.put(`/gifts/${editGiftId}`, payload);
        setGifts((prev) => prev.map(g => g._id === editGiftId ? { ...g, ...response.data } : g));
      } else {
        response = await api.post('/gifts', payload);
        setGifts((prev) => [response.data, ...prev]);
      }

      setForm({
        name: '',
        description: '',
        totalPrice: '',
        type: 'fractional',
        fulfillmentPreference: 'cash',
        imageFile: null,
      });
      setEditGiftId(null);
      setPreviewUrl('');
      setFileInputKey(prev => prev + 1);
    } catch (err) {
      if (!err.response) {
        setError('Server is waking up, please wait a moment and try again.');
      } else {
        setError(err.response?.data?.message || 'Unable to save gift.');
      }
    } finally {
      setIsSubmitting(false);
      setUploadPhase('');
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className={`min-h-screen ${pageBackground} px-4 py-10`}>
      <div className="container mx-auto">

        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-black text-[#2d2218]">
              Gift Management
            </h1>

            <p className="mt-2 text-sm text-[#6f6257]">
              Add gifts, manage your registry, and keep
              everything beautifully organized.
            </p>
          </div>

          <Link
            to="/dashboard"
            className={`${goldGradient} inline-flex items-center justify-center rounded-2xl px-6 py-3 text-sm font-bold text-white shadow-lg shadow-[#8B5A00]/20 transition-all duration-300 hover:brightness-110`}
          >
            Back to Dashboard
          </Link>
        </div>

        {/* Main Grid */}
        <div className="grid gap-8 lg:grid-cols-[1.1fr_1.6fr]">

          {/* Add Gift */}
          <motion.div
            whileHover={{ scale: editGiftId ? 1 : 1.02 }}
            transition={{ type: 'spring', stiffness: 300 }}
            className={`rounded-[28px] p-8 ${editGiftId ? 'border-[3px] border-[#B8860B] shadow-[0_0_0_4px_rgba(184,134,11,0.15),0_8px_24px_rgba(184,134,11,0.12)] bg-[#fffcf5]' : ''} ${glassCard}`}
          >

            {editGiftId && (
              <div className="-mx-8 -mt-8 mb-6 rounded-t-[26px] bg-gradient-to-r from-[#B8860B] to-[#8B5A00] px-8 py-4">
                <p className="text-sm font-black uppercase tracking-widest text-white/80">
                  Editing Mode
                </p>
                <p className="text-lg font-black text-white">
                  {form.name || 'Untitled Gift'}
                </p>
              </div>
            )}

            <div className="mb-5">
              <h2 className="text-2xl font-black text-[#2d2218]">
                {editGiftId ? 'Edit Gift Details' : 'Add New Gift'}
              </h2>
            </div>

            <form
              onSubmit={handleSubmit}
              className="space-y-5"
            >

              {/* Wedding ID */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-[#6f6257]">
                  Wedding ID <span className="text-red-500">*</span>
                </label>
                <input
                  name="weddingId"
                  value={weddingId}
                  onChange={(e) => setWeddingId(e.target.value)}
                  placeholder="Wedding ID (from your dashboard)"
                  required
                  className="w-full rounded-2xl border border-[#e5d7c4] bg-white/65 px-4 py-3 text-sm outline-none transition-all focus:border-[#B8860B] focus:ring-4 focus:ring-[#B8860B]/10"
                />
              </div>

              {/* Gift Name */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-[#6f6257]">
                  Gift Name <span className="text-red-500">*</span>
                </label>

                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="e.g. Luxury Coffee Machine"
                  required
                  className="w-full rounded-2xl border border-[#e5d7c4] bg-white/65 px-4 py-3 text-sm outline-none transition-all focus:border-[#B8860B] focus:ring-4 focus:ring-[#B8860B]/10"
                />
              </div>

              {/* Description */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-[#6f6257]">
                  Description <span className="text-red-500">*</span>
                </label>

                  <textarea
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    rows="4"
                    placeholder="Describe why this gift matters."
                    required
                    className="w-full rounded-2xl border border-[#e5d7c4] bg-white/65 px-4 py-3 text-sm outline-none transition-all focus:border-[#B8860B] focus:ring-4 focus:ring-[#B8860B]/10"
                  />
              </div>

              {/* Amount + Type */}
              <div className="grid gap-4 md:grid-cols-2">

                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#6f6257]">
                    Amount (ETB) <span className="text-red-500">*</span>
                  </label>

                  <input
                    name="totalPrice"
                    type="number"
                    value={form.totalPrice}
                    onChange={handleChange}
                    placeholder="0"
                    required
                    className="w-full rounded-2xl border border-[#e5d7c4] bg-white/65 px-4 py-3 text-sm outline-none transition-all focus:border-[#B8860B] focus:ring-4 focus:ring-[#B8860B]/10"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#6f6257]">
                    Gift Type
                  </label>

                  <select
                    name="type"
                    value={form.type}
                    onChange={handleChange}
                    className="w-full rounded-2xl border border-[#e5d7c4] bg-white/65 px-4 py-3 text-sm outline-none transition-all focus:border-[#B8860B] focus:ring-4 focus:ring-[#B8860B]/10"
                  >
                    <option value="fractional">
                      Shareable
                    </option>

                    <option value="individual">
                      Unique
                    </option>
                  </select>
                </div>
              </div>

              {/* Image */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-[#6f6257]">
                  Gift Image <span className="text-red-500">*</span>
                </label>

                <input
                  key={fileInputKey}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  required={!editGiftId}
                  className="w-full rounded-2xl border border-[#e5d7c4] bg-white/65 px-4 py-3 text-sm text-[#6f6257] outline-none transition-all focus:border-[#B8860B] focus:ring-4 focus:ring-[#B8860B]/10"
                />
                <p className="mt-1.5 text-xs text-[#6f6257]/70">
                  {editGiftId
                    ? 'Leave empty to keep the current image.'
                    : 'Select an image for this gift.'}
                </p>
                {previewUrl && (
                  <div className="mt-3">
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="h-24 w-24 rounded-xl object-cover border border-[#e5d7c4]"
                    />
                    {editGiftId && !form.imageFile && (
                      <p className="mt-1 text-xs text-[#6f6257]/60">Current image</p>
                    )}
                  </div>
                )}
              </div>

              {/* Error */}
              {error && (
                <div className="rounded-2xl border-2 border-red-300 bg-red-50 px-5 py-4 text-sm font-semibold text-red-700">
                  {error}
                </div>
              )}

              {/* Buttons */}
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`flex-1 rounded-2xl px-5 py-3.5 text-sm font-black text-white shadow-lg transition-all duration-300 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60 ${editGiftId ? 'bg-gradient-to-r from-[#8B5A00] to-[#6B4200] shadow-[#6B4200]/20' : goldGradient} shadow-[#8B5A00]/20`}
                >
                  {isSubmitting
                    ? <span className="inline-flex items-center gap-2"><span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>{uploadPhase || 'Saving...'}</span>
                    : editGiftId ? 'Update Gift' : 'Save Gift'}
                </button>

                {editGiftId && (
                  <button
                    type="button"
                    onClick={() => {
                      setForm({ name: '', description: '', totalPrice: '', type: 'fractional', fulfillmentPreference: 'cash', imageFile: null });
                      setEditGiftId(null);
                      setPreviewUrl('');
                      setError('');
                    }}
                    className="rounded-2xl border-2 border-[#dcc6a7] bg-white/50 px-5 py-3.5 text-sm font-bold text-[#6f6257] transition-all duration-300 hover:border-red-300 hover:bg-red-50 hover:text-red-600"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </motion.div>

          {/* Gifts List */}
          <motion.div whileHover={{ scale: 1.02 }} transition={{ type: 'spring', stiffness: 300 }} className={`rounded-[28px] p-8 ${glassCard}`}>

            <h2 className="mb-5 text-2xl font-black text-[#2d2218]">
              Current Registry Gifts
            </h2>

            {loadingGifts ? (
              <div className="text-[#6f6257]">
                Loading gifts...
              </div>
            ) : !weddingId ? (
              <div className="rounded-2xl border border-yellow-200 bg-yellow-50 px-4 py-4 text-sm text-yellow-700">
                Set your wedding ID to manage gifts.
              </div>
            ) : gifts.length === 0 ? (
              <div className="rounded-2xl border border-[#ead9c0] bg-[#fff8ef] px-5 py-6 text-sm text-[#6f6257]">
                No gifts yet. Add your first registry gift.
              </div>
          ) : (
              <div className="space-y-4">
                  {gifts.map((gift) => (
                    <motion.div
                      key={gift._id}
                      whileHover={{ scale: 1.02 }}
                      transition={{ type: 'spring', stiffness: 300 }}
                      className={`rounded-[28px] border p-5 transition-all duration-300 hover:shadow-lg ${
                        editGiftId === gift._id
                          ? 'border-[#B8860B] bg-[#fff7ea] shadow-[0_0_0_3px_rgba(184,134,11,0.12)]'
                          : 'border-[#CFA97A] bg-[#fffaf4]'
                      }`}
                    >
                      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">

                        <div>
                          <h3 className="text-lg font-bold text-[#2d2218]">
                            {gift.name}
                          </h3>

                          <p className="mt-1 text-sm text-[#6f6257]">
                            {gift.type} •{' '}
                            {gift.currentCollected || 0}/
                            {gift.totalPrice} ETB
                          </p>
                        </div>

                        <div className="flex items-center gap-3">

                          {editGiftId === gift._id && (
                            <span className="rounded-full bg-gradient-to-r from-[#B8860B] to-[#8B5A00] px-3 py-1 text-xs font-black text-white uppercase tracking-wider">
                              Editing Now
                            </span>
                          )}

                          <button
                            onClick={() => handleEdit(gift)}
                            disabled={editGiftId === gift._id}
                            className={`rounded-full border px-4 py-2 text-sm font-semibold transition-all duration-300 ${
                              editGiftId === gift._id
                                ? 'border-[#B8860B]/10 bg-[#B8860B]/10 text-[#8B5A00]/50 cursor-not-allowed'
                                : 'border-[#B8860B]/30 bg-[#fff7ea] text-[#8B5A00] hover:bg-[#f5e3bf]'
                            }`}
                          >
                            Edit
                          </button>

                          <button
                            onClick={() => handleDelete(gift._id)}
                            className="rounded-full border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-600 transition-all duration-300 hover:bg-red-100"
                          >
                            Delete
                          </button>

                        </div>
                      </div>
                    </motion.div>
                  ))}
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

export default DashboardManage;