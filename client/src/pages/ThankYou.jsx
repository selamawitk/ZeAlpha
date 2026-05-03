import { Link } from 'react-router-dom';

const ThankYou = () => {
  return (
    <div className="container mx-auto px-4 py-20">
      <div className="mx-auto max-w-3xl rounded-[2rem] bg-white p-10 text-center shadow-premium">
        <p className="text-sm uppercase tracking-[0.3em] text-secondary">Thank You</p>
        <h1 className="mt-6 text-4xl font-semibold text-primary-dark">Your contribution is confirmed</h1>
        <p className="mt-4 text-base text-secondary">We’ve forwarded your support to the couple’s registry. They’ll be notified immediately.</p>
        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <Link to="/" className="btn-primary inline-flex">
            Back to Home
          </Link>
          <Link to="/my-gifts" className="rounded-full border border-primary px-6 py-3 text-sm font-semibold text-primary hover:bg-primary/10">
            View My Gifts
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ThankYou;
