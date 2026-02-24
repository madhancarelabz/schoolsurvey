/**
 * API Helper — Voice Gateway Endpoints
 * All calls go through /api/ which nginx proxies to voice-gateway:3000
 */

const API_BASE = '/api';

/**
 * Send OTP to employee
 * POST /api/otp/send
 * @param {string} employeeId - Employee ID (e.g., "EMP001")
 * @returns {{ message: string, session_id: string }}
 */
export async function sendOtp(employeeId) {
    const res = await fetch(`${API_BASE}/otp/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employee_id: employeeId }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to send OTP');
    return data;
}

/**
 * Verify OTP and receive JWT
 * POST /api/otp/verify
 * @param {string} employeeId - Employee ID
 * @param {string} otpCode - 6-digit OTP
 * @returns {{ message: string, token: string }}
 */
export async function verifyOtp(employeeId, otpCode) {
    // Generate a basic device fingerprint for soft check (L51)
    const deviceFingerprint = `${navigator.userAgent}-${screen.width}x${screen.height}`;

    const res = await fetch(`${API_BASE}/otp/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            employee_id: employeeId,
            otp_code: otpCode,
            device_fingerprint: deviceFingerprint,
        }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'OTP verification failed');
    return data;
}

/**
 * Start survey session (VERIFIED → IN_PROGRESS)
 * POST /api/session/start
 * @param {string} token - JWT from OTP verification
 * @returns {{ message: string, status: string }}
 */
export async function startSession(token) {
    const res = await fetch(`${API_BASE}/session/start`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to start session');
    return data;
}
