const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Get dashboard statistics
router.get('/dashboard', async (req, res) => {
  try {
    // Get total appointments
    const appointmentsResult = await db.query(
      'SELECT COUNT(*) as total_appointments FROM appointments'
    );

    // Get today's appointments
    const todayAppointmentsResult = await db.query(
      `SELECT COUNT(*) as today_appointments 
       FROM appointments 
       WHERE DATE(appointment_date) = CURRENT_DATE`
    );

    // Get revenue stats
    const revenueResult = await db.query(
      `SELECT 
         COALESCE(SUM(total_price), 0) as total_revenue,
         COALESCE(SUM(deposit_amount), 0) as total_deposits
       FROM appointments 
       WHERE status IN ('confirmed', 'completed')`
    );

    // Get recent appointments
    const recentAppointmentsResult = await db.query(
      `SELECT a.*, s.name as service_name, u.first_name, u.last_name
       FROM appointments a
       LEFT JOIN services s ON a.service_id = s.id
       LEFT JOIN users u ON a.customer_id = u.id
       ORDER BY a.created_at DESC
       LIMIT 5`
    );

    res.json({
      success: true,
      data: {
        stats: {
          totalAppointments: parseInt(appointmentsResult.rows[0].total_appointments),
          todayAppointments: parseInt(todayAppointmentsResult.rows[0].today_appointments),
          totalRevenue: parseFloat(revenueResult.rows[0].total_revenue),
          totalDeposits: parseFloat(revenueResult.rows[0].total_deposits)
        },
        recentAppointments: recentAppointmentsResult.rows
      }
    });

  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch dashboard data'
    });
  }
});

// Manage services
router.get('/services', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM services ORDER BY name');
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Get services error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch services'
    });
  }
});

// Add new service
router.post('/services', async (req, res) => {
  try {
    const { name, description, base_price, duration_minutes, allow_quantity } = req.body;

    const result = await db.query(
      `INSERT INTO services (name, description, base_price, duration_minutes, allow_quantity)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [name, description, base_price, duration_minutes, allow_quantity || false]
    );

    res.status(201).json({
      success: true,
      message: 'Service created successfully',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Create service error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create service'
    });
  }
});

module.exports = router;