const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

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

export const initiatePayFastPayment = (paymentData) => {
    const { appointmentId, depositAmount, customerInfo, serviceName } = paymentData;
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = 'https://www.payfast.co.za/eng/process';
    form.target = '_blank';

    const fields = {
        merchant_id: process.env.REACT_APP_PAYFAST_MERCHANT_ID,
        merchant_key: process.env.REACT_APP_PAYFAST_MERCHANT_KEY,
        return_url: `${window.location.origin}/payment-success`,
        cancel_url: `${window.location.origin}/payment-cancelled`,
        notify_url: `${API_BASE_URL}/payments/payfast-itn`,
        name_first: customerInfo.name?.split(' ')[0] || '',
        name_last: customerInfo.name?.split(' ').slice(1).join(' ') || '',
        email_address: customerInfo.email,
        m_payment_id: appointmentId,
        amount: depositAmount.toFixed(2),
        item_name: `Deposit for Appointment ${appointmentId}`,
        item_description: `Booking deposit for ${serviceName || 'Appointment'}`,
    };

    for (const [key, value] of Object.entries(fields)) {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = key;
        input.value = value;
        form.appendChild(input);
    }

    document.body.appendChild(form);
    form.submit();
    document.body.removeChild(form);
    return new Promise(() => {});
};

export const initiatePayment = async (paymentData, method = 'payfast') => {
    if (method === 'payfast') return initiatePayFastPayment(paymentData);
    if (method === 'mock') {
        await confirmPayment(paymentData.appointmentId, 'mock', paymentData.depositAmount);
        return { success: true, type: 'mock' };
    }
    throw new Error('Unsupported payment method');
};