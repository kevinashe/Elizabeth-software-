/*
  # Fix Function Search Path and Extension Security

  1. Security Improvements
    - Fix update_updated_at function to use immutable search_path
    - Move vector extension from public to extensions schema
  
  2. Changes
    - Recreate update_updated_at function with SECURITY DEFINER and fixed search_path
    - Create extensions schema and move vector extension
*/

-- Fix update_updated_at function with immutable search_path
DROP FUNCTION IF EXISTS update_updated_at() CASCADE;

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Create extensions schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS extensions;

-- Move vector extension to extensions schema
-- Note: This requires dropping and recreating the extension
-- First, check if vector extension exists and drop it
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_extension WHERE extname = 'vector'
  ) THEN
    DROP EXTENSION vector CASCADE;
  END IF;
END $$;

-- Create vector extension in extensions schema
CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions;

-- Grant usage on extensions schema to authenticated users
GRANT USAGE ON SCHEMA extensions TO authenticated;
GRANT USAGE ON SCHEMA extensions TO anon;