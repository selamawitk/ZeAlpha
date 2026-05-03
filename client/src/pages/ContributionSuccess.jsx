import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const ContributionSuccess = () => {
  const location = useLocation();
  const gift = location.state?.gift;

  return (
    <div className="min-h-screen bg-ivory py-16">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-3xl rounded-3xl bg-white p-10 shadow-premium text-center">
          <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 mb-6">
            <span className="text-3xl">🎉</span>
          </div>
          <h1 className="text-4xl font-bold text-primary-dark mb-4">Thank you for your contribution!</h1>
          <p className="text-secondary mb-8">
            Your gift makes the registry experience more meaningful. We’ve recorded your contribution and will notify the couple.
          </p>
          {gift ? (
            <div className="rounded-3xl border border-gray-200 bg-gray-50 p-6 text-left">
              <h2 className="text-2xl font-semibold text-primary-dark mb-3">Gift summary</h2>
              <p className="text-secondary mb-2">Gift: <span className="font-medium text-primary-dark">{gift.name}</span></p>
              <p className="text-secondary mb-2">Amount: <span className="font-medium text-primary-dark">{gift.currentCollected} ETB</span></p>
              <p className="text-secondary mb-2">Status: <span className="font-medium text-primary-dark">{gift.status}</span></p>
              {gift.digitalCardUrl && (
                <p className="text-secondary">
                  View your digital card <Link to={gift.digitalCardUrl} className="text-primary underline">here</Link>.
                </p>
              )}
            </div>
          ) : (
            <p className="text-secondary mb-6">If you’d like, return to the registry and browse more gifts.</p>
          )}
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link to="/" className="btn-primary inline-flex">
              Back to Home
            </Link>
            <Link to="/dashboard" className="rounded-full border border-primary px-6 py-3 text-primary hover:bg-primary/10">
              Couple Dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContributionSuccess;
