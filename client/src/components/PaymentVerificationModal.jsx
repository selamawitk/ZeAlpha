import React from 'react';

const PaymentVerificationModal = ({ contribution, onClose, onApprove }) => {
  if (!contribution) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div 
        className="relative w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-[2.5rem] bg-white shadow-2xl flex flex-col md:flex-row"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Left Side: Receipt Image */}
        <div className="w-full md:w-3/5 bg-gray-100 flex items-center justify-center overflow-hidden border-b md:border-b-0 md:border-r border-gray-100">
          {contribution.screenshotUrl ? (
            <img 
              src={contribution.screenshotUrl} 
              alt="Payment Receipt" 
              className="h-full w-full object-contain hover:scale-105 transition-transform duration-500 cursor-zoom-in"
              onClick={() => window.open(contribution.screenshotUrl, '_blank')}
            />
          ) : (
            <div className="text-secondary italic">No receipt image provided</div>
          )}
        </div>

        {/* Right Side: Details & Actions */}
        <div className="w-full md:w-2/5 p-8 flex flex-col justify-between bg-white">
          <div>
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-2xl font-bold text-primary-dark">Verify Payment</h2>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-full transition"
              >
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div className="pb-4 border-b border-gray-50">
                <label className="text-[10px] font-bold uppercase tracking-wider text-secondary">Contributor</label>
                <p className="text-lg font-semibold text-primary-dark">{contribution.guestId?.name}</p>
                <p className="text-sm text-secondary">{contribution.guestId?.email}</p>
              </div>

              <div className="pb-4 border-b border-gray-50">
                <label className="text-[10px] font-bold uppercase tracking-wider text-secondary">Gift Details</label>
                <p className="text-sm font-medium text-primary-dark">{contribution.giftId?.name}</p>
                <p className="text-sm text-primary font-bold">{contribution.amount} ETB</p>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-secondary">Method & ID</label>
                <p className="text-sm font-medium text-primary-dark capitalize">{contribution.paymentMethod}</p>
                <p className="text-xs text-secondary break-all">Ref: {contribution.transactionId || 'N/A'}</p>
              </div>

              {contribution.message && (
                <div className="mt-4 p-3 bg-gray-50 rounded-2xl italic text-sm text-gray-600">
                  "{contribution.message}"
                </div>
              )}
            </div>
          </div>

          <div className="mt-8 flex gap-3">
            <button
              onClick={onApprove}
              className="flex-1 rounded-2xl bg-primary py-4 text-sm font-bold text-white shadow-lg shadow-primary/20 hover:bg-primary-dark transition"
            >
              Approve Payment
            </button>
            <button
              onClick={onClose}
              className="flex-1 rounded-2xl bg-gray-100 py-4 text-sm font-bold text-gray-600 hover:bg-gray-200 transition"
            >
              Reject
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentVerificationModal;