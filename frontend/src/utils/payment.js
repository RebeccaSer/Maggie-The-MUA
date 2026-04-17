const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://maggie-the-mua.onrender.com/api';

const confirmPayment = async (appointmentId, paymentMethod, amount, paymentId = null) => {
    const response = await fetch(`${API_BASE_URL}/payments/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            appointmentId,
            paymentMethod,
            amount,
            status: 'confirmed',
            paymentId
        }),
    });
    if (!response.ok) throw new Error('Failed to confirm payment');
    return await response.json();
};

// Secure PayFast initiation – calls backend, backend returns auto-submit form
export const initiatePayFastPayment = async (paymentData) => {
    const response = await fetch(`${API_BASE_URL}/payments/initiate-payfast`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paymentData),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to initiate PayFast payment');
    }

    const html = await response.text();
    // Open a new window/tab and submit the form automatically
    const win = window.open();
    win.document.write(html);
    win.document.close();
};

export const initiatePayment = async (paymentData, method = 'payfast') => {
    if (method === 'payfast') return initiatePayFastPayment(paymentData);
    if (method === 'mock') {
        await confirmPayment(paymentData.appointmentId, 'mock', paymentData.depositAmount);
        return { success: true, type: 'mock' };
    }
    throw new Error('Unsupported payment method');
};