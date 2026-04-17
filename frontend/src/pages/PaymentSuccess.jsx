// frontend/src/pages/PaymentSuccess.jsx
import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { appointmentsAPI } from '../utils/api';

const PaymentSuccess = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { bookingData, paymentAmount, paymentMethod, appointmentId } = location.state || {};

  useEffect(() => {
    const confirmPayment = async () => {
      if (appointmentId) {
        try {
          await appointmentsAPI.updateStatus(appointmentId, 'confirmed');
        } catch (error) {
          console.error('Error confirming appointment:', error);
        }
      }
    };
    confirmPayment();
  }, [appointmentId]);

  const formatPrice = (price) => {
    const num = parseFloat(price);
    return isNaN(num) ? '0.00' : num.toFixed(2);
  };

  if (!bookingData) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Payment Successful!</h1>
          <p className="text-xl text-gray-600 mb-8">Your appointment has been confirmed.</p>
          <button onClick={() => navigate('/')} className="bg-pink-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-pink-700">
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center">
        <div className="mb-6">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Payment Successful!</h1>
        <p className="text-xl text-gray-600 mb-8">Your appointment has been confirmed.</p>
        <div className="bg-gray-50 rounded-lg p-6 mb-8 max-w-md mx-auto">
          <h2 className="text-lg font-semibold mb-4">Booking Details</h2>
          <div className="space-y-2 text-left">
            <p><strong>Payment Method:</strong> {paymentMethod}</p>
            <p><strong>Amount Paid:</strong> R{formatPrice(paymentAmount)}</p>
            <p><strong>Appointment ID:</strong> {bookingData.appointmentId}</p>
            <p><strong>Date:</strong> {new Date(bookingData.appointmentDate).toLocaleString()}</p>
            <p><strong>Location:</strong> {bookingData.location === 'studio' ? 'Studio' : 'Mobile Service'}</p>
          </div>
        </div>
        <div className="space-x-4">
          <button onClick={() => navigate('/')} className="bg-pink-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-pink-700">
            Return to Home
          </button>
          <button onClick={() => navigate('/booking')} className="bg-gray-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-gray-700">
            Book Another Appointment
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;