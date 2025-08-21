-- Add redirect_uri column to oauth_states for consistency
ALTER TABLE public.oauth_states 
ADD COLUMN IF NOT EXISTS redirect_uri text;

-- Ensure pgcrypto extension is available
CREATE EXTENSION IF NOT EXISTS pgcrypto;