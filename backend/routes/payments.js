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

module.exports = router;