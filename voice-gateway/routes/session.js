const express = require('express');
const router = express.Router();
const { pool } = require('../db'); // Fix: use standalone db module to avoid circular dependency
const auth = require('../middleware/auth');

/**
 * @route   POST /api/session/start
 * @desc    Start the survey session (Transition VERIFIED -> IN_PROGRESS)
 * @access  Private (JWT)
 */
router.post('/start', auth, async (req, res) => {
    const { session_id, employee_id } = req.user;

    try {
        // 1. Verify current status is VERIFIED
        const sessionRes = await pool.query(
            'SELECT status FROM sessions WHERE id = $1',
            [session_id]
        );

        if (sessionRes.rows.length === 0) {
            return res.status(404).json({ error: 'Session not found' });
        }

        const currentStatus = sessionRes.rows[0].status;

        if (currentStatus === 'COMPLETED') {
            return res.status(403).json({ error: 'Session already completed' });
        }

        if (currentStatus !== 'VERIFIED' && currentStatus !== 'IN_PROGRESS') {
            return res.status(403).json({ error: 'Session must be VERIFIED to start' });
        }

        // 2. Transition to IN_PROGRESS (Requirement 58)
        await pool.query(
            'UPDATE sessions SET status = $1, updated_at = NOW() WHERE id = $2',
            ['IN_PROGRESS', session_id]
        );

        // 3. Log the start in audit_logs
        await pool.query(
            'INSERT INTO audit_logs (actor, action, target_entity, target_id) VALUES ($1, $2, $3, $4)',
            [employee_id, 'SESSION_START', 'sessions', session_id]
        );

        res.status(200).json({
            message: 'Session started successfully',
            status: 'IN_PROGRESS'
        });

    } catch (err) {
        console.error('Session Start Error:', err);
        res.status(500).json({ error: 'Failed to start session' });
    }
});

module.exports = router;
