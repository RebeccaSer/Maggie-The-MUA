const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { sendBookingConfirmationEmail, sendAppointmentUpdateEmail, sendAppointmentCancellationEmail } = require('../utils/email');

// Book new appointment
router.post('/book', async (req, res) => {
    const client = await db.pool.connect();
    try {
        await client.query('BEGIN');

        const {
            services = [],
            package: pkg,
            addons = [],
            appointmentDate,
            location,
            coordinates,
            customerInfo,
            termsAccepted = false
        } = req.body;

        if (!termsAccepted) {
            throw new Error('You must accept the terms and conditions to proceed.');
        }

        let totalPrice = 0;
        let totalDuration = 0;
        let housecallFee = 0;
        let distance = 0;

        // Fetch studio coordinates and fees
        const settingsRes = await client.query(
            "SELECT key, value FROM settings WHERE key IN ('studio_latitude', 'studio_longitude', 'housecall_base_fee', 'housecall_rate_per_km')"
        );
        const settings = {
            studio_latitude: -23.9318,
            studio_longitude: 29.4795,
            housecall_base_fee: 1000,
            housecall_rate_per_km: 11.5
        };
        settingsRes.rows.forEach(row => {
            settings[row.key] = parseFloat(row.value);
        });

        if (coordinates && coordinates.lat && coordinates.lng) {
            const R = 6371;
            const dLat = (coordinates.lat - settings.studio_latitude) * Math.PI / 180;
            const dLon = (coordinates.lng - settings.studio_longitude) * Math.PI / 180;
            const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                      Math.cos(settings.studio_latitude * Math.PI/180) * Math.cos(coordinates.lat * Math.PI/180) *
                      Math.sin(dLon/2) * Math.sin(dLon/2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
            distance = R * c;
            housecallFee = settings.housecall_base_fee + (distance * settings.housecall_rate_per_km);
            totalPrice += housecallFee;
        }

        // Check if date is blocked (full-day)
        const dateOnly = appointmentDate.split('T')[0];
        const blockedCheck = await client.query(
            'SELECT EXISTS(SELECT 1 FROM artist_availability WHERE unavailable_date = $1) as is_blocked',
            [dateOnly]
        );
        if (blockedCheck.rows[0].is_blocked) {
            throw new Error('The selected date is not available. Please choose another date.');
        }

        // Check for double booking
        const existingAppointment = await client.query(
            `SELECT id FROM appointments 
             WHERE appointment_date = $1 
             AND status IN ('confirmed', 'pending')
             LIMIT 1`,
            [appointmentDate]
        );
        if (existingAppointment.rows.length > 0) {
            throw new Error('This time slot is already booked. Please choose another time.');
        }

        // Create appointment
        const appointmentRes = await client.query(
            `INSERT INTO appointments 
             (appointment_date, location_address, housecall_fee, distance_km, status, customer_info, total_price, total_duration_minutes, terms_accepted)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
             RETURNING id`,
            [appointmentDate, location, housecallFee, distance, 'pending', JSON.stringify(customerInfo), totalPrice, totalDuration, true]
        );
        const appointmentId = appointmentRes.rows[0].id;

        // Process services
        for (const s of services) {
            const serviceRes = await client.query(
                'SELECT base_price, duration_minutes FROM services WHERE id = $1 AND is_active = true',
                [s.id]
            );
            if (serviceRes.rows.length === 0) throw new Error(`Service ${s.id} not found`);
            const { base_price, duration_minutes } = serviceRes.rows[0];
            const quantity = s.quantity || 1;
            totalPrice += parseFloat(base_price) * quantity;
            totalDuration += duration_minutes * quantity;
            await client.query(
                `INSERT INTO appointment_services (appointment_id, service_id, quantity, price_at_time, duration_minutes)
                 VALUES ($1, $2, $3, $4, $5)`,
                [appointmentId, s.id, quantity, base_price, duration_minutes]
            );
        }

        // Process package
        if (pkg) {
            const pkgRes = await client.query(
                'SELECT base_price, base_duration_minutes, name FROM packages WHERE id = $1 AND is_active = true',
                [pkg.id]
            );
            if (pkgRes.rows.length === 0) throw new Error(`Package ${pkg.id} not found`);
            const { base_price, base_duration_minutes, name } = pkgRes.rows[0];
            const quantity = pkg.quantity || 1;
            totalPrice += parseFloat(base_price) * quantity;
            totalDuration += base_duration_minutes * quantity;
            await client.query(
                `INSERT INTO appointment_packages (appointment_id, package_id, quantity, price_at_time, duration_minutes)
                 VALUES ($1, $2, $3, $4, $5)`,
                [appointmentId, pkg.id, quantity, base_price, base_duration_minutes]
            );
            pkg.name = name;
        }

        // Process add-ons
        for (const a of addons) {
            const addonRes = await client.query(
                'SELECT price, duration_minutes FROM addons WHERE id = $1 AND is_active = true',
                [a.id]
            );
            if (addonRes.rows.length === 0) throw new Error(`Addon ${a.id} not found`);
            const { price, duration_minutes } = addonRes.rows[0];
            const quantity = a.quantity || 1;
            totalPrice += parseFloat(price) * quantity;
            totalDuration += duration_minutes * quantity;
            await client.query(
                `INSERT INTO appointment_addons (appointment_id, addon_id, quantity)
                 VALUES ($1, $2, $3)`,
                [appointmentId, a.id, quantity]
            );
        }

        // Update final totals
        await client.query(
            `UPDATE appointments SET total_price = $1, total_duration_minutes = $2 WHERE id = $3`,
            [totalPrice, totalDuration, appointmentId]
        );

        await client.query('COMMIT');

        // Fetch booking reference
        const refResult = await db.query('SELECT booking_reference FROM appointments WHERE id = $1', [appointmentId]);
        const bookingReference = refResult.rows[0].booking_reference;

        // Email data
        const emailData = {
            appointmentDate,
            services,
            package: pkg ? { id: pkg.id, name: pkg.name, quantity: 1 } : null,
            totalPrice,
            depositAmount: totalPrice * 0.5,
            location: location === 'studio' ? 'studio' : 'mobile',
            fullAddress: location,
            bookingReference
        };
        sendBookingConfirmationEmail(customerInfo, appointmentId, emailData).catch(err => console.error('Email error:', err));

        res.status(201).json({
            success: true,
            message: 'Appointment booked successfully',
            data: {
                appointment: { id: appointmentId, booking_reference: bookingReference },
                totalPrice,
                totalDuration,
                depositAmount: totalPrice * 0.5
            }
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Booking error:', error);
        res.status(500).json({ success: false, error: error.message || 'Failed to book appointment' });
    } finally {
        client.release();
    }
});

// Get all appointments (admin)
router.get('/', async (req, res) => {
    try {
        const result = await db.query(`
            SELECT a.*, 
                   u.first_name, u.last_name, u.email, u.phone,
                   COALESCE(
                       (SELECT json_agg(json_build_object('id', s.id, 'name', s.name, 'quantity', ap.quantity))
                        FROM appointment_services ap
                        JOIN services s ON ap.service_id = s.id
                        WHERE ap.appointment_id = a.id),
                       '[]'
                   ) as services,
                   COALESCE(
                       (SELECT json_agg(json_build_object('id', p.id, 'name', p.name, 'quantity', apkg.quantity))
                        FROM appointment_packages apkg
                        JOIN packages p ON apkg.package_id = p.id
                        WHERE apkg.appointment_id = a.id),
                       '[]'
                   ) as packages,
                   COALESCE(
                       (SELECT json_agg(json_build_object('id', ad.id, 'name', ad.name, 'quantity', aa.quantity))
                        FROM appointment_addons aa
                        JOIN addons ad ON aa.addon_id = ad.id
                        WHERE aa.appointment_id = a.id),
                       '[]'
                   ) as addons
            FROM appointments a
            LEFT JOIN users u ON a.customer_id = u.id
            ORDER BY a.appointment_date DESC
        `);
        res.json({ success: true, data: result.rows, count: result.rowCount });
    } catch (error) {
        console.error('Get appointments error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch appointments' });
    }
});

// Admin: Update appointment (reschedule) with reason and email
router.put('/admin/:id', async (req, res) => {
    const client = await db.pool.connect();
    try {
        await client.query('BEGIN');
        const { id } = req.params;
        const { appointment_date, status, reason } = req.body;
        const updates = [];
        const values = [];
        let paramIndex = 1;
        let oldAppointment = null;

        const current = await client.query('SELECT * FROM appointments WHERE id = $1', [id]);
        if (current.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Appointment not found' });
        }
        oldAppointment = current.rows[0];

        if (appointment_date !== undefined) {
            // Check conflict
            const conflict = await client.query(
                `SELECT id FROM appointments 
                 WHERE appointment_date = $1 
                 AND id != $2 
                 AND status IN ('confirmed', 'pending')
                 LIMIT 1`,
                [appointment_date, id]
            );
            if (conflict.rows.length > 0) {
                throw new Error('The new time slot is already booked. Please choose another.');
            }
            updates.push(`appointment_date = $${paramIndex++}`);
            values.push(appointment_date);
        }
        if (status !== undefined) {
            updates.push(`status = $${paramIndex++}`);
            values.push(status);
        }
        if (updates.length === 0) {
            return res.status(400).json({ success: false, error: 'No fields to update' });
        }
        updates.push(`updated_at = CURRENT_TIMESTAMP`);
        values.push(id);
        const query = `UPDATE appointments SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`;
        const result = await client.query(query, values);
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Appointment not found' });
        }
        await client.query('COMMIT');

        // Send email if date changed
        if (appointment_date && oldAppointment.appointment_date !== appointment_date) {
            let customerInfo = {};
            try {
                customerInfo = typeof oldAppointment.customer_info === 'string' 
                    ? JSON.parse(oldAppointment.customer_info) 
                    : oldAppointment.customer_info;
            } catch(e) { console.error('JSON parse error:', e); }
            if (customerInfo.email) {
                await sendAppointmentUpdateEmail(
                    customerInfo,
                    id,
                    oldAppointment.appointment_date,
                    appointment_date,
                    reason || 'No reason provided',
                    oldAppointment.booking_reference
                ).catch(err => console.error('Email error:', err));
            }
        }

        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Update appointment error:', error);
        res.status(500).json({ success: false, error: error.message });
    } finally {
        client.release();
    }
});

// Admin: Cancel appointment with reason and email
router.delete('/admin/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;

        const current = await db.query('SELECT * FROM appointments WHERE id = $1', [id]);
        if (current.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Appointment not found' });
        }
        const oldAppointment = current.rows[0];

        const result = await db.query(
            `UPDATE appointments SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *`,
            [id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Appointment not found' });
        }

        // Send cancellation email
        let customerInfo = {};
        try {
            customerInfo = typeof oldAppointment.customer_info === 'string' 
                ? JSON.parse(oldAppointment.customer_info) 
                : oldAppointment.customer_info;
        } catch(e) { console.error('JSON parse error:', e); }
        if (customerInfo.email) {
            await sendAppointmentCancellationEmail(
                customerInfo,
                id,
                reason || 'No reason provided',
                oldAppointment.booking_reference
            ).catch(err => console.error('Email error:', err));
        }

        res.json({ success: true, message: 'Appointment cancelled', data: result.rows[0] });
    } catch (error) {
        console.error('Cancel appointment error:', error);
        res.status(500).json({ success: false, error: 'Failed to cancel appointment' });
    }
});

// Legacy endpoints (kept for compatibility)
router.post('/:id/reschedule', async (req, res) => {
    try {
        const { id } = req.params;
        const { newDate, reason } = req.body;
        const result = await db.query(
            `UPDATE appointments SET appointment_date = $1, reschedule_count = reschedule_count + 1, status = 'rescheduled' WHERE id = $2 RETURNING *`,
            [newDate, id]
        );
        if (result.rows.length === 0) return res.status(404).json({ success: false, error: 'Appointment not found' });
        res.json({ success: true, message: 'Appointment rescheduled successfully', data: result.rows[0] });
    } catch (error) {
        console.error('Reschedule error:', error);
        res.status(500).json({ success: false, error: 'Failed to reschedule appointment' });
    }
});

router.post('/:id/cancel', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await db.query(`UPDATE appointments SET status = 'cancelled' WHERE id = $1 RETURNING *`, [id]);
        if (result.rows.length === 0) return res.status(404).json({ success: false, error: 'Appointment not found' });
        res.json({ success: true, message: 'Appointment cancelled successfully', data: result.rows[0] });
    } catch (error) {
        console.error('Cancel error:', error);
        res.status(500).json({ success: false, error: 'Failed to cancel appointment' });
    }
});

module.exports = router;