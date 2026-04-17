const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Get dashboard statistics
router.get('/dashboard', async (req, res) => {
  try {
    const appointmentsResult = await db.query(
      'SELECT COUNT(*) as total_appointments FROM appointments'
    );

    const todayAppointmentsResult = await db.query(
      `SELECT COUNT(*) as today_appointments 
       FROM appointments 
       WHERE DATE(appointment_date) = CURRENT_DATE`
    );

    const revenueResult = await db.query(
      `SELECT 
         COALESCE(SUM(total_price), 0) as total_revenue,
         COALESCE(SUM(deposit_amount), 0) as total_deposits
       FROM appointments 
       WHERE status IN ('confirmed', 'completed')`
    );

    const recentAppointmentsResult = await db.query(`
      SELECT a.*, u.first_name, u.last_name
      FROM appointments a
      LEFT JOIN users u ON a.customer_id = u.id
      ORDER BY a.created_at DESC
      LIMIT 5
    `);

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
    res.status(500).json({ success: false, error: 'Failed to fetch dashboard data' });
  }
});

// ========== APPOINTMENTS CRUD ==========
router.get('/appointments', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT a.*, 
             u.first_name, u.last_name, u.email, u.phone
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

// Update appointment status
router.put('/appointments/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const result = await db.query(
      'UPDATE appointments SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [status, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Appointment not found' });
    }
    
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Update appointment error:', error);
    res.status(500).json({ success: false, error: 'Failed to update appointment' });
  }
});


// ========== SERVICES CRUD ==========

// Get all services (admin)
router.get('/services', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM services ORDER BY name');
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Get services error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch services' });
  }
});

// Create new service
router.post('/services', async (req, res) => {
  try {
    const { name, description, base_price, duration_minutes, allow_quantity, category, is_active } = req.body;
    
    const result = await db.query(
      `INSERT INTO services (name, description, base_price, duration_minutes, allow_quantity, category, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [name, description, base_price, duration_minutes, allow_quantity || false, category || 'makeup', is_active !== false]
    );
    
    res.status(201).json({ success: true, message: 'Service created successfully', data: result.rows[0] });
  } catch (error) {
    console.error('Create service error:', error);
    res.status(500).json({ success: false, error: 'Failed to create service' });
  }
});

// Update service
router.put('/services/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, base_price, duration_minutes, allow_quantity, category, is_active } = req.body;
    
    const result = await db.query(
      `UPDATE services 
       SET name = $1, description = $2, base_price = $3, duration_minutes = $4, 
           allow_quantity = $5, category = $6, is_active = $7, updated_at = CURRENT_TIMESTAMP
       WHERE id = $8
       RETURNING *`,
      [name, description, base_price, duration_minutes, allow_quantity, category, is_active, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Service not found' });
    }
    
    res.json({ success: true, message: 'Service updated successfully', data: result.rows[0] });
  } catch (error) {
    console.error('Update service error:', error);
    res.status(500).json({ success: false, error: 'Failed to update service' });
  }
});

// Delete service
router.delete('/services/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await db.query('DELETE FROM services WHERE id = $1 RETURNING id', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Service not found' });
    }
    
    res.json({ success: true, message: 'Service deleted successfully' });
  } catch (error) {
    console.error('Delete service error:', error);
    res.status(500).json({ success: false, error: 'Failed to delete service' });
  }
});

// ========== ADD-ONs CRUD ==========

// Get all add-ons (admin)
router.get('/addons', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT a.*, s.name as service_name
      FROM addons a
      LEFT JOIN services s ON a.service_id = s.id
      ORDER BY a.name
    `);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Get addons error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch add-ons' });
  }
});

// Create add-on
router.post('/addons', async (req, res) => {
  try {
    const { name, description, price, duration_minutes, service_id, is_active } = req.body;
    
    const result = await db.query(
      `INSERT INTO addons (name, description, price, duration_minutes, service_id, is_active)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [name, description, price, duration_minutes, service_id || null, is_active !== false]
    );
    
    res.status(201).json({ success: true, message: 'Add-on created successfully', data: result.rows[0] });
  } catch (error) {
    console.error('Create addon error:', error);
    res.status(500).json({ success: false, error: 'Failed to create add-on' });
  }
});

// Update add-on
router.put('/addons/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, duration_minutes, service_id, is_active } = req.body;
    
    const result = await db.query(
      `UPDATE addons 
       SET name = $1, description = $2, price = $3, duration_minutes = $4, 
           service_id = $5, is_active = $6, updated_at = CURRENT_TIMESTAMP
       WHERE id = $7
       RETURNING *`,
      [name, description, price, duration_minutes, service_id, is_active, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Add-on not found' });
    }
    
    res.json({ success: true, message: 'Add-on updated successfully', data: result.rows[0] });
  } catch (error) {
    console.error('Update addon error:', error);
    res.status(500).json({ success: false, error: 'Failed to update add-on' });
  }
});

// Delete add-on
router.delete('/addons/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await db.query('DELETE FROM addons WHERE id = $1 RETURNING id', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Add-on not found' });
    }
    
    res.json({ success: true, message: 'Add-on deleted successfully' });
  } catch (error) {
    console.error('Delete addon error:', error);
    res.status(500).json({ success: false, error: 'Failed to delete add-on' });
  }
});

// ========== PROMOTIONS CRUD ==========
router.get('/promotions', async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM promotions ORDER BY created_at DESC');
        res.json({ success: true, data: result.rows });
    } catch (error) {
        console.error('Get promotions error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch promotions' });
    }
});

router.post('/promotions', async (req, res) => {
    try {
        const { name, description, discount_type, discount_value, applicable_services, applicable_packages, min_spend, start_date, end_date, is_active } = req.body;
        const result = await db.query(
            `INSERT INTO promotions 
             (name, description, discount_type, discount_value, applicable_services, applicable_packages, min_spend, start_date, end_date, is_active)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
             RETURNING *`,
            [name, description, discount_type, discount_value, applicable_services || null, applicable_packages || null, min_spend || 0, start_date, end_date, is_active !== false]
        );
        res.status(201).json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error('Create promotion error:', error);
        res.status(500).json({ success: false, error: 'Failed to create promotion' });
    }
});

router.put('/promotions/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, discount_type, discount_value, applicable_services, applicable_packages, min_spend, start_date, end_date, is_active } = req.body;
        const result = await db.query(
            `UPDATE promotions 
             SET name = $1, description = $2, discount_type = $3, discount_value = $4, 
                 applicable_services = $5, applicable_packages = $6, min_spend = $7, 
                 start_date = $8, end_date = $9, is_active = $10, updated_at = CURRENT_TIMESTAMP
             WHERE id = $11
             RETURNING *`,
            [name, description, discount_type, discount_value, applicable_services || null, applicable_packages || null, min_spend || 0, start_date, end_date, is_active, id]
        );
        if (result.rows.length === 0) return res.status(404).json({ success: false, error: 'Promotion not found' });
        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error('Update promotion error:', error);
        res.status(500).json({ success: false, error: 'Failed to update promotion' });
    }
});

router.delete('/promotions/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await db.query('DELETE FROM promotions WHERE id = $1 RETURNING id', [id]);
        if (result.rows.length === 0) return res.status(404).json({ success: false, error: 'Promotion not found' });
        res.json({ success: true, message: 'Promotion deleted' });
    } catch (error) {
        console.error('Delete promotion error:', error);
        res.status(500).json({ success: false, error: 'Failed to delete promotion' });
    }
});

module.exports = router;