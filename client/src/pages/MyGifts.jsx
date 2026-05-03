import { useEffect, useState } from 'react';
import { Heart } from 'lucide-react';
import { Link } from 'react-router-dom';

const MyGifts = () => {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const existing = JSON.parse(localStorage.getItem('guestContributions') || '[]');
    setHistory(existing);
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <div className="grid gap-8 lg:grid-cols-[1.3fr_0.7fr]">
        <div className="rounded-2xl bg-white p-10 shadow-xl shadow-dark/5 border border-primary/5">
          <h1 className="text-3xl font-semibold text-primary-dark">My Gifts</h1>
          <p className="mt-3 text-sm text-secondary">A guest-friendly summary of your contribution flow and payment history.</p>

          {history.length === 0 ? (
            <div className="mt-8 flex flex-col items-center justify-center rounded-2xl bg-white p-10 shadow-xl shadow-dark/5 border border-primary/5 text-center text-secondary">
              <Heart className="mx-auto h-12 w-12 text-primary" />
              <p className="mt-6 text-lg font-semibold text-primary-dark">No contributions yet</p>
              <p className="mt-3 max-w-md text-sm">
                Browse a registry and support a couple with lazy auth.
              </p>
            </div>
          ) : (
            <div className="mt-8 space-y-4">
              {history.map((item, index) => (
                <div key={index} className="rounded-3xl border border-gray-200 p-5">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-semibold text-primary-dark">{item.giftName}</p>
                      <p className="text-sm text-secondary">{item.guestName || 'Guest'} • {item.paymentMethod}</p>
                    </div>
                    <p className="text-lg font-semibold text-primary">ETB {item.amount}</p>
                  </div>
                  <p className="mt-3 text-sm text-secondary">{item.message || 'Thanks for your support!'}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <aside className="rounded-[2rem] bg-[#FFF8E8] p-8 shadow-premium">
          <h2 className="text-xl font-semibold text-primary-dark">Lazy Auth</h2>
          <p className="mt-3 text-sm text-secondary">Capture guest details gently and let contributions flow without a hard signup wall.</p>
          <Link
            to="/auth"
            className="btn-primary mt-6 inline-flex"
          >
            Manage contributions
          </Link>
        </aside>
      </div>
    </div>
  );
};

export default MyGifts;
