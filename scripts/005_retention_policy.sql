-- AI Voice Survey - Phase 9: Audio Retention & Compliance
-- Requirement L138: Delete voice recordings after 90 days.
-- Requirement L140: Retain transcripts and results for 12 months.

-- 1. Retention Policy Script
-- This can be run manually or via a cron job.

-- Delete audio assets older than 90 days
-- Note: This only deletes metadata. A separate worker must delete from R2 storage using these URLs.
DELETE FROM audio_assets 
WHERE created_at < NOW() - INTERVAL '90 days';

-- Delete response records older than 12 months
DELETE FROM responses 
WHERE answered_at < NOW() - INTERVAL '12 months';

-- Delete results older than 12 months
DELETE FROM results 
WHERE computed_at < NOW() - INTERVAL '12 months';

-- 2. Audit Logging Logic (L144)
-- This function can be used to log admin access to results or audio.

CREATE OR REPLACE FUNCTION log_admin_access(
    admin_actor VARCHAR(100),
    access_action VARCHAR(100),
    target_uuid UUID,
    access_ip INET
) RETURNS VOID AS $$
BEGIN
    INSERT INTO audit_logs (actor, action, target_entity, target_id, ip_address, metadata)
    VALUES (admin_actor, access_action, 'RESULT_VIEW', target_uuid, access_ip, '{"access_type": "REPORT_VIEW"}');
END;
$$ LANGUAGE plpgsql;
