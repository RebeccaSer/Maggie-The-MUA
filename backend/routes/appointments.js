const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { haversineDistance } = require('../utils/geo');

// Book new appointment (supports multiple services, add-ons, and housecall fee)
router.post('/book', async (req, res) => {
    const client = await db.pool.connect();
    try {
        await client.query('BEGIN');

        const {
            services = [],        // array of { id, quantity }
            package: pkg,         // optional { id, quantity }
            addons = [],          // array of { id, quantity }
            appointmentDate,
            location,             // address string
            coordinates,          // optional { lat, lng } if frontend provides
            customerInfo
        } = req.body;

        let totalPrice = 0;
        let totalDuration = 0;
        let housecallFee = 0;
        let distance = 0;

        // 1. Fetch studio coordinates from settings
        const studioRes = await client.query(
            "SELECT value FROM settings WHERE key IN ('studio_latitude', 'studio_longitude')"
        );
        const studioLat = parseFloat(studioRes.rows.find(r => r.key === 'studio_latitude').value);
        const studioLng = parseFloat(studioRes.rows.find(r => r.key === 'studio_longitude').value);

        // Determine customer coordinates (if not provided, we need to geocode)
        let customerLat = null, customerLng = null;
        if (coordinates && coordinates.lat && coordinates.lng) {
            customerLat = parseFloat(coordinates.lat);
            customerLng = parseFloat(coordinates.lng);
        } else if (location) {
            // Option 1: Geocode the address using an external API (e.g., Google Maps)
            // For simplicity, we'll assume coordinates are provided by frontend or we skip fee.
            // You could integrate a geocoding service here.
            // For now, we'll skip distance calculation if no coordinates.
            console.log('No coordinates provided, cannot calculate distance. Housecall fee will be 0.');
        }

        if (customerLat !== null && customerLng !== null) {
            distance = haversineDistance(studioLat, studioLng, customerLat, customerLng);
            
            // Fetch housecall base fee and rate
            const feeRes = await client.query(
                "SELECT value FROM settings WHERE key IN ('housecall_base_fee', 'housecall_rate_per_km')"
            );
            const baseFee = parseFloat(feeRes.rows.find(r => r.key === 'housecall_base_fee').value);
            const ratePerKm = parseFloat(feeRes.rows.find(r => r.key === 'housecall_rate_per_km').value);
            
            housecallFee = baseFee + (distance * ratePerKm);
            totalPrice += housecallFee;
        }

        // 2. Create appointment (without service/package links)
        const appointmentRes = await client.query(
            `INSERT INTO appointments 
             (appointment_date, location_address, housecall_fee, distance_km, status, customer_info)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING id`,
            [appointmentDate, location, housecallFee, distance, 'pending', JSON.stringify(customerInfo)]
        );
        const appointmentId = appointmentRes.rows[0].id;

        // 3. Process each selected service
        for (const s of services) {
            const serviceRes = await client.query(
                'SELECT base_price, duration_minutes FROM services WHERE id = $1 AND is_active = true',
                [s.id]
            );
            if (serviceRes.rows.length === 0) {
                throw new Error(`Service ${s.id} not found`);
            }
            const { base_price, duration_minutes } = serviceRes.rows[0];
            const quantity = s.quantity || 1;

            totalPrice += base_price * quantity;
            totalDuration += duration_minutes * quantity;

            await client.query(
                `INSERT INTO appointment_services 
                 (appointment_id, service_id, quantity, price_at_time, duration_minutes)
                 VALUES ($1, $2, $3, $4, $5)`,
                [appointmentId, s.id, quantity, base_price, duration_minutes]
            );
        }

        // 4. Process package (if any)
        if (pkg) {
            const pkgRes = await client.query(
                'SELECT base_price, base_duration_minutes FROM packages WHERE id = $1 AND is_active = true',
                [pkg.id]
            );
            if (pkgRes.rows.length === 0) {
                throw new Error(`Package ${pkg.id} not found`);
            }
            const { base_price, base_duration_minutes } = pkgRes.rows[0];
            const quantity = pkg.quantity || 1;

            totalPrice += base_price * quantity;
            totalDuration += base_duration_minutes * quantity;

            await client.query(
                `INSERT INTO appointment_packages
                 (appointment_id, package_id, quantity, price_at_time, duration_minutes)
                 VALUES ($1, $2, $3, $4, $5)`,
                [appointmentId, pkg.id, quantity, base_price, base_duration_minutes]
            );
        }

        // 5. Process add-ons
        for (const a of addons) {
            const addonRes = await client.query(
                'SELECT price, duration_minutes FROM addons WHERE id = $1 AND is_active = true',
                [a.id]
            );
            if (addonRes.rows.length === 0) {
                throw new Error(`Addon ${a.id} not found`);
            }
            const { price, duration_minutes } = addonRes.rows[0];
            const quantity = a.quantity || 1;

            totalPrice += price * quantity;
            totalDuration += duration_minutes * quantity;

            await client.query(
                `INSERT INTO appointment_addons (appointment_id, addon_id, quantity)
                 VALUES ($1, $2, $3)`,
                [appointmentId, a.id, quantity]
            );
        }

        // 6. Update appointment with totals
        await client.query(
            `UPDATE appointments 
             SET total_price = $1, total_duration_minutes = $2 
             WHERE id = $3`,
            [totalPrice, totalDuration, appointmentId]
        );

        await client.query('COMMIT');

        res.status(201).json({
            success: true,
            message: 'Appointment booked successfully',
            data: {
                appointmentId,
                totalPrice,
                totalDuration,
                depositAmount: totalPrice * 0.5,
                housecallFee,
                distanceKm: distance
            }
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Booking error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to book appointment'
        });
    } finally {
        client.release();
    }
});

