// frontend/src/pages/Payment.jsx
import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { initiatePayment } from '../utils/payment';

const Payment = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [processing, setProcessing] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState('payfast');
  const { bookingData } = location.state || {};

  const handlePayment = async () => {
    if (!bookingData) {
      alert('No booking data found. Please start over.');
      navigate('/booking');
      return;
    }

    setProcessing(true);
    try {
      const paymentData = {
        ...bookingData,
        appointmentId: bookingData.appointmentId,
        serviceName: bookingData.services?.length > 0 ? 'Multiple Services' : (bookingData.package?.name || 'Appointment')
      };

      const result = await initiatePayment(paymentData, selectedMethod);
      
      if (selectedMethod === 'mock' && result.success) {
        setTimeout(() => {
          navigate('/payment-success', { 
            state: { 
              bookingData, 
              paymentAmount: bookingData.depositAmount,
              paymentMethod: 'Mock Payment',
              appointmentId: bookingData.appointmentId
            } 
          });
        }, 1500);
      }
      // For PayFast, the user is redirected, so no further action here
    } catch (error) {
      console.error('Payment failed:', error);
      alert(`Payment failed: ${error.message}. Please try again.`);
      setProcessing(false);
    }
  };

  const formatPrice = (price) => {
    const num = parseFloat(price);
    return isNaN(num) ? '0.00' : num.toFixed(2);
  };

  if (!bookingData) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-4">No Booking Data</h1>
          <p className="text-xl text-gray-600 mb-8">Please start a booking first.</p>
          <button onClick={() => navigate('/booking')} className="bg-yellow-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-yellow-700">
            Go to Booking
          </button>
        </div>
      </div>
    );
  }

  const { totalPrice, depositAmount, services, package: pkg, addons, transportFee, afterHoursFee, lateBookingFee, customerInfo, appointmentDate, location: serviceLocation } = bookingData;

  return (
    <div className="bg-black px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-white mb-4">Complete Your Booking</h1>
        <p className="text-xl text-gray-600">Secure payment for your appointment</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Payment Methods */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-semibold text-black mb-4">Choose Payment Method</h2>

          <div className="space-y-4 mb-6">
            {/* PayFast */}
            <div 
              className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                selectedMethod === 'payfast' ? 'border-yellow-600 bg-yellow-50' : 'border-gray-300 hover:border-yellow-300'
              }`}
              onClick={() => setSelectedMethod('payfast')}
            >
              <div className="flex items-center mb-2">
                <input
                  type="radio"
                  id="payfast"
                  name="paymentMethod"
                  checked={selectedMethod === 'payfast'}
                  onChange={() => setSelectedMethod('payfast')}
                  className="h-4 w-4 text-yellow-600 focus:ring-yellow-500"
                />
                <label htmlFor="payfast" className="ml-2 block text-sm font-medium text-black
                ">
                  PayFast (Card / Instant EFT)
                </label>
              </div>
              <p className="text-sm text-gray-600 ml-6">
                Secure payment via PayFast - Credit/Debit cards, Instant EFT, and more.
              </p>
              <div className="flex space-x-2 ml-6 mt-2">
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Visa</span>
                <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">Mastercard</span>
                <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">Instant EFT</span>
              </div>
            </div>

            {/* Mock payment (development only) */}
            {process.env.NODE_ENV === 'development' && (
              <div 
                className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                  selectedMethod === 'mock' ? 'border-yellow-600 bg-yellow-50' : 'border-gray-300 hover:border-yellow-300'
                }`}
                onClick={() => setSelectedMethod('mock')}
              >
                <div className="flex items-center mb-2">
                  <input
                    type="radio"
                    id="mock"
                    name="paymentMethod"
                    checked={selectedMethod === 'mock'}
                    onChange={() => setSelectedMethod('mock')}
                    className="h-4 w-4 text-yellow-600 focus:ring-yellow-500"
                  />
                  <label htmlFor="mock" className="ml-2 block text-sm font-medium text-white">
                    Mock Payment (Development)
                  </label>
                </div>
                <p className="text-sm text-gray-600 ml-6">Test payment without real transaction</p>
              </div>
            )}
          </div>

          <div className="mt-6">
            <button
              onClick={handlePayment}
              disabled={processing}
              className="w-full bg-yellow-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-yellow-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
            >
              {processing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Processing...
                </>
              ) : (
                `Pay Deposit - R${formatPrice(depositAmount)}`
              )}
            </button>
          </div>

          <div className="mt-4 text-center">
            <p className="text-sm text-gray-600">
              You will be redirected to PayFast to complete the payment securely.
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Deposit is 50% of the total amount. Balance payable on appointment date.
            </p>
          </div>
        </div>

        {/* Order Summary (unchanged) */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-semibold text-white mb-4">Booking Summary</h2>
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-gray-600">Service Type:</span>
              <span className="font-medium">{services?.length > 0 ? 'Multiple Services' : (pkg ? 'Package' : 'Custom')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Date & Time:</span>
              <span className="font-medium">
                {appointmentDate ? new Date(appointmentDate).toLocaleDateString('en-ZA', { 
                  weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
                  hour: '2-digit', minute: '2-digit'
                }) : 'Not set'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Location:</span>
              <span className="font-medium capitalize">{serviceLocation === 'studio' ? 'Studio' : 'Mobile'}</span>
            </div>
            {transportFee > 0 && (
              <div className="flex justify-between text-yellow-600">
                <span>Transport Fee:</span>
                <span className="font-medium">R{formatPrice(transportFee)}</span>
              </div>
            )}
            {services && services.map(service => (
              <div key={service.id} className="flex justify-between">
                <span>{service.name} {service.quantity > 1 && `×${service.quantity}`}</span>
                <span>R{formatPrice(service.base_price * service.quantity)}</span>
              </div>
            ))}
            {pkg && (
              <div className="flex justify-between">
                <span>{pkg.name}</span>
                <span>R{formatPrice(pkg.base_price)}</span>
              </div>
            )}
            {addons && addons.map(addon => (
              <div key={addon.id} className="flex justify-between text-sm">
                <span>{addon.name} {addon.quantity > 1 && `×${addon.quantity}`}</span>
                <span>R{formatPrice(addon.price * addon.quantity)}</span>
              </div>
            ))}
            {afterHoursFee > 0 && (
              <div className="flex justify-between text-orange-600">
                <span>After Hours Fee:</span>
                <span>R{formatPrice(afterHoursFee)}</span>
              </div>
            )}
            {lateBookingFee > 0 && (
              <div className="flex justify-between text-red-600">
                <span>Late Booking Fee:</span>
                <span>R{formatPrice(lateBookingFee)}</span>
              </div>
            )}
            <div className="border-t pt-4 mt-4">
              <div className="flex justify-between text-lg font-semibold mb-2">
                <span>Total Amount:</span>
                <span>R{formatPrice(totalPrice)}</span>
              </div>
              <div className="flex justify-between text-yellow-600 font-semibold">
                <span>Deposit (50%):</span>
                <span>R{formatPrice(depositAmount)}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600 mt-1">
                <span>Balance Due:</span>
                <span>R{formatPrice(totalPrice - depositAmount)}</span>
              </div>
            </div>
          </div>
          {/* Policy & Customer Info sections unchanged */}
          <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="font-semibold text-yellow-800 mb-2">Booking Policy</h3>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• Deposits are non-refundable</li>
              <li>• Rescheduling requires 36 hours notice</li>
              <li>• One reschedule allowed per appointment</li>
              <li>• Late arrivals may result in shortened service time</li>
              <li>• Balance payable on appointment date</li>
            </ul>
          </div>
          <div className="mt-4 bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-800 mb-2">Customer Details</h3>
            <p className="text-sm text-gray-700"><strong>Name:</strong> {customerInfo?.name || 'Not provided'}</p>
            <p className="text-sm text-gray-700"><strong>Email:</strong> {customerInfo?.email || 'Not provided'}</p>
            <p className="text-sm text-gray-700"><strong>Phone:</strong> {customerInfo?.phone || 'Not provided'}</p>
            {customerInfo?.notes && <p className="text-sm text-gray-700 mt-2"><strong>Notes:</strong> {customerInfo.notes}</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Payment;