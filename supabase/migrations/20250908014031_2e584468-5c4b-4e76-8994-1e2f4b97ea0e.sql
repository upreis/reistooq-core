-- Remove a sobrecarga ambígua que causa PGRST203
DROP FUNCTION IF EXISTS public.get_pedidos_masked(date, date, text, integer, integer);