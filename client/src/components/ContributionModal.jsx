import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { contributeToGift, uploadImage } from '../api/api.js';

const ContributionModal = ({ gift, isOpen, onClose }) => {
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [screenshotFile, setScreenshotFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  if (!isOpen || !gift) return null;

  const handleSubmit = async () => {
    if (!amount || Number(amount) <= 0) {
      setError('Please enter a valid contribution amount.');
      return;
    }

    if ((paymentMethod === 'telebirr' || paymentMethod === 'bank_transfer') && !screenshotFile) {
      setError('Please upload a payment screenshot for manual payments.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      let screenshotUrl = '';
      if (screenshotFile) {
        const uploadRes = await uploadImage(screenshotFile);
        screenshotUrl = uploadRes.url;
      }

      const response = await contributeToGift(gift._id, Number(amount), {
        guestName,
        guestPhone,
        paymentMethod,
        screenshotUrl,
      });

      // Handle Stripe flow for card payments
      if (paymentMethod === 'card' && response.clientSecret) {
        // Here you would typically use the Stripe library to confirm the payment:
        // const result = await stripe.confirmCardPayment(response.clientSecret);
        // if (result.error) throw new Error(result.error.message);
        console.log('Stripe flow initiated with:', response.clientSecret);
      }

      navigate('/thank-you', { state: { gift: response.data?.gift || gift } });
    } catch (apiError) {
      setError(apiError.response?.data?.message || 'Unable to submit contribution. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-xl rounded-[2rem] bg-white p-8 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-primary-dark">Contribute to {gift.name}</h2>
            <p className="mt-2 text-sm text-secondary">Lazy auth keeps guests moving without a full signup.</p>
          </div>
          <button onClick={onClose} className="text-secondary transition hover:text-primary">
            Close
          </button>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <label className="space-y-2 text-sm text-secondary">
            Guest name
            <input
              type="text"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              placeholder="Alemu Worku"
              className="w-full rounded-2xl border border-gray-300 px-4 py-3 focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </label>
          <label className="space-y-2 text-sm text-secondary">
            Phone number
            <input
              type="tel"
              value={guestPhone}
              onChange={(e) => setGuestPhone(e.target.value)}
              placeholder="09XXXXXXXX"
              className="w-full rounded-2xl border border-gray-300 px-4 py-3 focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </label>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="space-y-2 text-sm text-secondary">
            Contribution amount
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="ETB 250"
              className="w-full rounded-2xl border border-gray-300 px-4 py-3 focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </label>
          <label className="space-y-2 text-sm text-secondary">
            Payment method
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full rounded-2xl border border-gray-300 px-4 py-3 focus:border-primary focus:ring-2 focus:ring-primary/20"
            >
              <option value="card">Card</option>
              <option value="telebirr">TeleBirr</option>
              <option value="bank_transfer">Bank transfer</option>
            </select>
          </label>
        </div>

        {(paymentMethod === 'telebirr' || paymentMethod === 'bank_transfer') && (
          <div className="mt-4">
            <label className="block text-sm font-medium text-secondary mb-2">Payment Screenshot</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setScreenshotFile(e.target.files[0])}
              className="w-full rounded-2xl border border-gray-300 px-4 py-3 focus:border-primary focus:ring-2 focus:ring-primary/20"
              required
            />
          </div>
        )}

        {error && <p className="mt-4 rounded-2xl bg-red-50 p-4 text-sm text-red-700">{error}</p>}

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
          <button
            onClick={onClose}
            className="rounded-full border border-gray-300 px-6 py-3 text-sm text-secondary transition hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="btn-primary w-full disabled:cursor-not-allowed disabled:bg-gray-300"
          >
            {loading ? 'Submitting...' : 'Continue with guest info'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ContributionModal;