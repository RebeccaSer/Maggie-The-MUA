const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Book new appointment
router.post('/book', async (req, res) => {
  try {
    const {
      serviceId,
      addons = [],
      quantity = 1,
      packageId,
      appointmentDate,
      location,
      customerInfo
    } = req.body;

    // Calculate total price and duration
    let totalPrice = 0;
    let totalDuration = 0;
    let transportFee = 0;

    // Get service details
    if (serviceId) {
      const serviceResult = await db.query(
        'SELECT base_price, duration_minutes FROM services WHERE id = $1 AND is_active = true',
        [serviceId]
      );

      if (serviceResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Service not found'
        });
      }

      const service = serviceResult.rows[0];
      totalPrice += service.base_price * quantity;
      totalDuration += service.duration_minutes * quantity;
    }

    // Get package details
    if (packageId) {
      const packageResult = await db.query(
        'SELECT base_price, base_duration_minutes, transport_fee FROM packages WHERE id = $1 AND is_active = true',
        [packageId]
      );

      if (packageResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Package not found'
        });
      }

      const package = packageResult.rows[0];
      totalPrice += package.base_price;
      totalDuration += package.base_duration_minutes;
      transportFee = package.transport_fee || 0;
    }

    // Add add-ons
    for (const addon of addons) {
      const addonResult = await db.query(
        'SELECT price, duration_minutes FROM addons WHERE id = $1 AND is_active = true',
        [addon.id]
      );

      if (addonResult.rows.length > 0) {
        const addonData = addonResult.rows[0];
        totalPrice += addonData.price * (addon.quantity || 1);
        totalDuration += addonData.duration_minutes * (addon.quantity || 1);
      }
    }

    // Add transport fee if location is specified
    if (location && location !== 'studio') {
      totalPrice += transportFee;
    }

    // Create appointment (without customer ID for now - would come from auth)
    const appointmentResult = await db.query(
      `INSERT INTO appointments (
        service_id, package_id, appointment_date, total_duration_minutes,
        total_price, quantity, location_address, transport_fee, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *`,
      [
        serviceId,
        packageId,
        appointmentDate,
        totalDuration,
        totalPrice,
        quantity,
        location,
        transportFee,
        'pending'
      ]
    );

    const appointment = appointmentResult.rows[0];

    // Add add-ons to appointment
    for (const addon of addons) {
      await db.query(
        'INSERT INTO appointment_addons (appointment_id, addon_id, quantity) VALUES ($1, $2, $3)',
        [appointment.id, addon.id, addon.quantity || 1]
      );
    }

    res.status(201).json({
      success: true,
      message: 'Appointment booked successfully',
      data: {
        appointment,
        totalPrice,
        totalDuration,
        depositAmount: totalPrice * 0.5 // 50% deposit
      }
    });

  } catch (error) {
    console.error('Booking error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to book appointment'
    });
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