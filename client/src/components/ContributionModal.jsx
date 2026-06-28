import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Smartphone, CreditCard, Building2 } from 'lucide-react';
import { contributeToGift, uploadImage, initiateTelebirrPayment } from '../api/api.js';
import api from '../api/api.js';

const goldGradient = 'bg-gradient-to-r from-[#B8860B] via-[#A0700A] to-[#8B5A00]';

const ContributionModal = ({ gift, isOpen, onClose }) => {
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('stripe');
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [message, setMessage] = useState('');
  const [screenshotFile, setScreenshotFile] = useState(null);
  const [telebirrPhone, setTelebirrPhone] = useState('');
  const [telebirrTransactionId, setTelebirrTransactionId] = useState('');
  const [telebirrInfo, setTelebirrInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  if (!isOpen || !gift) return null;

  const handleStripeCheckout = async () => {
    const { data } = await api.post('/payments/create-checkout-session', {
      giftId: gift._id,
      giftName: gift.name,
      amount: Number(amount),
      currency: 'usd',
    });
    window.location.href = data.url;
  };

  const handleTelebirrInitiate = async () => {
    if (!telebirrPhone || telebirrPhone.length < 10) {
      setError('Please enter a valid phone number for Telebirr payment.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const data = await initiateTelebirrPayment(gift._id, Number(amount), telebirrPhone, gift.name);
      setTelebirrInfo(data.telebirrInfo);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to initiate Telebirr payment.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!amount || Number(amount) <= 0) {
      setError('Please enter a valid contribution amount.');
      return;
    }

    if (paymentMethod === 'bank_transfer' && !screenshotFile) {
      setError('Please upload a payment screenshot for manual payments.');
      return;
    }

    if (paymentMethod === 'telebirr' && (!telebirrTransactionId || !telebirrInfo)) {
      setError('Please complete the Telebirr payment and enter the transaction reference.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (paymentMethod === 'stripe') {
        await handleStripeCheckout();
        return;
      }

      let screenshotUrl = '';
      if (screenshotFile) {
        const uploadRes = await uploadImage(screenshotFile);
        screenshotUrl = uploadRes.url;
      }

      const response = await contributeToGift(gift._id, Number(amount), {
        paymentMethod,
        guestName,
        guestPhone: guestPhone || telebirrPhone,
        message,
        screenshotUrl,
        transactionId: paymentMethod === 'telebirr' ? telebirrTransactionId : '',
      });

      const existing = JSON.parse(localStorage.getItem('guestContributions') || '[]');
      existing.push({
        giftName: gift.name,
        amount: Number(amount),
        paymentMethod,
        guestName,
        message,
        timestamp: new Date().toISOString()
      });
      localStorage.setItem('guestContributions', JSON.stringify(existing));

      navigate('/thank-you', { state: { gift: response.gift || gift } });
    } catch (apiError) {
      setError(apiError.response?.data?.message || apiError.message || 'Unable to submit contribution. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const paymentMethods = [
    { value: 'stripe', label: 'Card (Stripe)', icon: CreditCard },
    { value: 'telebirr', label: 'Telebirr', icon: Smartphone },
    { value: 'bank_transfer', label: 'Bank Transfer', icon: Building2 },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-xl rounded-[28px] border border-[#dec8ab] bg-gradient-to-br from-[#f5ecde]/95 via-[#ead9c0]/92 to-[#d8b78f]/90 p-8 shadow-[0_16px_40px_rgba(90,60,20,0.12)] backdrop-blur-xl overflow-y-auto max-h-[90vh]">
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
              onChange={(e) => { setAmount(e.target.value); setTelebirrInfo(null); }}
              placeholder="250"
              min="1"
              max={gift.totalPrice - gift.currentCollected}
              className="w-full rounded-2xl border border-[#e5d7c4] bg-white/65 px-4 py-3 text-sm outline-none transition-all focus:border-[#B8860B] focus:ring-4 focus:ring-[#B8860B]/10"
            />
          </label>
          <label className="space-y-2 text-sm font-semibold text-[#6f6257]">
            Payment method
            <div className="grid grid-cols-3 gap-2">
              {paymentMethods.map(pm => {
                const Icon = pm.icon;
                const isActive = paymentMethod === pm.value;
                return (
                  <button
                    key={pm.value}
                    type="button"
                    onClick={() => { setPaymentMethod(pm.value); setTelebirrInfo(null); }}
                    className={`flex flex-col items-center gap-1 rounded-xl border-2 p-2.5 text-xs font-bold transition-all ${
                      isActive
                        ? 'border-[#B8860B] bg-[#B8860B]/10 text-[#8B5A00]'
                        : 'border-[#e5d7c4] bg-white/50 text-[#6f6257] hover:bg-white/80'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {pm.label.split(' ')[0]}
                  </button>
                );
              })}
            </div>
          </label>
        </div>

        {paymentMethod === 'stripe' && (
          <div className="mt-4 rounded-2xl border border-[#CFA97A] bg-[#B8860B]/5 p-4">
            <p className="text-sm text-[#6f6257]">
              You will be redirected to Stripe's secure checkout page to complete your payment. Your card details are handled securely by Stripe.
            </p>
          </div>
        )}

        {paymentMethod === 'telebirr' && !telebirrInfo && (
          <div className="mt-4 space-y-3">
            <label className="block text-sm font-semibold text-[#6f6257]">
              Your Telebirr phone number
              <input
                type="tel"
                value={telebirrPhone}
                onChange={(e) => setTelebirrPhone(e.target.value)}
                placeholder="09XXXXXXXX"
                className="mt-1 w-full rounded-2xl border border-[#e5d7c4] bg-white/65 px-4 py-3 text-sm outline-none transition-all focus:border-[#B8860B] focus:ring-4 focus:ring-[#B8860B]/10"
              />
            </label>
            <button
              onClick={handleTelebirrInitiate}
              disabled={loading}
              className={`w-full rounded-2xl ${goldGradient} px-4 py-3 text-sm font-black text-white shadow-lg shadow-[#8B5A00]/20 transition-all duration-300 hover:brightness-110 disabled:opacity-60`}
            >
              {loading ? 'Initiating...' : 'Get Payment Details'}
            </button>
          </div>
        )}

        {telebirrInfo && (
          <div className="mt-4 space-y-3">
            <div className="rounded-2xl border border-[#CFA97A] bg-[#B8860B]/5 p-4 space-y-2">
              <p className="text-sm font-bold text-[#2d2218]">Send payment via Telebirr</p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <span className="text-[#6f6257]">Merchant:</span>
                <span className="font-bold text-[#2d2218] text-right">{telebirrInfo.merchantName}</span>
                <span className="text-[#6f6257]">Account:</span>
                <span className="font-bold text-[#2d2218] text-right">{telebirrInfo.accountName}</span>
                <span className="text-[#6f6257]">Phone:</span>
                <span className="font-bold text-[#8B5A00] text-right">{telebirrInfo.merchantPhone}</span>
                <span className="text-[#6f6257]">Amount:</span>
                <span className="font-bold text-[#8B5A00] text-right">{telebirrInfo.amount} ETB</span>
                <span className="text-[#6f6257]">Reference:</span>
                <span className="font-mono text-xs text-[#2d2218] text-right">{telebirrInfo.reference}</span>
              </div>
            </div>
            <label className="block text-sm font-semibold text-[#6f6257]">
              Telebirr transaction reference
              <input
                type="text"
                value={telebirrTransactionId}
                onChange={(e) => setTelebirrTransactionId(e.target.value)}
                placeholder="Enter the transaction ID from Telebirr"
                className="mt-1 w-full rounded-2xl border border-[#e5d7c4] bg-white/65 px-4 py-3 text-sm outline-none transition-all focus:border-[#B8860B] focus:ring-4 focus:ring-[#B8860B]/10"
              />
            </label>
          </div>
        )}

        {paymentMethod === 'bank_transfer' && (
          <div className="mt-4">
            <label className="block text-sm font-semibold text-[#6f6257] mb-2">Payment Screenshot</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setScreenshotFile(e.target.files[0])}
              className="w-full rounded-2xl border border-[#e5d7c4] bg-white/65 px-4 py-3 text-sm text-[#6f6257] outline-none transition-all focus:border-[#B8860B] focus:ring-4 focus:ring-[#B8860B]/10"
              required
            />
          </div>
        )}

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
            disabled={loading || (paymentMethod === 'telebirr' && !telebirrInfo)}
            className={`rounded-2xl ${goldGradient} px-6 py-3 text-sm font-black text-white shadow-lg shadow-[#8B5A00]/20 transition-all duration-300 hover:brightness-110 disabled:opacity-60`}
          >
            {loading ? 'Submitting...' : 'Continue with contribution'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ContributionModal;