const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Confirm payment (for mock / manual / PayFast ITN)
router.post('/confirm', async (req, res) => {
    console.log('Payment confirm request:', req.body);
    try {
        const { appointmentId, paymentMethod, amount, status, paymentId } = req.body;
        const result = await db.query(
            `UPDATE appointments 
             SET status = $1, deposit_paid = true, deposit_amount = $2,
                 payment_reference = $3, payment_method = $4, updated_at = CURRENT_TIMESTAMP
             WHERE id = $5
             RETURNING *`,
            [status || 'confirmed', amount, paymentId || `PAYMENT-${paymentMethod}-${Date.now()}`, paymentMethod, appointmentId]
        );
        if (result.rows.length === 0) return res.status(404).json({ success: false, error: 'Appointment not found' });
        console.log('Appointment updated:', result.rows[0]);
        res.json({ success: true, message: 'Payment confirmed successfully', data: result.rows[0] });
    } catch (error) {
        console.error('Payment confirmation error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// PayFast ITN endpoint (Instant Transaction Notification)
router.post('/payfast-itn', async (req, res) => {
    try {
        const itnData = req.body;
        const { m_payment_id, amount, payment_status } = itnData;
        if (payment_status === 'COMPLETE') {
            await db.query(
                `UPDATE appointments 
                 SET status = 'confirmed', deposit_paid = true, deposit_amount = $1,
                     payment_reference = $2, payment_method = 'payfast', updated_at = CURRENT_TIMESTAMP
                 WHERE id = $3 AND deposit_paid = false`,
                [amount, m_payment_id, m_payment_id]
            );
        }
        res.send('OK');
    } catch (error) {
        console.error('PayFast ITN error:', error);
        res.status(500).send('Error');
    }
});

// Initiates PayFast payment – generates form on server
router.post('/initiate-payfast', async (req, res) => {
    try {
        const { appointmentId, depositAmount, customerInfo, serviceName } = req.body;

        const merchant_id = process.env.PAYFAST_MERCHANT_ID;
        const merchant_key = process.env.PAYFAST_MERCHANT_KEY;
        const sandbox = process.env.PAYFAST_SANDBOX === 'true';

        // Validate credentials
        if (!merchant_id || isNaN(parseInt(merchant_id))) {
            console.error('Invalid PAYFAST_MERCHANT_ID:', merchant_id);
            return res.status(500).json({ error: 'Invalid merchant ID' });
        }
        if (!merchant_key || merchant_key.length !== 13) {
            console.error('Invalid PAYFAST_MERCHANT_KEY length:', merchant_key?.length);
            return res.status(500).json({ error: 'Merchant key must be 13 characters' });
        }

        // Prepare PayFast data
        const pfData = {
            merchant_id,
            merchant_key,
            return_url: `${process.env.FRONTEND_URL}/payment-success`,
            cancel_url: `${process.env.FRONTEND_URL}/payment-cancelled`,
            notify_url: `https://maggie-the-mua.onrender.com/api/payments/payfast-itn`,
            m_payment_id: appointmentId,
            amount: parseFloat(depositAmount).toFixed(2),
            item_name: `Deposit for Appointment ${appointmentId}`,
            item_description: `Booking deposit for ${serviceName || 'Appointment'}`,
            name_first: customerInfo.name?.split(' ')[0] || '',
            name_last: customerInfo.name?.split(' ').slice(1).join(' ') || '',
            email_address: customerInfo.email,
        };

        const formAction = sandbox
            ? 'https://sandbox.payfast.co.za/eng/process'
            : 'https://www.payfast.co.za/eng/process';

        // Build HTML form that auto-submits
                const htmlForm = `<!DOCTYPE html>
        <html>
        <head><title>Redirecting to PayFast...</title></head>
        <body>
            <form id="payfastForm" action="${formAction}" method="post">
                ${Object.entries(pfData).map(([key, value]) => `<input type="hidden" name="${key}" value="${value}">`).join('')}
            </form>
            <script>document.getElementById('payfastForm').submit();</script>
        </body>
        </html>`;

        res.send(htmlForm);
    } catch (error) {
        console.error('Initiate PayFast error:', error);
        res.status(500).json({ error: 'Failed to initiate payment' });
    }
});

module.exports = router;