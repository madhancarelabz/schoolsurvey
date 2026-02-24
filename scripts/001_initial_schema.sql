-- AI Voice Survey System — Initial Schema
-- Phase 2: Database & Schema Design

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- State Machine Enum
DO $$ BEGIN
    CREATE TYPE session_status AS ENUM ('ISSUED', 'VERIFIED', 'IN_PROGRESS', 'COMPLETED', 'EXPIRED', 'LOCKED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Asset Type Enum
DO $$ BEGIN
    CREATE TYPE asset_type AS ENUM ('ANSWER', 'CONFIRMATION');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 1. Sessions Table
CREATE TABLE IF NOT EXISTS sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id VARCHAR(50) NOT NULL,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    status session_status DEFAULT 'ISSUED',
    device_fingerprint TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    role VARCHAR(50), -- TEACHING_STAFF, NON_TEACHING_STAFF
    
    -- Constraint: 72-hour absolute expiry
    CONSTRAINT session_expiry_check CHECK (expires_at <= created_at + INTERVAL '72 hours')
);

-- 2. Responses Table
CREATE TABLE IF NOT EXISTS responses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    question_id VARCHAR(100) NOT NULL,
    selected_option INTEGER,
    score DECIMAL(5,2),
    category VARCHAR(50),
    confirmed BOOLEAN DEFAULT FALSE,
    answered_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Ensure one response per question per session
    UNIQUE(session_id, question_id)
);

-- 3. Audio Assets Table
CREATE TABLE IF NOT EXISTS audio_assets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    response_id UUID NOT NULL REFERENCES responses(id) ON DELETE CASCADE,
    asset_type asset_type NOT NULL,
    storage_url TEXT NOT NULL,
    duration_seconds DECIMAL(8,2),
    sha256_hash VARCHAR(64) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Results Table (Final Computed scores)
CREATE TABLE IF NOT EXISTS results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID UNIQUE NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    mindset_score DECIMAL(5,2),
    toolset_score DECIMAL(5,2),
    skillset_score DECIMAL(5,2),
    total_score DECIMAL(5,2),
    summary TEXT,
    recommendation TEXT,
    computed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Audit Logs (Immutable)
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    actor VARCHAR(100),
    action VARCHAR(100) NOT NULL,
    target_entity VARCHAR(100),
    target_id UUID,
    metadata JSONB DEFAULT '{}',
    ip_address INET,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_sessions_employee ON sessions(employee_id);
CREATE INDEX IF NOT EXISTS idx_responses_session ON responses(session_id);
CREATE INDEX IF NOT EXISTS idx_audio_assets_response ON audio_assets(response_id);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at);

-- Trigger: Update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_sessions_updated_at
    BEFORE UPDATE ON sessions
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

-- Integrity Rule: Prevent updates to responses for COMPLETED sessions
CREATE OR REPLACE FUNCTION block_completed_session_updates()
RETURNS TRIGGER AS $$
BEGIN
    IF (SELECT status FROM sessions WHERE id = OLD.session_id) = 'COMPLETED' THEN
        RAISE EXCEPTION 'Cannot modify responses for a completed session';
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER protect_completed_responses
    BEFORE UPDATE OR DELETE ON responses
    FOR EACH ROW
    EXECUTE PROCEDURE block_completed_session_updates();
