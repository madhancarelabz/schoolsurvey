import { useRef, useEffect } from 'react';

/**
 * 6-digit OTP input component
 * Each digit gets its own input box for better UX on mobile
 */
function OtpInput({ value, onChange, disabled }) {
    const inputRefs = useRef([]);
    const digits = value.padEnd(6, ' ').split('').slice(0, 6);

    useEffect(() => {
        // Focus first empty input
        const emptyIndex = digits.findIndex((d) => d === '' || d === ' ');
        if (emptyIndex >= 0 && inputRefs.current[emptyIndex]) {
            inputRefs.current[emptyIndex].focus();
        }
    }, []);

    const handleChange = (index, e) => {
        const val = e.target.value;
        if (val && !/^\d$/.test(val)) return; // Only digits

        const newDigits = [...digits];
        newDigits[index] = val;
        onChange(newDigits.join('').trim());

        // Auto-focus next input
        if (val && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (index, e) => {
        // Backspace: clear current and move back
        if (e.key === 'Backspace' && !digits[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handlePaste = (e) => {
        e.preventDefault();
        const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
        onChange(pasted);
    };

    return (
        <div className="otp-container" onPaste={handlePaste}>
            {digits.map((digit, i) => (
                <input
                    key={i}
                    ref={(el) => (inputRefs.current[i] = el)}
                    type="tel"
                    inputMode="numeric"
                    maxLength={1}
                    className="otp-digit"
                    value={digit === ' ' ? '' : digit}
                    onChange={(e) => handleChange(i, e)}
                    onKeyDown={(e) => handleKeyDown(i, e)}
                    disabled={disabled}
                    aria-label={`OTP digit ${i + 1}`}
                />
            ))}
        </div>
    );
}

export default OtpInput;
