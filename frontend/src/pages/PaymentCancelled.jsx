// frontend/src/pages/PaymentCancelled.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';

const PaymentCancelled = () => {
  const navigate = useNavigate();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center">
        <div className="mb-6">
          <div className="mx-auto w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        </div>
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Payment Cancelled</h1>
        <p className="text-xl text-gray-600 mb-8">
          You cancelled the payment. Your appointment is not yet confirmed.
        </p>
        <div className="space-x-4">
          <button onClick={() => navigate('/booking')} className="bg-pink-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-pink-700">
            Try Again
          </button>
          <button onClick={() => navigate('/')} className="bg-gray-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-gray-700">
            Return to Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentCancelled;