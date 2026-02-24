-- Migration: Add OTP support to sessions table
-- Phase 3: OTP & Security

ALTER TABLE sessions 
ADD COLUMN IF NOT EXISTS otp_hash VARCHAR(255),
ADD COLUMN IF NOT EXISTS failed_attempts INTEGER DEFAULT 0;
