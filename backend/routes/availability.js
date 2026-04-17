const express = require('express');
const router = express.Router();
const db = require('../config/database');

// ========== FULL-DAY BLOCKS ==========
router.get('/', async (req, res) => {
    try {
        const result = await db.query('SELECT unavailable_date, reason FROM artist_availability ORDER BY unavailable_date');
        res.json({ success: true, data: result.rows });
    } catch (error) {
        console.error('Error fetching availability:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch availability' });
    }
});

router.post('/block', async (req, res) => {
    try {
        const { date, reason } = req.body;
        const result = await db.query(
            'INSERT INTO artist_availability (unavailable_date, reason) VALUES ($1, $2) ON CONFLICT (unavailable_date) DO NOTHING RETURNING *',
            [date, reason]
        );
        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error('Error blocking date:', error);
        res.status(500).json({ success: false, error: 'Failed to block date' });
    }
});

router.delete('/block/:date', async (req, res) => {
    try {
        const { date } = req.params;
        await db.query('DELETE FROM artist_availability WHERE unavailable_date = $1', [date]);
        res.json({ success: true });
    } catch (error) {
        console.error('Error unblocking date:', error);
        res.status(500).json({ success: false, error: 'Failed to unblock date' });
    }
});

// Check full-day availability (used by booking page)
router.get('/check/:date', async (req, res) => {
    try {
        const { date } = req.params;
        const result = await db.query(
            'SELECT EXISTS(SELECT 1 FROM artist_availability WHERE unavailable_date = $1) as is_blocked',
            [date]
        );
        res.json({ success: true, isAvailable: !result.rows[0].is_blocked });
    } catch (error) {
        console.error('Error checking availability:', error);
        res.status(500).json({ success: false, error: 'Failed to check availability' });
    }
});

// ========== TIME-SLOT BLOCKS ==========
router.get('/slots', async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM blocked_slots ORDER BY block_date, start_time');
        res.json({ success: true, data: result.rows });
    } catch (error) {
        console.error('Error fetching blocked slots:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch blocked slots' });
    }
});

router.post('/slots', async (req, res) => {
    try {
        const { block_date, start_time, end_time, reason } = req.body;
        const result = await db.query(
            `INSERT INTO blocked_slots (block_date, start_time, end_time, reason)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (block_date, start_time) DO NOTHING
             RETURNING *`,
            [block_date, start_time, end_time, reason]
        );
        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error('Error blocking slot:', error);
        res.status(500).json({ success: false, error: 'Failed to block slot' });
    }
});

router.delete('/slots/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await db.query('DELETE FROM blocked_slots WHERE id = $1 RETURNING id', [id]);
        if (result.rows.length === 0) return res.status(404).json({ success: false, error: 'Slot not found' });
        res.json({ success: true, message: 'Slot unblocked' });
    } catch (error) {
        console.error('Error unblocking slot:', error);
        res.status(500).json({ success: false, error: 'Failed to unblock slot' });
    }
});

router.get('/check/:date/:time', async (req, res) => {
    try {
        const { date, time } = req.params;
        // First check full-day block
        const fullDayBlock = await db.query(
            'SELECT EXISTS(SELECT 1 FROM artist_availability WHERE unavailable_date = $1) as is_blocked',
            [date]
        );
        if (fullDayBlock.rows[0].is_blocked) {
            return res.json({ success: true, isAvailable: false, reason: 'Artist unavailable all day' });
        }
        // Then check time‑specific block
        const slotBlock = await db.query(
            `SELECT EXISTS(
                SELECT 1 FROM blocked_slots 
                WHERE block_date = $1 AND $2 BETWEEN start_time AND end_time
            ) as is_blocked`,
            [date, time]
        );
        res.json({ success: true, isAvailable: !slotBlock.rows[0].is_blocked });
    } catch (error) {
        console.error('Error checking availability:', error);
        res.status(500).json({ success: false, error: 'Failed to check availability' });
    }
});

module.exports = router;