import { useState } from 'react';
import { X, Upload, AlertCircle, CheckCircle } from 'lucide-react';
import api from '../api/api.js';

const goldGradient = 'bg-gradient-to-r from-[#B8860B] via-[#A0700A] to-[#8B5A00]';

const CATEGORIES = [
  'Furniture',
  'Kitchen',
  'Electronics',
  'Home',
  'Traditional',
  'Fashion',
  'Baby',
  'Other',
];

const GuestGiftForm = ({ weddingId, onCreated, onClose }) => {
  const [form, setForm] = useState({
    name: '',
    category: '',
    description: '',
    totalPrice: '',
    type: 'fractional',
    imageFile: null,
  });
  const [imagePreview, setImagePreview] = useState('');
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setForm(prev => ({ ...prev, imageFile: file }));
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.name.trim()) {
      setError('Gift name is required');
      return;
    }
    if (!form.category) {
      setError('Category is required');
      return;
    }
    if (!form.totalPrice || Number(form.totalPrice) <= 0) {
      setError('Please enter a valid target price');
      return;
    }

    setSubmitting(true);
    try {
      let imageUrl = '';
      if (form.imageFile) {
        setUploading(true);
        const imgData = new FormData();
        imgData.append('image', form.imageFile);
        const imgRes = await api.post('/upload/image', imgData, { timeout: 120000 });
        imageUrl = imgRes.data?.url || imgRes.data?.imageUrl || '';
        setUploading(false);
      }

      await api.post('/gifts/guest', {
        weddingId,
        name: form.name.trim(),
        category: form.category,
        description: form.description.trim(),
        totalPrice: Number(form.totalPrice),
        type: form.type,
        imageUrl,
      });

      setSuccess(true);
      setTimeout(() => {
        if (onCreated) onCreated();
        if (onClose) onClose();
      }, 2500);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to create gift');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-lg rounded-[28px] bg-white shadow-2xl border border-[#D4C39B] max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/80 border border-[#D4C39B] text-[#6f6257] hover:bg-[#f5e7ca] transition"
        >
          <X size={16} />
        </button>

        <div className="p-6">
          <h3 className="text-lg font-black text-[#2d2218] mb-1">Create Custom Gift</h3>
          <p className="text-xs text-[#6f6257] mb-5">Suggest a gift for the couple's registry</p>

          {success ? (
            <div className="rounded-2xl bg-green-50 border border-green-200 p-6 text-center">
              <CheckCircle size={40} className="mx-auto text-green-600 mb-3" />
              <p className="text-sm font-bold text-green-800">Gift suggested successfully!</p>
              <p className="text-xs text-green-600 mt-1">The couple will review and approve your suggestion.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-[#6f6257] uppercase tracking-wider mb-1.5 block">Gift Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Traditional Coffee Set"
                  value={form.name}
                  onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  className="w-full rounded-2xl border border-[#D4C39B] bg-white/65 px-4 py-3 text-sm outline-none transition-all focus:border-[#B8860B] focus:ring-4 focus:ring-[#B8860B]/10"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#6f6257] uppercase tracking-wider mb-1.5 block">Category *</label>
                <div className="grid grid-cols-2 gap-2">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setForm(p => ({ ...p, category: cat }))}
                      className={`rounded-xl px-3 py-2 text-xs font-semibold transition-all ${
                        form.category === cat
                          ? `${goldGradient} text-white shadow-md`
                          : 'border border-[#D4C39B] bg-white/60 text-[#2d2218] hover:bg-[#f5e7ca]'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-[#6f6257] uppercase tracking-wider mb-1.5 block">Description</label>
                <textarea
                  placeholder="Describe the gift..."
                  value={form.description}
                  onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                  rows={3}
                  maxLength={500}
                  className="w-full rounded-2xl border border-[#D4C39B] bg-white/65 px-4 py-3 text-sm outline-none transition-all focus:border-[#B8860B] focus:ring-4 focus:ring-[#B8860B]/10"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#6f6257] uppercase tracking-wider mb-1.5 block">Target Price (ETB) *</label>
                <input
                  type="number"
                  placeholder="e.g. 5000"
                  value={form.totalPrice}
                  onChange={e => setForm(p => ({ ...p, totalPrice: e.target.value }))}
                  className="w-full rounded-2xl border border-[#D4C39B] bg-white/65 px-4 py-3 text-sm outline-none transition-all focus:border-[#B8860B] focus:ring-4 focus:ring-[#B8860B]/10"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#6f6257] uppercase tracking-wider mb-1.5 block">Gift Type</label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setForm(p => ({ ...p, type: 'individual' }))}
                    className={`flex-1 rounded-xl px-4 py-3 text-sm font-bold transition-all ${
                      form.type === 'individual'
                        ? `${goldGradient} text-white shadow-md`
                        : 'border border-[#D4C39B] bg-white/60 text-[#2d2218] hover:bg-[#f5e7ca]'
                    }`}
                  >
                    Unique
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm(p => ({ ...p, type: 'fractional' }))}
                    className={`flex-1 rounded-xl px-4 py-3 text-sm font-bold transition-all ${
                      form.type === 'fractional'
                        ? `${goldGradient} text-white shadow-md`
                        : 'border border-[#D4C39B] bg-white/60 text-[#2d2218] hover:bg-[#f5e7ca]'
                    }`}
                  >
                    Shareable
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-[#6f6257] uppercase tracking-wider mb-1.5 block">Image (optional)</label>
                <label className="flex flex-col items-center justify-center w-full rounded-2xl border-2 border-dashed border-[#D4C39B] bg-white/40 p-4 cursor-pointer hover:bg-[#f5e7ca] transition">
                  {imagePreview ? (
                    <img src={imagePreview} alt="Preview" className="max-h-32 rounded-xl object-contain" />
                  ) : (
                    <div className="flex flex-col items-center gap-1">
                      <Upload size={20} className="text-[#8B5A00]" />
                      <span className="text-xs text-[#6f6257] font-medium">Click to upload image</span>
                    </div>
                  )}
                  <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                </label>
              </div>

              {error && (
                <div className="rounded-2xl bg-red-50 border border-red-200 p-3 text-sm text-red-700 flex items-start gap-2">
                  <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={submitting || uploading}
                className={`w-full rounded-2xl ${goldGradient} px-5 py-3 text-sm font-black text-white shadow-lg shadow-[#8B5A00]/20 transition-all duration-300 hover:brightness-110 disabled:opacity-60`}
              >
                {uploading ? 'Uploading image...' : submitting ? 'Submitting...' : 'Suggest Gift for Couple'}
              </button>

              <p className="text-[10px] text-[#6f6257] text-center">
                The couple will review your suggestion before it appears publicly.
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default GuestGiftForm;
