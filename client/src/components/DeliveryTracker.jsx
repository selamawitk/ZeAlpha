import { useState } from 'react';
import { motion } from 'framer-motion';
import { Package, Truck, MapPin, CheckCircle, Clock, XCircle, Edit3 } from 'lucide-react';
import { updateGiftDelivery } from '../api/api.js';

const goldGradient = 'bg-gradient-to-r from-[#B8860B] via-[#A0700A] to-[#8B5A00]';

const deliveryStatuses = [
  { value: 'not_shipped', label: 'Not Shipped', icon: Package, color: 'text-gray-400', bg: 'bg-gray-100' },
  { value: 'processing', label: 'Processing', icon: Clock, color: 'text-blue-500', bg: 'bg-blue-100' },
  { value: 'shipped', label: 'Shipped', icon: Truck, color: 'text-amber-500', bg: 'bg-amber-100' },
  { value: 'in_transit', label: 'In Transit', icon: MapPin, color: 'text-purple-500', bg: 'bg-purple-100' },
  { value: 'delivered', label: 'Delivered', icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-100' },
  { value: 'cancelled', label: 'Cancelled', icon: XCircle, color: 'text-red-500', bg: 'bg-red-100' },
];

const DeliveryTracker = ({ gift, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [deliveryStatus, setDeliveryStatus] = useState(gift.deliveryStatus || 'not_shipped');
  const [deliveryTrackingNumber, setDeliveryTrackingNumber] = useState(gift.deliveryTrackingNumber || '');
  const [deliveryProvider, setDeliveryProvider] = useState(gift.deliveryProvider || '');
  const [deliveryEstimatedDate, setDeliveryEstimatedDate] = useState(
    gift.deliveryEstimatedDate ? gift.deliveryEstimatedDate.split('T')[0] : ''
  );
  const [deliveryAddress, setDeliveryAddress] = useState(gift.deliveryAddress || '');
  const [deliveryNotes, setDeliveryNotes] = useState(gift.deliveryNotes || '');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const currentStatus = deliveryStatuses.find(s => s.value === deliveryStatus) || deliveryStatuses[0];
  const StatusIcon = currentStatus.icon;

  const handleSave = async () => {
    setLoading(true);
    setMessage('');
    try {
      const updated = await updateGiftDelivery(gift._id, {
        deliveryStatus,
        deliveryTrackingNumber,
        deliveryProvider,
        deliveryEstimatedDate: deliveryEstimatedDate || null,
        deliveryAddress,
        deliveryNotes,
      });
      if (onUpdate) onUpdate(updated);
      setIsEditing(false);
      setMessage('Delivery info updated!');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage('Failed to update: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  if (!isEditing) {
    return (
      <div className="rounded-2xl border border-[#D4C39B] bg-white/60 p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-xl ${currentStatus.bg}`}>
              <StatusIcon className={`h-5 w-5 ${currentStatus.color}`} />
            </div>
            <div>
              <p className="text-sm font-bold text-[#2d2218]">{gift.name}</p>
              <p className={`text-xs font-semibold ${currentStatus.color}`}>{currentStatus.label}</p>
            </div>
          </div>
          <button
            onClick={() => setIsEditing(true)}
            className="p-2 rounded-xl hover:bg-white/60 transition text-[#6f6257] hover:text-[#2d2218]"
          >
            <Edit3 className="h-4 w-4" />
          </button>
        </div>

        {gift.deliveryTrackingNumber && (
          <div className="text-xs text-[#6f6257]">
            <span className="font-semibold">Tracking:</span> {gift.deliveryTrackingNumber}
            {gift.deliveryProvider && ` (${gift.deliveryProvider})`}
          </div>
        )}
        {gift.deliveryEstimatedDate && (
          <div className="text-xs text-[#6f6257] mt-1">
            <span className="font-semibold">Est. delivery:</span>{' '}
            {new Date(gift.deliveryEstimatedDate).toLocaleDateString()}
          </div>
        )}
        {gift.deliveryAddress && (
          <div className="text-xs text-[#6f6257] mt-1 truncate">
            <span className="font-semibold">Address:</span> {gift.deliveryAddress}
          </div>
        )}
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      className="rounded-2xl border border-[#D4C39B] bg-white/80 p-5 space-y-3"
    >
      <p className="text-sm font-bold text-[#2d2218]">Delivery — {gift.name}</p>

      <label className="block text-xs font-semibold text-[#6f6257]">
        Status
        <select
          value={deliveryStatus}
          onChange={(e) => setDeliveryStatus(e.target.value)}
          className="mt-1 w-full rounded-xl border border-[#e5d7c4] bg-white px-3 py-2 text-sm outline-none focus:border-[#B8860B]"
        >
          {deliveryStatuses.map(s => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      </label>

      <div className="grid grid-cols-2 gap-3">
        <label className="block text-xs font-semibold text-[#6f6257]">
          Tracking #
          <input value={deliveryTrackingNumber} onChange={e => setDeliveryTrackingNumber(e.target.value)}
            className="mt-1 w-full rounded-xl border border-[#e5d7c4] bg-white px-3 py-2 text-sm outline-none focus:border-[#B8860B]" />
        </label>
        <label className="block text-xs font-semibold text-[#6f6257]">
          Provider
          <input value={deliveryProvider} onChange={e => setDeliveryProvider(e.target.value)}
            className="mt-1 w-full rounded-xl border border-[#e5d7c4] bg-white px-3 py-2 text-sm outline-none focus:border-[#B8860B]" />
        </label>
      </div>

      <label className="block text-xs font-semibold text-[#6f6257]">
        Est. delivery date
        <input type="date" value={deliveryEstimatedDate} onChange={e => setDeliveryEstimatedDate(e.target.value)}
          className="mt-1 w-full rounded-xl border border-[#e5d7c4] bg-white px-3 py-2 text-sm outline-none focus:border-[#B8860B]" />
      </label>

      <label className="block text-xs font-semibold text-[#6f6257]">
        Delivery address
        <textarea value={deliveryAddress} onChange={e => setDeliveryAddress(e.target.value)} rows={2}
          className="mt-1 w-full rounded-xl border border-[#e5d7c4] bg-white px-3 py-2 text-sm outline-none focus:border-[#B8860B]" />
      </label>

      <label className="block text-xs font-semibold text-[#6f6257]">
        Notes
        <textarea value={deliveryNotes} onChange={e => setDeliveryNotes(e.target.value)} rows={2}
          className="mt-1 w-full rounded-xl border border-[#e5d7c4] bg-white px-3 py-2 text-sm outline-none focus:border-[#B8860B]" />
      </label>

      {message && (
        <p className={`text-xs font-semibold ${message.includes('Failed') ? 'text-red-600' : 'text-green-600'}`}>
          {message}
        </p>
      )}

      <div className="flex gap-2 pt-1">
        <button onClick={() => setIsEditing(false)}
          className="rounded-xl border border-[#dcc6a7] bg-white/60 px-4 py-2 text-xs font-bold text-[#6f6257] hover:bg-white">
          Cancel
        </button>
        <button onClick={handleSave} disabled={loading}
          className={`rounded-xl ${goldGradient} px-4 py-2 text-xs font-bold text-white shadow-md disabled:opacity-60`}>
          {loading ? 'Saving...' : 'Save'}
        </button>
      </div>
    </motion.div>
  );
};

export default DeliveryTracker;