import { useState } from 'react';
import { X } from 'lucide-react';
import api from '../api/api.js';

const goldGradient = 'bg-gradient-to-r from-[#B8860B] via-[#A0700A] to-[#8B5A00]';

const ContributionModal = ({ gift, isOpen, onClose }) => {
  const [amount, setAmount] = useState('');
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !gift) return null;

  const handleStripeCheckout = async () => {
    const { data } = await api.post('/payments/create-checkout-session', {
      giftId: gift._id,
      giftName: gift.name,
      amount: Number(amount),
      currency: 'usd',
      guestName: guestName.trim(),
      guestPhone: guestPhone.trim(),
      message: message.trim(),
    });
    window.location.href = data.url;
  };

  const handleSubmit = async () => {
    if (!amount || Number(amount) <= 0) {
      setError('Please enter a valid contribution amount.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await handleStripeCheckout();
    } catch (apiError) {
      setError(apiError.response?.data?.message || apiError.message || 'Unable to process payment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-xl rounded-[28px] border border-[#dec8ab] bg-gradient-to-br from-[#f5ecde]/95 via-[#ead9c0]/92 to-[#d8b78f]/90 p-8 shadow-[0_16px_40px_rgba(90,60,20,0.12)] backdrop-blur-xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-[#2d2218]">Contribute to {gift.name}</h2>
            <p className="mt-2 text-sm text-[#6f6257]">Support the couple with a contribution.</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/60 transition text-[#6f6257] hover:text-[#2d2218]">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <label className="space-y-2 text-sm font-semibold text-[#6f6257]">
            Guest name
            <input
              type="text"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              placeholder="Alemu Worku"
              className="w-full rounded-2xl border border-[#e5d7c4] bg-white/65 px-4 py-3 text-sm outline-none transition-all focus:border-[#B8860B] focus:ring-4 focus:ring-[#B8860B]/10"
            />
          </label>
          <label className="space-y-2 text-sm font-semibold text-[#6f6257]">
            Phone number
            <input
              type="tel"
              value={guestPhone}
              onChange={(e) => setGuestPhone(e.target.value)}
              placeholder="09XXXXXXXX"
              className="w-full rounded-2xl border border-[#e5d7c4] bg-white/65 px-4 py-3 text-sm outline-none transition-all focus:border-[#B8860B] focus:ring-4 focus:ring-[#B8860B]/10"
            />
          </label>
        </div>

        <div className="mt-4 space-y-2">
          <label className="space-y-2 text-sm font-semibold text-[#6f6257]">
            Message (optional)
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Congratulations! Wishing you all the best..."
              rows={2}
              maxLength={500}
              className="w-full rounded-2xl border border-[#e5d7c4] bg-white/65 px-4 py-3 text-sm outline-none transition-all focus:border-[#B8860B] focus:ring-4 focus:ring-[#B8860B]/10"
            />
          </label>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="space-y-2 text-sm font-semibold text-[#6f6257]">
            Contribution amount (ETB)
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="250"
              min="1"
              max={gift.totalPrice - gift.currentCollected}
              className="w-full rounded-2xl border border-[#e5d7c4] bg-white/65 px-4 py-3 text-sm outline-none transition-all focus:border-[#B8860B] focus:ring-4 focus:ring-[#B8860B]/10"
            />
          </label>
          <div className="rounded-2xl border border-[#CFA97A] bg-[#B8860B]/5 p-4 flex items-center justify-center">
            <p className="text-sm text-[#6f6257]">Secure payment via <strong>Stripe</strong></p>
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-[#CFA97A] bg-[#B8860B]/5 p-4">
          <p className="text-sm text-[#6f6257]">
            You will be redirected to Stripe's secure checkout page to complete your payment. Your card details are handled securely by Stripe.
          </p>
        </div>

        {error && <p className="mt-4 rounded-2xl bg-red-50 border border-red-200 p-4 text-sm text-red-700">{error}</p>}

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
          <button
            onClick={onClose}
            className="rounded-2xl border-2 border-[#dcc6a7] bg-white/50 px-6 py-3 text-sm font-bold text-[#6f6257] transition-all duration-300 hover:border-red-300 hover:bg-red-50 hover:text-red-600"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className={`rounded-2xl ${goldGradient} px-6 py-3 text-sm font-black text-white shadow-lg shadow-[#8B5A00]/20 transition-all duration-300 hover:brightness-110 disabled:opacity-60`}
          >
            {loading ? 'Redirecting to Stripe...' : 'Continue with Card'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ContributionModal;