import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import api, { uploadImage } from '../api/api.js';

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
    vendorId: '',
    vendorProductId: '',
    imageFile: null,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadPhase, setUploadPhase] = useState('');
  const [vendors, setVendors] = useState([]);
  const [vendorProducts, setVendorProducts] = useState([]);
  const [loadingVendors, setLoadingVendors] = useState(false);

  useEffect(() => {
    const fetchVendors = async () => {
      if (form.fulfillmentPreference !== 'vendor') {
        setVendors([]);
        setVendorProducts([]);
        return;
      }
      setLoadingVendors(true);
      try {
        const { data } = await api.get('/vendors');
        setVendors(data || []);
      } catch {
        setVendors([]);
      } finally {
        setLoadingVendors(false);
      }
    };
    fetchVendors();
  }, [form.fulfillmentPreference]);

  const handleVendorChange = async (vendorId) => {
    setForm(prev => ({ ...prev, vendorId, vendorProductId: '' }));
    if (!vendorId) { setVendorProducts([]); return; }
    try {
      const { data } = await api.get(`/vendors/${vendorId}/products`);
      setVendorProducts(data || []);
    } catch {
      setVendorProducts([]);
    }
  };

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
    const fetchGifts = async () => {
      if (!weddingId) {
        setLoadingGifts(false);
        return;
      }

      try {
        const response = await api.get(
          `/gifts/wedding/${weddingId}`
        );
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
      const max = 1200;
      let { width, height } = img;
      if (width > max || height > max) {
        if (width > height) { height = (height / width) * max; width = max; }
        else { width = (width / height) * max; height = max; }
      }
      const canvas = document.createElement('canvas');
      canvas.width = width; canvas.height = height;
      canvas.getContext('2d').drawImage(img, 0, 0, width, height);
      canvas.toBlob((blob) => resolve(new File([blob], file.name, { type: 'image/jpeg' })), 'image/jpeg', 0.8);
    };
    img.src = url;
  });

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
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
      fulfillmentPreference: gift.fulfillmentPreference || 'cash',
      vendorId: gift.vendorId || '',
      vendorProductId: gift.vendorProductId || '',
      imageFile: null,
    });
    if (gift.vendorId) handleVendorChange(gift.vendorId);
    setEditGiftId(gift._id);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!weddingId) {
      setError('Wedding ID is required to save gifts.');
      return;
    }

    setIsSubmitting(true);
    setError('');
    setUploadPhase('');

    try {
      let imageUrl = '';

      if (form.imageFile) {
        setUploadPhase('Uploading image...');
        const uploadRes = await uploadImage(form.imageFile);
        imageUrl = uploadRes.url;
        setUploadPhase('Saving gift...');
      }

      const payload = {
        weddingId,
        name: form.name,
        description: form.description,
        totalPrice: Number(form.totalPrice),
        type: form.type,
        fulfillmentPreference: form.fulfillmentPreference,
        imageUrl,
        vendorId: form.fulfillmentPreference === 'vendor' ? form.vendorId : null,
        vendorProductId: form.fulfillmentPreference === 'vendor' ? form.vendorProductId : null,
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
        vendorId: '',
        vendorProductId: '',
        imageFile: null,
      });
      setEditGiftId(null);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Unable to save gift.'
      );
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
          <motion.div whileHover={{ scale: 1.02 }} transition={{ type: 'spring', stiffness: 300 }} className={`rounded-[28px] p-8 ${glassCard}`}>

            <h2 className="mb-5 text-2xl font-black text-[#2d2218]">
              Add New Gift
            </h2>

            <form
              onSubmit={handleSubmit}
              className="space-y-5"
            >

              {/* Wedding ID */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-[#6f6257]">
                  Wedding ID
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
                  Gift Name
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
                  Description
                </label>

                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  rows="4"
                  placeholder="Describe why this gift matters."
                  className="w-full rounded-2xl border border-[#e5d7c4] bg-white/65 px-4 py-3 text-sm outline-none transition-all focus:border-[#B8860B] focus:ring-4 focus:ring-[#B8860B]/10"
                />
              </div>

              {/* Amount + Type */}
              <div className="grid gap-4 md:grid-cols-2">

                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#6f6257]">
                    Amount
                  </label>

                  <input
                    name="totalPrice"
                    type="number"
                    value={form.totalPrice}
                    onChange={handleChange}
                    placeholder="ETB 0"
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

              {/* Fulfillment Preference */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-[#6f6257]">
                  Fulfillment Preference
                </label>
                <select
                  name="fulfillmentPreference"
                  value={form.fulfillmentPreference}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-[#e5d7c4] bg-white/65 px-4 py-3 text-sm outline-none transition-all focus:border-[#B8860B] focus:ring-4 focus:ring-[#B8860B]/10"
                >
                  <option value="cash">
                    Cash Conversion — Convert funds to cash on completion
                  </option>
                  <option value="vendor">
                    Vendor Fulfillment — Automatically order from vendor on completion
                  </option>
                </select>
              </div>

              {/* Vendor Selection — only when vendor fulfillment */}
              {form.fulfillmentPreference === 'vendor' && (
                <>
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-[#6f6257]">Vendor</label>
                    <select
                      value={form.vendorId}
                      onChange={(e) => handleVendorChange(e.target.value)}
                      className="w-full rounded-2xl border border-[#e5d7c4] bg-white/65 px-4 py-3 text-sm outline-none transition-all focus:border-[#B8860B] focus:ring-4 focus:ring-[#B8860B]/10"
                    >
                      <option value="">Select a vendor...</option>
                      {loadingVendors ? (
                        <option disabled>Loading vendors...</option>
                      ) : vendors.length === 0 ? (
                        <option disabled>No vendors available</option>
                      ) : vendors.map(v => (
                        <option key={v._id} value={v._id}>{v.name}</option>
                      ))}
                    </select>
                  </div>

                  {form.vendorId && (
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-[#6f6257]">Product</label>
                      <select
                        value={form.vendorProductId}
                        onChange={(e) => setForm(p => ({ ...p, vendorProductId: e.target.value }))}
                        className="w-full rounded-2xl border border-[#e5d7c4] bg-white/65 px-4 py-3 text-sm outline-none transition-all focus:border-[#B8860B] focus:ring-4 focus:ring-[#B8860B]/10"
                      >
                        <option value="">Select a product...</option>
                        {vendorProducts.length === 0 ? (
                          <option disabled>No products for this vendor</option>
                        ) : vendorProducts.map(p => (
                          <option key={p._id} value={p._id}>{p.name} — ETB {p.price?.toLocaleString()}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </>
              )}

              {/* Image */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-[#6f6257]">
                  Gift Image
                </label>

                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="w-full rounded-2xl border border-[#e5d7c4] bg-white/65 px-4 py-3 text-sm text-[#6f6257] outline-none transition-all focus:border-[#B8860B] focus:ring-4 focus:ring-[#B8860B]/10"
                />
              </div>

              {/* Error */}
              {error && (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              {/* Buttons */}
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`flex-1 rounded-2xl ${goldGradient} px-5 py-3.5 text-sm font-black text-white shadow-lg shadow-[#8B5A00]/20 transition-all duration-300 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60`}
                >
                  {isSubmitting
                    ? (uploadPhase || 'Saving...')
                    : editGiftId ? 'Update Gift' : 'Save Gift'}
                </button>

                {editGiftId && (
                  <button
                    type="button"
                    onClick={() => {
                      setForm({ name: '', description: '', totalPrice: '', type: 'fractional', fulfillmentPreference: 'cash', vendorId: '', vendorProductId: '', imageFile: null });
                      setEditGiftId(null);
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
                    className={`rounded-[28px] border border-[#CFA97A] bg-[#fffaf4] p-5 transition-all duration-300 hover:shadow-lg`}
                  >
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

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

                      <div className="flex gap-3">

                        <button
                          onClick={() => handleEdit(gift)}
                          className="rounded-full border border-[#B8860B]/30 bg-[#fff7ea] px-4 py-2 text-sm font-semibold text-[#8B5A00] transition-all duration-300 hover:bg-[#f5e3bf]"
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