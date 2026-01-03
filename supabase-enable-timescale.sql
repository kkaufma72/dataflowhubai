-- Enable TimescaleDB extension on your Supabase database
-- Run this in Supabase SQL Editor

-- Enable the TimescaleDB extension
CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;

-- Verify it's installed
SELECT extname, extversion FROM pg_extension WHERE extname = 'timescaledb';

-- Now your metrics table can use TimescaleDB hypertables
-- Your backend will automatically use the same PostgreSQL database for TimescaleDB
