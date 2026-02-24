import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { sendOtp, verifyOtp } from '../api';
import OtpInput from '../components/OtpInput';

/**
 * Screen 1: OTP Login
 * Checklist: L39 (POST /otp/send), L41 (POST /otp/verify)
 * Flow: Employee ID → Send OTP → Enter OTP → Verify → JWT → Navigate to /session
 */
function LoginPage() {
    const navigate = useNavigate();
    const [employeeId, setEmployeeId] = useState('');
    const [otpSent, setOtpSent] = useState(false);
    const [otpCode, setOtpCode] = useState('');
    const [sessionId, setSessionId] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Step 1: Send OTP
    const handleSendOtp = async (e) => {
        e.preventDefault();
        if (!employeeId.trim()) return;

        setLoading(true);
        setError('');

        try {
            const data = await sendOtp(employeeId.trim());
            setSessionId(data.session_id);
            setOtpSent(true);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Step 2: Verify OTP
    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        if (!otpCode || otpCode.length !== 6) return;

        setLoading(true);
        setError('');

        try {
            const data = await verifyOtp(employeeId.trim(), otpCode);
            // Store JWT in sessionStorage (cleared when browser tab closes)
            sessionStorage.setItem('survey_token', data.token);
            sessionStorage.setItem('survey_session_id', sessionId);
            sessionStorage.setItem('survey_employee_id', employeeId.trim());
            // Navigate to voice session
            navigate('/session');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="page login-page">
            <div className="card">
                <div className="logo-section">
                    <h1 className="title-ml">സ്കൂൾ ജീവനക്കാരുടെ സർവേ</h1>
                    <p className="subtitle">AI Voice Survey System</p>
                </div>

                {error && <div className="error-banner">{error}</div>}

                {!otpSent ? (
                    /* Step 1: Employee ID Form */
                    <form onSubmit={handleSendOtp}>
                        <label className="input-label" htmlFor="employeeId">
                            ജീവനക്കാരന്റെ ഐഡി
                            <span className="label-en">Employee ID</span>
                        </label>
                        <input
                            id="employeeId"
                            type="text"
                            className="input-field"
                            placeholder="EMP001"
                            value={employeeId}
                            onChange={(e) => setEmployeeId(e.target.value)}
                            autoComplete="off"
                            autoFocus
                            disabled={loading}
                        />
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={loading || !employeeId.trim()}
                        >
                            {loading ? 'അയക്കുന്നു...' : 'OTP അയക്കുക'}
                        </button>
                    </form>
                ) : (
                    /* Step 2: OTP Verification Form */
                    <form onSubmit={handleVerifyOtp}>
                        <p className="otp-info">
                            OTP അയച്ചു — <strong>{employeeId}</strong>
                        </p>
                        <label className="input-label" htmlFor="otpInput">
                            OTP നൽകുക
                            <span className="label-en">Enter OTP</span>
                        </label>
                        <OtpInput value={otpCode} onChange={setOtpCode} disabled={loading} />
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={loading || otpCode.length !== 6}
                        >
                            {loading ? 'പരിശോധിക്കുന്നു...' : 'സ്ഥിരീകരിക്കുക'}
                        </button>
                        <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={() => { setOtpSent(false); setOtpCode(''); setError(''); }}
                            disabled={loading}
                        >
                            തിരികെ പോകുക
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}

export default LoginPage;
