-- Fix the generate_court_code function search path
CREATE OR REPLACE FUNCTION public.generate_court_code()
RETURNS VARCHAR(8)
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  chars VARCHAR(36) := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  result VARCHAR(8) := '';
  i INT;
BEGIN
  FOR i IN 1..8 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  RETURN result;
END;
$$;