// Get all appointments (for admin)
router.get('/', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT a.*, 
              s.name as service_name,
              p.name as package_name,
              u.first_name, u.last_name, u.email, u.phone
       FROM appointments a
       LEFT JOIN services s ON a.service_id = s.id
       LEFT JOIN packages p ON a.package_id = p.id
       LEFT JOIN users u ON a.customer_id = u.id
       ORDER BY a.appointment_date DESC`
    );

    res.json({
      success: true,
      data: result.rows,
      count: result.rowCount
    });

  } catch (error) {
    console.error('Get appointments error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch appointments'
    });
  }
});

// Reschedule appointment
router.post('/:id/reschedule', async (req, res) => {
  try {
    const { id } = req.params;
    const { newDate, reason } = req.body;

    // Check if appointment exists
    const appointmentResult = await db.query(
      'SELECT * FROM appointments WHERE id = $1',
      [id]
    );

    if (appointmentResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Appointment not found'
      });
    }

    const appointment = appointmentResult.rows[0];

    // Check rescheduling policy (36 hours in advance)
    const appointmentDateTime = new Date(appointment.appointment_date);
    const now = new Date();
    const hoursDifference = (appointmentDateTime - now) / (1000 * 60 * 60);

    if (hoursDifference < 36) {
      return res.status(400).json({
        success: false,
        error: 'Rescheduling must be done at least 36 hours before the appointment'
      });
    }

    // Check reschedule count
    if (appointment.reschedule_count >= 1) {
      return res.status(400).json({
        success: false,
        error: 'Appointment can only be rescheduled once'
      });
    }

    // Update appointment
    const updateResult = await db.query(
      `UPDATE appointments 
       SET appointment_date = $1, reschedule_count = reschedule_count + 1, status = 'rescheduled'
       WHERE id = $2 
       RETURNING *`,
      [newDate, id]
    );

    res.json({
      success: true,
      message: 'Appointment rescheduled successfully',
      data: updateResult.rows[0]
    });

  } catch (error) {
    console.error('Reschedule error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reschedule appointment'
    });
  }
});

// Cancel appointment
router.post('/:id/cancel', async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const result = await db.query(
      `UPDATE appointments 
       SET status = 'cancelled' 
       WHERE id = $1 
       RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Appointment not found'
      });
    }

    res.json({
      success: true,
      message: 'Appointment cancelled successfully',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Cancel error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to cancel appointment'
    });
  }
});

module.exports = router;