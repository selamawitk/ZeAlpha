import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api/api.js';
import { Plus, X, Upload, Package } from 'lucide-react';
import { uploadImage } from '../api/api.js';

const goldGradient = 'bg-gradient-to-r from-[#B8860B] via-[#A0700A] to-[#8B5A00]';
const glassCard = 'bg-white/60 backdrop-blur-xl border border-[#D4C39B] shadow-[0_4px_16px_rgba(0,0,0,0.05)] rounded-[28px]';
const cardElevated = 'bg-white/75 backdrop-blur-xl border border-[#C7A77E] shadow-[0_8px_28px_rgba(120,90,40,0.10)] rounded-[28px]';
const pageBackground = 'bg-gradient-to-br from-[#f5f1ea] via-[#f8f5ef] to-[#ece2d4]';
const inputClass = 'w-full rounded-2xl border border-[#e5d7c4] bg-white/65 px-4 py-3 text-sm text-[#2d2218] outline-none transition-all focus:border-[#B8860B] focus:ring-4 focus:ring-[#B8860B]/10';

const AdminVendors = () => {
  const [tab, setTab] = useState('vendors');
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editVendor, setEditVendor] = useState(null);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [vendorProducts, setVendorProducts] = useState([]);
  const [showProductModal, setShowProductModal] = useState(false);
  const [editProduct, setEditProduct] = useState(null);

  const [form, setForm] = useState({ name: '', email: '', phone: '', contactName: '', address: '', description: '', website: '', category: 'gift', status: 'active', logo: '' });
  const [productForm, setProductForm] = useState({ vendorId: '', name: '', description: '', price: '', stockQuantity: '0', category: '', image: '' });
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);

  const fetchVendors = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/vendors');
      setVendors(data);
    } catch (err) {
      console.error('Failed to fetch vendors', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchVendors(); }, [fetchVendors]);

  const fetchProducts = useCallback(async (vendorId) => {
    try {
      const { data } = await api.get(`/vendors/${vendorId}/products`);
      setVendorProducts(data);
    } catch (err) {
      console.error('Failed to fetch products', err);
      setVendorProducts([]);
    }
  }, []);

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const { url } = await uploadImage(file);
      setForm(prev => ({ ...prev, logo: url }));
    } catch (err) {
      console.error('Logo upload failed', err);
    } finally {
      setUploading(false);
    }
  };

  const handleProductImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const { url } = await uploadImage(file);
      setProductForm(prev => ({ ...prev, image: url }));
    } catch (err) {
      console.error('Product image upload failed', err);
    } finally {
      setUploading(false);
    }
  };

  const openCreateVendor = () => {
    setEditVendor(null);
    setForm({ name: '', email: '', phone: '', address: '', description: '', category: 'gift', status: 'active', logo: '' });
    setShowModal(true);
  };

  const openEditVendor = (vendor) => {
    setEditVendor(vendor);
    setForm({
      name: vendor.name || '',
      email: vendor.email || '',
      phone: vendor.phone || '',
      address: vendor.address || '',
      description: vendor.description || '',
      category: vendor.category || 'gift',
      status: vendor.status || 'active',
      logo: vendor.logo || '',
    });
    setShowModal(true);
  };

  const handleSaveVendor = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editVendor) {
        const { data } = await api.put(`/vendors/${editVendor._id}`, form);
        setVendors(prev => prev.map(v => v._id === data._id ? data : v));
      } else {
        const { data } = await api.post('/vendors', form);
        setVendors(prev => [data, ...prev]);
      }
      setShowModal(false);
    } catch (err) {
      console.error('Failed to save vendor', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteVendor = async (id) => {
    if (!window.confirm('Delete this vendor and all its products?')) return;
    try {
      await api.delete(`/vendors/${id}`);
      setVendors(prev => prev.filter(v => v._id !== id));
      if (selectedVendor?._id === id) { setSelectedVendor(null); setVendorProducts([]); }
    } catch (err) {
      console.error('Failed to delete vendor', err);
    }
  };

  const openCreateProduct = (vendorId) => {
    setEditProduct(null);
    setProductForm({ vendorId, name: '', description: '', price: '', stockQuantity: '0', category: '', image: '' });
    setShowProductModal(true);
  };

  const openEditProduct = (product) => {
    setEditProduct(product);
    setProductForm({
      vendorId: product.vendorId?._id || product.vendorId,
      name: product.name || '',
      description: product.description || '',
      price: product.price?.toString() || '',
      stockQuantity: product.stockQuantity?.toString() || '0',
      category: product.category || '',
      image: product.image || '',
    });
    setShowProductModal(true);
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = { ...productForm, price: Number(productForm.price), stockQuantity: Number(productForm.stockQuantity) };
      if (editProduct) {
        const { data } = await api.put(`/vendors/products/${editProduct._id}`, payload);
        setVendorProducts(prev => prev.map(p => p._id === data._id ? data : p));
      } else {
        const { data } = await api.post('/vendors/products', payload);
        setVendorProducts(prev => [data, ...prev]);
      }
      setShowProductModal(false);
    } catch (err) {
      console.error('Failed to save product', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm('Delete this product?')) return;
    try {
      await api.delete(`/vendors/products/${id}`);
      setVendorProducts(prev => prev.filter(p => p._id !== id));
    } catch (err) {
      console.error('Failed to delete product', err);
    }
  };

  const selectVendor = (vendor) => {
    setSelectedVendor(vendor);
    fetchProducts(vendor._id);
  };

  return (
    <div className={`relative min-h-screen ${pageBackground} px-4 pb-8 md:px-6 w-full max-w-full overflow-x-hidden`}>
      <div className="relative z-10 space-y-6">
        <section className={`rounded-[28px] ${cardElevated} px-6 py-5 md:px-7 md:py-6`}>
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl md:text-[34px] font-black tracking-tight text-[#2d2218]">Vendor Marketplace</h1>
              <p className="mt-2 text-sm md:text-[15px] text-[#6f6257]">Manage vendors and their product catalogs.</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setTab('vendors')} className={`rounded-full px-5 py-2.5 text-xs font-black transition-all ${tab === 'vendors' ? `${goldGradient} text-white shadow-md` : 'border border-[#D4C39B] bg-white/60 text-[#6f6257]'}`}>Vendors ({vendors.length})</button>
              {selectedVendor && <button onClick={() => { setSelectedVendor(null); setVendorProducts([]); setTab('vendors'); }} className="rounded-full px-5 py-2.5 text-xs font-black border border-[#D4C39B] bg-white/60 text-[#6f6257]">Back</button>}
            </div>
          </div>
        </section>

        {tab === 'vendors' && !selectedVendor && (
          <section className={`overflow-hidden rounded-[28px] ${glassCard}`}>
            <div className="border-b border-[#cfa97a]/50 px-6 py-5 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black text-[#2d2218]">Registered Vendors</h2>
                <p className="mt-1 text-sm text-[#6f6257]">Vendor directory for gift fulfillment and services.</p>
              </div>
              <button onClick={openCreateVendor} className={`${goldGradient} rounded-full px-4 py-2.5 text-xs font-black text-white shadow-md flex items-center gap-1.5`}>
                <Plus size={14} /> Add Vendor
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-separate border-spacing-0">
                <thead>
                  <tr>
                    <th className="px-5 py-3.5 text-left text-[11px] font-black uppercase tracking-[0.2em] text-[#7c6247]">Vendor</th>
                    <th className="px-5 py-3.5 text-left text-[11px] font-black uppercase tracking-[0.2em] text-[#7c6247]">Category</th>
                    <th className="px-5 py-3.5 text-left text-[11px] font-black uppercase tracking-[0.2em] text-[#7c6247]">Contact</th>
                    <th className="px-5 py-3.5 text-left text-[11px] font-black uppercase tracking-[0.2em] text-[#7c6247]">Status</th>
                    <th className="px-5 py-3.5 text-right text-[11px] font-black uppercase tracking-[0.2em] text-[#7c6247]">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan="5" className="px-5 py-10 text-center text-sm font-semibold text-[#2d2218]">Loading vendors...</td></tr>
                  ) : vendors.length === 0 ? (
                    <tr><td colSpan="5" className="px-5 py-10 text-center text-sm font-semibold text-[#6f6257]">No vendors registered yet. Click "Add Vendor" to begin.</td></tr>
                  ) : vendors.map((v, i) => (
                    <motion.tr key={v._id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} className="transition-all duration-300 hover:bg-white/20 cursor-pointer" onClick={() => selectVendor(v)}>
                      <td className="border-t border-[#d4bc99]/40 px-5 py-4">
                        <div className="flex items-center gap-3">
                          {v.logo ? <img src={v.logo} alt={v.name} className="h-8 w-8 rounded-lg object-cover border border-[#D4C39B]" /> : <div className="h-8 w-8 rounded-lg bg-[#F2EDE1] border border-[#D4C39B] flex items-center justify-center text-xs font-black text-[#8B5A00]">{v.name?.charAt(0)}</div>}
                          <span className="font-black text-[#2d2218]">{v.name}</span>
                        </div>
                      </td>
                      <td className="border-t border-[#d4bc99]/40 px-5 py-4"><span className="text-sm capitalize text-[#6f6257]">{v.category}</span></td>
                      <td className="border-t border-[#d4bc99]/40 px-5 py-4"><span className="text-sm text-[#6f6257]">{v.email || v.phone || 'N/A'}</span></td>
                      <td className="border-t border-[#d4bc99]/40 px-5 py-4">
                        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-black capitalize ${v.status === 'active' ? 'bg-green-100 text-green-700 border border-green-300' : v.status === 'suspended' ? 'bg-red-100 text-red-700 border border-red-300' : 'bg-gray-100 text-gray-600 border border-gray-300'}`}>{v.status}</span>
                      </td>
                      <td className="border-t border-[#d4bc99]/40 px-5 py-4 text-right">
                        <button onClick={(e) => { e.stopPropagation(); openEditVendor(v); }} className="text-xs font-black text-[#8B5A00] hover:underline mr-3">Edit</button>
                        <button onClick={(e) => { e.stopPropagation(); handleDeleteVendor(v._id); }} className="text-xs font-black text-red-500 hover:underline">Delete</button>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {tab === 'vendors' && selectedVendor && (
          <section className={`overflow-hidden rounded-[28px] ${glassCard}`}>
            <div className="border-b border-[#cfa97a]/50 px-6 py-5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                {selectedVendor.logo ? <img src={selectedVendor.logo} alt={selectedVendor.name} className="h-12 w-12 rounded-xl object-cover border border-[#D4C39B]" /> : <div className="h-12 w-12 rounded-xl bg-[#F2EDE1] border border-[#D4C39B] flex items-center justify-center text-lg font-black text-[#8B5A00]">{selectedVendor.name?.charAt(0)}</div>}
                <div>
                  <h2 className="text-xl font-black text-[#2d2218]">{selectedVendor.name}</h2>
                  <p className="mt-0.5 text-sm text-[#6f6257]">{selectedVendor.category} • {selectedVendor.email || selectedVendor.phone || 'No contact'}</p>
                </div>
              </div>
              <button onClick={() => openCreateProduct(selectedVendor._id)} className={`${goldGradient} rounded-full px-4 py-2.5 text-xs font-black text-white shadow-md flex items-center gap-1.5`}>
                <Package size={14} /> Add Product
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-separate border-spacing-0">
                <thead>
                  <tr>
                    <th className="px-5 py-3.5 text-left text-[11px] font-black uppercase tracking-[0.2em] text-[#7c6247]">Product</th>
                    <th className="px-5 py-3.5 text-left text-[11px] font-black uppercase tracking-[0.2em] text-[#7c6247]">Category</th>
                    <th className="px-5 py-3.5 text-left text-[11px] font-black uppercase tracking-[0.2em] text-[#7c6247]">Price</th>
                    <th className="px-5 py-3.5 text-left text-[11px] font-black uppercase tracking-[0.2em] text-[#7c6247]">Stock</th>
                    <th className="px-5 py-3.5 text-left text-[11px] font-black uppercase tracking-[0.2em] text-[#7c6247]">Status</th>
                    <th className="px-5 py-3.5 text-right text-[11px] font-black uppercase tracking-[0.2em] text-[#7c6247]">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {vendorProducts.length === 0 ? (
                    <tr><td colSpan="6" className="px-5 py-10 text-center text-sm font-semibold text-[#6f6257]">No products for this vendor yet. Click "Add Product" to begin.</td></tr>
                  ) : vendorProducts.map((p, i) => (
                    <motion.tr key={p._id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} className="transition-all duration-300 hover:bg-white/20">
                      <td className="border-t border-[#d4bc99]/40 px-5 py-4">
                        <div className="flex items-center gap-3">
                          {p.image ? <img src={p.image} alt={p.name} className="h-8 w-8 rounded-lg object-cover border border-[#D4C39B]" /> : <div className="h-8 w-8 rounded-lg bg-[#F2EDE1] border border-[#D4C39B] flex items-center justify-center text-xs font-black text-[#8B5A00]">{p.name?.charAt(0)}</div>}
                          <span className="font-black text-[#2d2218]">{p.name}</span>
                        </div>
                      </td>
                      <td className="border-t border-[#d4bc99]/40 px-5 py-4"><span className="text-sm capitalize text-[#6f6257]">{p.category || '—'}</span></td>
                      <td className="border-t border-[#d4bc99]/40 px-5 py-4"><span className="text-sm font-black text-[#8B5A00]">{p.price?.toLocaleString()} ETB</span></td>
                      <td className="border-t border-[#d4bc99]/40 px-5 py-4"><span className={`text-sm font-semibold ${p.stockQuantity > 0 ? 'text-green-700' : 'text-red-500'}`}>{p.stockQuantity > 0 ? `${p.stockQuantity} in stock` : 'Out of stock'}</span></td>
                      <td className="border-t border-[#d4bc99]/40 px-5 py-4">
                        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-black capitalize ${p.active ? 'bg-green-100 text-green-700 border border-green-300' : 'bg-gray-100 text-gray-600 border border-gray-300'}`}>{p.active ? 'Active' : 'Inactive'}</span>
                      </td>
                      <td className="border-t border-[#d4bc99]/40 px-5 py-4 text-right">
                        <button onClick={() => openEditProduct(p)} className="text-xs font-black text-[#8B5A00] hover:underline mr-3">Edit</button>
                        <button onClick={() => handleDeleteProduct(p._id)} className="text-xs font-black text-red-500 hover:underline">Delete</button>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>

      {/* Vendor Modal — redesigned: two-column on desktop, no internal scroll */}
      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={() => setShowModal(false)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className={`w-full max-w-3xl ${cardElevated}`} onClick={e => e.stopPropagation()}>
              {/* Header */}
              <div className="flex items-center justify-between px-8 pt-8 pb-4">
                <div>
                  <h3 className="text-2xl font-black text-[#2d2218]">{editVendor ? 'Edit Vendor' : 'Add Vendor'}</h3>
                  <p className="text-sm text-[#6f6257] mt-1">Add a new fulfillment partner to the platform.</p>
                </div>
                <button onClick={() => setShowModal(false)} className="p-2 rounded-xl hover:bg-[#D4C39B]/40 transition"><X size={18} /></button>
              </div>

              <form onSubmit={handleSaveVendor}>
                <div className="px-8 pb-6 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
                  {/* Vendor Information */}
                  <div className="md:col-span-2">
                    <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#8B5A00] mb-3">Vendor Information</p>
                    <div className="h-px bg-[#D4C39B]/40 mb-4"></div>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[#6f6257]">Vendor Name *</label>
                    <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required className={inputClass} placeholder="e.g. Jiji Ethiopia" />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[#6f6257]">Description</label>
                    <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows="3" className={`${inputClass} resize-none`} placeholder="Describe the vendor's offerings..." />
                  </div>
                  <div className="md:col-span-2">
                    <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[#6f6257]">Logo</label>
                    <div className="flex items-center gap-3">
                      {form.logo && <img src={form.logo} alt="preview" className="h-12 w-12 rounded-xl object-cover border border-[#D4C39B]" />}
                      <label className={`flex-1 flex items-center justify-center gap-2 ${inputClass} cursor-pointer hover:bg-white/80`}>
                        <Upload size={16} />
                        <span className="text-[#6f6257]">{uploading ? 'Uploading...' : 'Upload Logo'}</span>
                        <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                      </label>
                    </div>
                  </div>

                  {/* Contact Information */}
                  <div className="md:col-span-2 mt-2">
                    <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#8B5A00] mb-3">Contact Information</p>
                    <div className="h-px bg-[#D4C39B]/40 mb-4"></div>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[#6f6257]">Contact Name</label>
                    <input value={form.contactName || ''} onChange={e => setForm(p => ({ ...p, contactName: e.target.value }))} className={inputClass} placeholder="John Smith" />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[#6f6257]">Email</label>
                    <input value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} type="email" className={inputClass} placeholder="vendor@example.com" />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[#6f6257]">Phone</label>
                    <input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} className={inputClass} placeholder="+251 91..." />
                  </div>

                  {/* Business Information */}
                  <div className="md:col-span-2 mt-2">
                    <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#8B5A00] mb-3">Business Information</p>
                    <div className="h-px bg-[#D4C39B]/40 mb-4"></div>
                  </div>
                  <div className="md:col-span-2">
                    <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[#6f6257]">Address</label>
                    <input value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} className={inputClass} placeholder="Bole, Addis Ababa" />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[#6f6257]">Website</label>
                    <input value={form.website || ''} onChange={e => setForm(p => ({ ...p, website: e.target.value }))} className={inputClass} placeholder="https://vendor.com" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[#6f6257]">Category</label>
                      <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} className={inputClass}>
                        <option value="gift">Gift</option>
                        <option value="service">Service</option>
                        <option value="experience">Experience</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[#6f6257]">Status</label>
                      <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))} className={inputClass}>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="suspended">Suspended</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="px-8 pb-8 pt-4 border-t border-[#D4C39B]/40 flex gap-3 justify-end">
                  <button type="button" onClick={() => setShowModal(false)} className="rounded-2xl border-2 border-[#dcc6a7] bg-white/50 px-6 py-3 text-sm font-bold text-[#6f6257] transition-all duration-300 hover:border-red-300 hover:bg-red-50 hover:text-red-600">Cancel</button>
                  <button type="submit" disabled={submitting || !form.name} className={`rounded-2xl ${goldGradient} px-8 py-3 text-sm font-black text-white shadow-lg shadow-[#8B5A00]/20 transition-all duration-300 hover:brightness-110 disabled:opacity-50`}>
                    {submitting ? 'Saving...' : editVendor ? 'Update Vendor' : 'Save Vendor'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Product Modal */}
      <AnimatePresence>
        {showProductModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={() => setShowProductModal(false)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className={`w-full max-w-lg ${glassCard} p-6 max-h-[90vh] overflow-y-auto`} onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-black text-[#2d2218]">{editProduct ? 'Edit Product' : 'Add Product'}</h3>
                <button onClick={() => setShowProductModal(false)} className="p-2 rounded-xl hover:bg-[#D4C39B]/40"><X size={18} /></button>
              </div>
              <form onSubmit={handleSaveProduct} className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#6f6257]">Product Name *</label>
                  <input value={productForm.name} onChange={e => setProductForm(p => ({ ...p, name: e.target.value }))} required className={inputClass} placeholder='e.g. Samsung 55" TV' />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#6f6257]">Description</label>
                  <textarea value={productForm.description} onChange={e => setProductForm(p => ({ ...p, description: e.target.value }))} rows="3" className={inputClass} placeholder="Product description..." />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-[#6f6257]">Price (ETB) *</label>
                    <input value={productForm.price} onChange={e => setProductForm(p => ({ ...p, price: e.target.value }))} type="number" required className={inputClass} placeholder="15000" />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-[#6f6257]">Stock Quantity</label>
                    <input value={productForm.stockQuantity} onChange={e => setProductForm(p => ({ ...p, stockQuantity: e.target.value }))} type="number" className={inputClass} placeholder="10" />
                  </div>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#6f6257]">Category</label>
                  <input value={productForm.category} onChange={e => setProductForm(p => ({ ...p, category: e.target.value }))} className={inputClass} placeholder="e.g. Electronics, Furniture" />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#6f6257]">Product Image</label>
                  <div className="flex items-center gap-3">
                    {productForm.image && <img src={productForm.image} alt="preview" className="h-10 w-10 rounded-lg object-cover border border-[#D4C39B]" />}
                    <label className={`flex-1 flex items-center justify-center gap-2 ${inputClass} cursor-pointer`}>
                      <Upload size={16} />
                      <span className="text-[#6f6257]">{uploading ? 'Uploading...' : 'Upload Image'}</span>
                      <input type="file" accept="image/*" onChange={handleProductImageUpload} className="hidden" />
                    </label>
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="submit" disabled={submitting || !productForm.name || !productForm.price} className={`flex-1 rounded-2xl ${goldGradient} px-5 py-3.5 text-sm font-black text-white shadow-lg disabled:opacity-50`}>
                    {submitting ? 'Saving...' : editProduct ? 'Update Product' : 'Add Product'}
                  </button>
                  <button type="button" onClick={() => setShowProductModal(false)} className="rounded-2xl border-2 border-[#dcc6a7] bg-white/50 px-5 py-3.5 text-sm font-bold text-[#6f6257]">Cancel</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminVendors;
