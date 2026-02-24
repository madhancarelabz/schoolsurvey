-- AI Voice Survey System — Manual Patch 001
-- Adds the missing 'role' column to the sessions table for Phase 5 routing.

ALTER TABLE sessions 
ADD COLUMN IF NOT EXISTS role VARCHAR(50);

-- Optional: Set a default role for existing sessions if needed
-- UPDATE sessions SET role = 'TEACHING_STAFF' WHERE role IS NULL;
