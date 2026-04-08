-- Remove duplicate permissive RLS policies that Supabase flags as a performance issue.
-- Keep one public SELECT policy per table.
-- The app updates ingredient through the backend's server-side DB connection,
-- so no client-facing UPDATE policy is needed on public.ingredient.

DROP POLICY IF EXISTS "Allow public read" ON public.ingredient;
DROP POLICY IF EXISTS "Allow public read" ON public.ingredient_type;
DROP POLICY IF EXISTS "Allow public read" ON public.menu;
DROP POLICY IF EXISTS "Allow public read" ON public.menu_ingredient;
DROP POLICY IF EXISTS "Allow public read" ON public.menu_subtype;
DROP POLICY IF EXISTS "Allow public read" ON public.menu_type;

DROP POLICY IF EXISTS "Allow authenticated users to update ingredient" ON public.ingredient;
DROP POLICY IF EXISTS "Allow service_role update" ON public.ingredient;
DROP POLICY IF EXISTS "Allow authenticated and service_role update ingredient" ON public.ingredient;