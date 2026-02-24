import { useEffect } from 'react';

/**
 * Screen 3: Survey Complete
 * Shows thank you message after survey is done.
 * No scores shown — scores go to Chatwoot for HR only.
 */
function CompletePage() {
    useEffect(() => {
        // Clear session data
        sessionStorage.removeItem('survey_token');
        sessionStorage.removeItem('survey_session_id');
        sessionStorage.removeItem('survey_employee_id');
    }, []);

    return (
        <div className="page complete-page">
            <div className="card">
                <div className="complete-icon">✅</div>
                <h2 className="title-ml">നന്ദി!</h2>
                <p className="complete-message">
                    നിങ്ങളുടെ സർവേ വിജയകരമായി സമർപ്പിച്ചിരിക്കുന്നു.
                </p>
                <p className="subtitle">Your survey has been submitted successfully.</p>
                <p className="complete-note">
                    നിങ്ങളുടെ പ്രതികരണങ്ങൾ സുരക്ഷിതമായി രേഖപ്പെടുത്തിയിട്ടുണ്ട്.
                </p>
                <p className="hint-text">ഈ ടാബ് ഇപ്പോൾ അടയ്ക്കാവുന്നതാണ്.</p>
            </div>
        </div>
    );
}

export default CompletePage;
