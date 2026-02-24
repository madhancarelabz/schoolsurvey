import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { startSession } from '../api';
import MicStatus from '../components/MicStatus';

/**
 * Screen 2: Voice Session
 * Checklist: L56 (POST /session/start), L101 (Vapi Web SDK streaming)
 * Flow: Start session → Initialize Vapi → Voice survey → On call-end → /complete
 */

// Vapi public key — loaded from environment or hardcoded
// This is the PUBLIC key (safe for frontend)
const VAPI_PUBLIC_KEY = import.meta.env.VITE_VAPI_PUBLIC_KEY || '';
const VAPI_ASSISTANT_ID = import.meta.env.VITE_VAPI_ASSISTANT_ID || '';

function SessionPage() {
    const navigate = useNavigate();
    const vapiRef = useRef(null);
    const [status, setStatus] = useState('initializing'); // initializing | connecting | active | ended | error
    const [micActive, setMicActive] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const token = sessionStorage.getItem('survey_token');
        if (!token) {
            navigate('/', { replace: true });
            return;
        }

        initSession(token);

        // Cleanup on unmount
        return () => {
            if (vapiRef.current) {
                try { vapiRef.current.stop(); } catch (e) { /* ignore */ }
            }
        };
    }, []);

    async function initSession(token) {
        try {
            // Step 1: Start session (VERIFIED → IN_PROGRESS)
            setStatus('initializing');
            await startSession(token);

            // Step 2: Initialize Vapi Web SDK
            setStatus('connecting');

            // Dynamic import to keep bundle small if Vapi is not needed
            const { default: Vapi } = await import('@vapi-ai/web');
            const vapi = new Vapi(VAPI_PUBLIC_KEY);
            vapiRef.current = vapi;

            // Set up event listeners
            vapi.on('call-start', () => {
                setStatus('active');
                setMicActive(true);
            });

            vapi.on('speech-start', () => {
                setIsSpeaking(true);
            });

            vapi.on('speech-end', () => {
                setIsSpeaking(false);
            });

            vapi.on('call-end', () => {
                setStatus('ended');
                setMicActive(false);
                // Small delay before navigating to completion
                setTimeout(() => navigate('/complete', { replace: true }), 1500);
            });

            vapi.on('error', (err) => {
                console.error('Vapi error:', err);
                setError('Voice connection error. Please try again.');
                setStatus('error');
            });

            // Step 3: Start the voice call
            const sessionId = sessionStorage.getItem('survey_session_id');
            await vapi.start(VAPI_ASSISTANT_ID, {
                variableValues: { session_id: sessionId },
            });

        } catch (err) {
            console.error('Session init error:', err);
            setError(err.message);
            setStatus('error');
        }
    }

    // Retry on error
    const handleRetry = () => {
        setError('');
        const token = sessionStorage.getItem('survey_token');
        if (token) initSession(token);
    };

    return (
        <div className="page session-page">
            <div className="card session-card">
                <h2 className="title-ml">സർവേ നടക്കുന്നു</h2>
                <p className="subtitle">Voice Survey in Progress</p>

                <MicStatus
                    status={status}
                    micActive={micActive}
                    isSpeaking={isSpeaking}
                />

                {status === 'initializing' && (
                    <p className="status-text">സെഷൻ ആരംഭിക്കുന്നു...</p>
                )}

                {status === 'connecting' && (
                    <p className="status-text">വോയ്സ് കണക്ഷൻ സ്ഥാപിക്കുന്നു...</p>
                )}

                {status === 'active' && (
                    <p className="status-text">
                        {isSpeaking ? '🗣️ സംസാരിക്കുക...' : '🎧 കേൾക്കുന്നു...'}
                    </p>
                )}

                {status === 'ended' && (
                    <p className="status-text">സർവേ പൂർത്തിയായി ✅</p>
                )}

                {error && (
                    <div className="error-section">
                        <div className="error-banner">{error}</div>
                        <button className="btn btn-primary" onClick={handleRetry}>
                            വീണ്ടും ശ്രമിക്കുക
                        </button>
                    </div>
                )}

                <p className="hint-text">
                    ദയവായി ശാന്തമായ ഒരു സ്ഥലത്ത് ഇരുന്ന് സർവേ പൂർത്തിയാക്കുക
                </p>
            </div>
        </div>
    );
}

export default SessionPage;
