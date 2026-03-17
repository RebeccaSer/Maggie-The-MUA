import stripePromise from './stripe';

// Backend API base URL
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export const initiateStripePayment = async (paymentData) => {
  try {
    // 1. Create payment intent on your backend
    const response = await fetch(`${API_BASE_URL}/payments/create-intent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: Math.round(paymentData.depositAmount * 100), // Convert to cents
        currency: 'zar',
        metadata: {
          appointmentId: paymentData.appointmentId,
          customerName: paymentData.customerInfo.name,
          customerEmail: paymentData.customerInfo.email,
          serviceType: paymentData.serviceName,
          appointmentDate: paymentData.appointmentDate
        }
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to create payment intent');
    }

    const { clientSecret } = await response.json();

    // 2. Redirect to Stripe Checkout
    const stripe = await stripePromise;
    
    const result = await stripe.redirectToCheckout({
      clientSecret: clientSecret,
      // return_url: `${window.location.origin}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
    });

    if (result.error) {
      throw new Error(result.error.message);
    }

    return { success: true, type: 'stripe' };

  } catch (error) {
    console.error('Stripe payment error:', error);
    throw error;
  }
};

export const initiateBankTransfer = (paymentData) => {
  // Show business banking details for manual transfer
  const bankDetails = {
    bankName: 'Your Bank Name',
    accountName: 'HER BY MAGGIE',
    accountNumber: '12345678901',
    branchCode: '123456',
    reference: `MAGGIE-${paymentData.appointmentId}`
  };

  // For now, show an alert with banking details
  // In a real app, you'd show a nice modal or dedicated page
  const message = `
Bank Transfer Details:
Bank: ${bankDetails.bankName}
Account Holder: ${bankDetails.accountName}
Account Number: ${bankDetails.accountNumber}
Branch Code: ${bankDetails.branchCode}
Reference: ${bankDetails.reference}

Amount to Pay: R${paymentData.depositAmount.toFixed(2)}

Please use the reference number when making the transfer.
Your booking will be confirmed once payment is received.
  `;

  alert(message);
  
  return { success: true, type: 'bank_transfer', bankDetails };
};

// Legacy function for other payment methods
export const initiatePayment = async (paymentData, method = 'stripe') => {
  switch (method) {
    case 'stripe':
      return await initiateStripePayment(paymentData);
    case 'bank_transfer':
      return initiateBankTransfer(paymentData);
    case 'mock':
      // Simulate successful payment for development
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            success: true,
            paymentUrl: `${window.location.origin}/payment-success?mock=true&amount=${paymentData.depositAmount}`,
            type: 'mock'
          });
        }, 2000);
      });
    default:
      throw new Error('Unsupported payment method');
  }
};