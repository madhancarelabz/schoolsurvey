/**
 * Microphone status indicator for voice session
 * Shows visual feedback: idle, listening, speaking, error
 */
function MicStatus({ status, micActive, isSpeaking }) {
    const getStatusClass = () => {
        if (status === 'error') return 'mic-error';
        if (status === 'ended') return 'mic-ended';
        if (isSpeaking) return 'mic-speaking';
        if (micActive) return 'mic-active';
        return 'mic-idle';
    };

    const getIcon = () => {
        if (status === 'error') return '❌';
        if (status === 'ended') return '✅';
        if (isSpeaking) return '🗣️';
        if (micActive) return '🎤';
        if (status === 'connecting') return '📡';
        return '⏳';
    };

    return (
        <div className={`mic-status ${getStatusClass()}`}>
            <div className="mic-icon-wrapper">
                <span className="mic-icon">{getIcon()}</span>
                {micActive && <div className="mic-pulse" />}
            </div>
        </div>
    );
}

export default MicStatus;
