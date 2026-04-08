-- Add configurable add-on price per ingredient for admin management.
ALTER TABLE public.ingredient
ADD COLUMN IF NOT EXISTS addon_price numeric(10,2) NOT NULL DEFAULT 5;

-- Mock add-on prices for demo/testing.
-- Keep this rerunnable and safe for existing data.
UPDATE public.ingredient
SET addon_price = 5
WHERE ingredient_type = 'T01'
	AND (addon_price IS NULL OR addon_price = 0);

UPDATE public.ingredient
SET addon_price = CASE ingredient_id
	WHEN 'IGD1001' THEN 8   -- Coffee Beans
	WHEN 'IGD1002' THEN 8   -- Green Tea Powder
	WHEN 'IGD1003' THEN 10  -- Fresh Milk
	WHEN 'IGD1004' THEN 5   -- Simple Syrup
	WHEN 'IGD1006' THEN 7   -- Black Tea Leaves
	WHEN 'IGD1009' THEN 12  -- Chocolate Syrup
	WHEN 'IGD1010' THEN 6   -- Lemon Juice
	WHEN 'IGD1011' THEN 10  -- Caramel Syrup
	WHEN 'IGD1012' THEN 6   -- Soda Water
	ELSE addon_price
END
WHERE ingredient_id IN (
	'IGD1001','IGD1002','IGD1003','IGD1004','IGD1006',
	'IGD1009','IGD1010','IGD1011','IGD1012'
);
