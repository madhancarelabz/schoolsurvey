-- AI Voice Survey - Manual Patch 002
-- Phase 4 Fix: Align audio_assets with Voice Gateway logic

ALTER TABLE audio_assets 
ALTER COLUMN response_id DROP NOT NULL;

-- Ensure helper columns exist (they seem to exist on VPS but good for consistency)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='audio_assets' AND column_name='session_id') THEN
        ALTER TABLE audio_assets ADD COLUMN session_id UUID;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='audio_assets' AND column_name='employee_id') THEN
        ALTER TABLE audio_assets ADD COLUMN employee_id VARCHAR(50);
    END IF;
END $$;
