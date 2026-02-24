const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { pool } = require('../server'); // We'll need to export pool from server.js
const { generateOTP, hashOTP, compareOTP } = require('../utils/otp');

/**
 * @route   POST /api/otp/send
 * @desc    Generate and send OTP for an employee
 * @access  Public
 */
router.post('/send', async (req, res) => {
    const { employee_id } = req.body;

    if (!employee_id) {
        return res.status(400).json({ error: 'employee_id is required' });
    }

    try {
        // 1. Check if an active session exists
        let sessionRes = await pool.query(
            'SELECT id, status FROM sessions WHERE employee_id = $1 AND status NOT IN ($2, $3, $4)',
            [employee_id, 'COMPLETED', 'LOCKED', 'EXPIRED']
        );

        let session;
        if (sessionRes.rows.length === 0) {
            // Create new session
            const sessionToken = Math.random().toString(36).substring(2, 15);
            const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000); // 72 hours

            const insertRes = await pool.query(
                'INSERT INTO sessions (employee_id, session_token, expires_at) VALUES ($1, $2, $3) RETURNING *',
                [employee_id, sessionToken, expiresAt]
            );
            session = insertRes.rows[0];
        } else {
            session = sessionRes.rows[0];
        }

        // 2. Generate OTP
        const otp = generateOTP();
        const otp_hash = await hashOTP(otp);

        // 3. Update session with OTP hash
        await pool.query(
            'UPDATE sessions SET otp_hash = $1, failed_attempts = 0, updated_at = NOW() WHERE id = $2',
            [otp_hash, session.id]
        );

        // 4. Mock Gateway - Log to console
        console.log(`[MOCK GATEWAY] OTP for ${employee_id}: ${otp}`);

        res.status(200).json({
            message: 'OTP sent successfully (Mock mode)',
            session_id: session.id
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * @route   POST /api/otp/verify
 * @desc    Verify OTP and return JWT
 * @access  Public
 */
router.post('/verify', async (req, res) => {
    const { employee_id, otp_code, device_fingerprint } = req.body;

    if (!employee_id || !otp_code) {
        return res.status(400).json({ error: 'employee_id and otp_code are required' });
    }

    try {
        const sessionRes = await pool.query(
            'SELECT * FROM sessions WHERE employee_id = $1 AND status NOT IN ($2, $3, $4)',
            [employee_id, 'COMPLETED', 'LOCKED', 'EXPIRED']
        );

        if (sessionRes.rows.length === 0) {
            return res.status(404).json({ error: 'No active session found for this employee' });
        }

        const session = sessionRes.rows[0];

        // 1. Check lockout
        if (session.failed_attempts >= 5) {
            await pool.query('UPDATE sessions SET status = $1 WHERE id = $2', ['LOCKED', session.id]);
            return res.status(403).json({ error: 'Session locked due to too many failed attempts' });
        }

        // 2. REQUIREMENT 51: Strict 72-hour expiry check
        if (new Date(session.expires_at) < new Date()) {
            await pool.query('UPDATE sessions SET status = $1 WHERE id = $2', ['EXPIRED', session.id]);
            return res.status(403).json({ error: 'Session has expired (72h limit reached)' });
        }

        // 3. Verify OTP
        const isValid = await compareOTP(otp_code, session.otp_hash);

        if (!isValid) {
            await pool.query('UPDATE sessions SET failed_attempts = failed_attempts + 1 WHERE id = $1', [session.id]);
            if (session.failed_attempts + 1 >= 5) {
                await pool.query('UPDATE sessions SET status = $1 WHERE id = $2', ['LOCKED', session.id]);
                return res.status(403).json({ error: 'Session locked due to too many failed attempts' });
            }
            return res.status(401).json({ error: 'Invalid OTP' });
        }

        // 4. REQUIREMENT 53: Soft device fingerprint check (Warning only)
        if (device_fingerprint && session.device_fingerprint && device_fingerprint !== session.device_fingerprint) {
            await pool.query(
                'INSERT INTO audit_logs (actor, action, target_entity, target_id, metadata) VALUES ($1, $2, $3, $4, $5)',
                [employee_id, 'FINGERPRINT_MISMATCH', 'sessions', session.id, JSON.stringify({ old: session.device_fingerprint, new: device_fingerprint })]
            );
            console.warn(`[SECURITY WARNING] Device mismatch for employee ${employee_id}`);
        }

        // 5. Success - Transition to VERIFIED
        await pool.query(
            'UPDATE sessions SET status = $1, failed_attempts = 0, device_fingerprint = $2, updated_at = NOW() WHERE id = $3',
            ['VERIFIED', device_fingerprint || session.device_fingerprint, session.id]
        );

        // 4. Generate JWT
        const token = jwt.sign(
            {
                session_id: session.id,
                employee_id: session.employee_id
            },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        res.status(200).json({
            message: 'Verification successful',
            token
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
