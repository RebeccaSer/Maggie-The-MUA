import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { initiatePayment, initiateBankTransfer } from '../utils/payment';

const Payment = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [processing, setProcessing] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState('stripe');
  const [showBankDetails, setShowBankDetails] = useState(false);
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
        appointmentId: `MAGGIE-${Date.now()}`
      };

      if (selectedMethod === 'bank_transfer') {
        initiateBankTransfer(paymentData);
        setShowBankDetails(true);
        return;
      }

      await initiatePayment(paymentData, selectedMethod);
      
      if (selectedMethod === 'mock') {
        setTimeout(() => {
          alert('Payment processed successfully! Your appointment is confirmed.');
          navigate('/payment-success', { 
            state: { 
              bookingData, 
              paymentAmount: bookingData.depositAmount,
              paymentMethod: 'Mock Payment'
            } 
          });
        }, 2000);
      }
    } catch (error) {
      console.error('Payment failed:', error);
      alert(`Payment failed: ${error.message}. Please try again.`);
    } finally {
      setProcessing(false);
    }
  };

  // Business banking details (replace with your actual details)
  const businessBankDetails = {
    bankName: "Standard Bank",
    accountName: "HER BY MAGGIE",
    accountNumber: "12345678901",
    branchCode: "051001",
    branchName: "Hatfield Branch",
    accountType: "Business Current Account",
    swiftCode: "SBZAZAJJ",
  };

  if (!bookingData) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">No Booking Data</h1>
          <p className="text-xl text-gray-600 mb-8">
            Please start a booking first.
          </p>
          <button
            onClick={() => navigate('/booking')}
            className="bg-pink-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-pink-700 transition-colors"
          >
            Go to Booking
          </button>
        </div>
      </div>
    );
  }

  const { totalPrice, depositAmount, services, package: pkg, addons, transportFee, customerInfo, appointmentDate, location: serviceLocation } = bookingData;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Complete Your Booking</h1>
        <p className="text-xl text-gray-600">
          Secure payment for your appointment
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Payment Methods */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Choose Payment Method</h2>
          
          <div className="space-y-4 mb-6">
            <div 
              className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                selectedMethod === 'stripe' ? 'border-pink-600 bg-pink-50' : 'border-gray-300 hover:border-pink-300'
              }`}
              onClick={() => setSelectedMethod('stripe')}
            >
              <div className="flex items-center mb-2">
                <input
                  type="radio"
                  id="stripe"
                  name="paymentMethod"
                  checked={selectedMethod === 'stripe'}
                  onChange={() => setSelectedMethod('stripe')}
                  className="h-4 w-4 text-pink-600 focus:ring-pink-500"
                />
                <label htmlFor="stripe" className="ml-2 block text-sm font-medium text-gray-900">
                  Credit/Debit Card (Stripe)
                </label>
              </div>
              <p className="text-sm text-gray-600 ml-6">
                Secure payment via Stripe - Visa, Mastercard, American Express
              </p>
            </div>

            <div 
              className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                selectedMethod === 'bank_transfer' ? 'border-pink-600 bg-pink-50' : 'border-gray-300 hover:border-pink-300'
              }`}
              onClick={() => setSelectedMethod('bank_transfer')}
            >
              <div className="flex items-center mb-2">
                <input
                  type="radio"
                  id="bank-transfer"
                  name="paymentMethod"
                  checked={selectedMethod === 'bank_transfer'}
                  onChange={() => setSelectedMethod('bank_transfer')}
                  className="h-4 w-4 text-pink-600 focus:ring-pink-500"
                />
                <label htmlFor="bank-transfer" className="ml-2 block text-sm font-medium text-gray-900">
                  Bank Transfer
                </label>
              </div>
              <p className="text-sm text-gray-600 ml-6">
                Direct bank transfer to our business account
              </p>
            </div>

            {process.env.NODE_ENV === 'development' && (
              <div 
                className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                  selectedMethod === 'mock' ? 'border-pink-600 bg-pink-50' : 'border-gray-300 hover:border-pink-300'
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
                    className="h-4 w-4 text-pink-600 focus:ring-pink-500"
                  />
                  <label htmlFor="mock" className="ml-2 block text-sm font-medium text-gray-900">
                    Mock Payment (Development)
                  </label>
                </div>
                <p className="text-sm text-gray-600 ml-6">Test payment without real transaction</p>
              </div>
            )}
          </div>

          {showBankDetails && (
            <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-semibold text-green-800 mb-3">Bank Transfer Instructions</h3>
              <div className="space-y-2 text-sm text-green-700">
                <div className="flex justify-between">
                  <span>Bank:</span>
                  <span className="font-medium">{businessBankDetails.bankName}</span>
                </div>
                <div className="flex justify-between">
                  <span>Account Name:</span>
                  <span className="font-medium">{businessBankDetails.accountName}</span>
                </div>
                <div className="flex justify-between">
                  <span>Account Number:</span>
                  <span className="font-medium">{businessBankDetails.accountNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span>Branch Code:</span>
                  <span className="font-medium">{businessBankDetails.branchCode}</span>
                </div>
                <div className="flex justify-between">
                  <span>Reference:</span>
                  <span className="font-medium">MAGGIE-{Date.now()}</span>
                </div>
                <div className="flex justify-between font-semibold mt-2 pt-2 border-t border-green-200">
                  <span>Amount:</span>
                  <span>R{depositAmount?.toFixed(2)}</span>
                </div>
              </div>
              <p className="text-xs text-green-600 mt-3">
                Please use the exact reference number when making the transfer. 
                Your booking will be confirmed once we receive the payment (usually within 1-2 business days).
              </p>
              <button
                onClick={() => setShowBankDetails(false)}
                className="mt-3 w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 transition-colors"
              >
                I Understand
              </button>
            </div>
          )}

          <div className="mt-6">
            <button
              onClick={handlePayment}
              disabled={processing || (selectedMethod === 'bank_transfer' && showBankDetails)}
              className="w-full bg-pink-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-pink-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
            >
              {processing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Processing...
                </>
              ) : selectedMethod === 'bank_transfer' ? (
                'Show Banking Details'
              ) : (
                `Pay Deposit - R${depositAmount?.toFixed(2) || '0.00'}`
              )}
            </button>
          </div>

          <div className="mt-4 text-center">
            <p className="text-sm text-gray-600">
              {selectedMethod === 'bank_transfer' 
                ? 'Your slot will be reserved once the bank transfer is confirmed.'
                : 'Your appointment will be confirmed once the deposit is paid.'
              }
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Deposit is 50% of the total amount. Balance payable on appointment date.
            </p>
          </div>

          <div className="mt-6 flex justify-center space-x-4">
            <div className="text-center">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-1">
                <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <p className="text-xs text-gray-600">Secure</p>
            </div>
            <div className="text-center">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-1">
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <p className="text-xs text-gray-600">Encrypted</p>
            </div>
          </div>
        </div>

        {/* Order Summary */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Booking Summary</h2>
          
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-gray-600">Service Type:</span>
              <span className="font-medium">
                {services?.length > 0 ? 'Multiple Services' : (pkg ? 'Package' : 'Custom')}
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600">Date & Time:</span>
              <span className="font-medium">
                {new Date(appointmentDate).toLocaleDateString('en-ZA', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600">Location:</span>
              <span className="font-medium capitalize">
                {serviceLocation === 'studio' ? 'Studio' : `Mobile - ${bookingData.customerLocation?.suburb}`}
              </span>
            </div>

            {transportFee > 0 && (
              <div className="flex justify-between text-pink-600">
                <span>Transport Fee:</span>
                <span className="font-medium">R{transportFee?.toFixed(2)}</span>
              </div>
            )}

            {/* Services */}
            {services && services.map(service => (
              <div key={service.id} className="flex justify-between">
                <span>{service.name} {service.quantity > 1 && `×${service.quantity}`}</span>
                <span>R{(service.base_price * service.quantity).toFixed(2)}</span>
              </div>
            ))}

            {/* Package */}
            {pkg && (
              <div className="flex justify-between">
                <span>{pkg.name}</span>
                <span>R{pkg.base_price.toFixed(2)}</span>
              </div>
            )}

            {/* Add-ons */}
            {addons && addons.map(addon => (
              <div key={addon.id} className="flex justify-between text-sm">
                <span>{addon.name} {addon.quantity > 1 && `×${addon.quantity}`}</span>
                <span>R{(addon.price * addon.quantity).toFixed(2)}</span>
              </div>
            ))}

            <div className="border-t pt-4 mt-4">
              <div className="flex justify-between text-lg font-semibold mb-2">
                <span>Total Amount:</span>
                <span>R{totalPrice?.toFixed(2) || '0.00'}</span>
              </div>
              <div className="flex justify-between text-pink-600 font-semibold">
                <span>Deposit (50%):</span>
                <span>R{depositAmount?.toFixed(2) || '0.00'}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600 mt-1">
                <span>Balance Due:</span>
                <span>R{(totalPrice - depositAmount)?.toFixed(2) || '0.00'}</span>
              </div>
            </div>
          </div>

          {/* Policy Notice */}
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

          {/* Customer Information */}
          <div className="mt-4 bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-800 mb-2">Customer Details</h3>
            <p className="text-sm text-gray-700"><strong>Name:</strong> {customerInfo?.name}</p>
            <p className="text-sm text-gray-700"><strong>Email:</strong> {customerInfo?.email}</p>
            <p className="text-sm text-gray-700"><strong>Phone:</strong> {customerInfo?.phone}</p>
            {customerInfo?.notes && (
              <p className="text-sm text-gray-700 mt-2"><strong>Notes:</strong> {customerInfo.notes}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Payment;