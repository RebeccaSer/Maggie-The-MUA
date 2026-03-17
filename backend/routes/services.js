const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Get all active services
router.get('/', async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM services WHERE is_active = true ORDER BY name'
    );
    res.json({
      success: true,
      data: result.rows,
      count: result.rowCount
    });
  } catch (error) {
    console.error('Error fetching services:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch services'
    });
  }
});

// Get all active add-ons
router.get('/addons', async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM addons WHERE is_active = true ORDER BY name'
    );
    res.json({
      success: true,
      data: result.rows,
      count: result.rowCount
    });
  } catch (error) {
    console.error('Error fetching addons:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch addons'
    });
  }
});

// Get all active packages
router.get('/packages', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT p.*, 
              json_agg(
                json_build_object(
                  'id', ps.service_id,
                  'name', s.name,
                  'quantity', ps.quantity
                )
              ) as services
       FROM packages p
       LEFT JOIN package_services ps ON p.id = ps.package_id
       LEFT JOIN services s ON ps.service_id = s.id
       WHERE p.is_active = true
       GROUP BY p.id
       ORDER BY p.name`
    );
    res.json({
      success: true,
      data: result.rows,
      count: result.rowCount
    });
  } catch (error) {
    console.error('Error fetching packages:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch packages'
    });
  }
});

module.exports = router;