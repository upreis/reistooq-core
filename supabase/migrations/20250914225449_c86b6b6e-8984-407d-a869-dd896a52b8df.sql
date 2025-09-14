-- Remove columns related to advanced returns from pedidos table
ALTER TABLE public.pedidos 
DROP COLUMN IF EXISTS return_status,
DROP COLUMN IF EXISTS return_reason,
DROP COLUMN IF EXISTS return_date,
DROP COLUMN IF EXISTS return_id,
DROP COLUMN IF EXISTS claims_count,
DROP COLUMN IF EXISTS detailed_returns_count;