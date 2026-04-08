-- Migration: เพิ่มคอลัมน์ multi-language (ไทย/อังกฤษ) ให้ทุกตารางหลัก
-- แนวทางของสคริปต์นี้:
-- 1) คอลัมน์เดิมของระบบยังคงใช้ค่าอังกฤษไว้ เพื่อไม่กระทบโค้ดเดิมและไม่ชน NOT NULL
-- 2) ลบคอลัมน์ generic เดิม เช่น name_th/name_en แล้วใช้ชื่อคอลัมน์แบบ explicit ต่อ table
-- 3) ใช้ IF EXISTS / IF NOT EXISTS และ UPSERT เพื่อให้รันซ้ำได้

-- 1. ingredient
ALTER TABLE ingredient
  DROP COLUMN IF EXISTS ingredient_name,
  DROP COLUMN IF EXISTS unit,
  DROP COLUMN IF EXISTS name_th,
  DROP COLUMN IF EXISTS name_en,
  DROP COLUMN IF EXISTS unit_th,
  DROP COLUMN IF EXISTS unit_en,
  ADD COLUMN IF NOT EXISTS ingredient_name_th TEXT,
  ADD COLUMN IF NOT EXISTS ingredient_name_en TEXT,
  ADD COLUMN IF NOT EXISTS unit_th TEXT,
  ADD COLUMN IF NOT EXISTS unit_en TEXT;

-- 2. ingredient_type
ALTER TABLE ingredient_type
  DROP COLUMN IF EXISTS type_name,
  DROP COLUMN IF EXISTS name_th,
  DROP COLUMN IF EXISTS name_en,
  ADD COLUMN IF NOT EXISTS type_name_th TEXT,
  ADD COLUMN IF NOT EXISTS type_name_en TEXT;

-- 3. menu
ALTER TABLE menu
  DROP COLUMN IF EXISTS menu_name,
  DROP COLUMN IF EXISTS name_th,
  DROP COLUMN IF EXISTS name_en,
  ADD COLUMN IF NOT EXISTS menu_name_th TEXT,
  ADD COLUMN IF NOT EXISTS menu_name_en TEXT;

-- 4. menu_type
ALTER TABLE menu_type
  DROP COLUMN IF EXISTS type_name,
  DROP COLUMN IF EXISTS name_th,
  DROP COLUMN IF EXISTS name_en,
  ADD COLUMN IF NOT EXISTS type_name_th TEXT,
  ADD COLUMN IF NOT EXISTS type_name_en TEXT;

-- 5. menu_subtype
ALTER TABLE menu_subtype
  DROP COLUMN IF EXISTS subtype_name,
  DROP COLUMN IF EXISTS name_th,
  DROP COLUMN IF EXISTS name_en,
  ADD COLUMN IF NOT EXISTS subtype_name_th TEXT,
  ADD COLUMN IF NOT EXISTS subtype_name_en TEXT;

-- 6. menu_ingredient (ถ้าต้องการ unit multi-language)
-- ALTER TABLE menu_ingredient
--   ADD COLUMN unit_th TEXT,
--   ADD COLUMN unit_en TEXT;

-- ingredient: ใช้เฉพาะชื่อแบบ explicit
INSERT INTO ingredient (ingredient_id, ingredient_type, stock_qty, duration, ingredient_name_th, ingredient_name_en, unit_th, unit_en) VALUES
('IGD1001', 'T01', 970, 8, 'เมล็ดกาแฟ', 'Coffee Beans', 'กรัม', 'g'),
('IGD1002', 'T01', 100, 8, 'ผงชาเขียว', 'Green Tea Powder', 'กรัม', 'g'),
('IGD1003', 'T01', 100, 5, 'นมสด', 'Fresh Milk', 'มล.', 'ml'),
('IGD1004', 'T01', 100, 5, 'ไซรัปน้ำตาล', 'Simple Syrup', 'มล.', 'ml'),
('IGD1005', 'T01', 900, 3, 'น้ำเปล่า', 'Water', 'มล.', 'ml'),
('IGD1006', 'T01', 1000, 8, 'ใบชาดำ', 'Black Tea Leaves', 'กรัม', 'g'),
('IGD1007', 'T01', 1000, 3, 'น้ำตาลทราย', 'Granulated Sugar', 'กรัม', 'g'),
('IGD1008', 'T01', 10000, 2, 'น้ำแข็ง', 'Ice Cubes', 'กรัม', 'g'),
('IGD1009', 'T01', 1000, 5, 'ไซรัปช็อกโกแลต', 'Chocolate Syrup', 'มล.', 'ml'),
('IGD1010', 'T01', 1000, 5, 'น้ำมะนาว', 'Lemon Juice', 'มล.', 'ml'),
('IGD1011', 'T01', 1000, 5, 'ไซรัปคาราเมล', 'Caramel Syrup', 'มล.', 'ml'),
('IGD1012', 'T01', 1000, 3, 'โซดา', 'Soda Water', 'มล.', 'ml'),
('IGD2001', 'T02', 498, 0, 'หลอด', 'Drinking Straw', 'ชิ้น', 'pieces'),
('IGD2002', 'T02', 498, 0, 'ฝาโดม', 'Dome Lid', 'ชิ้น', 'pieces'),
('IGD2003', 'T02', 497, 0, 'แก้วพลาสติก', 'Plastic Cup', 'ชิ้น', 'pieces')
ON CONFLICT (ingredient_id) DO UPDATE SET
  ingredient_type = EXCLUDED.ingredient_type,
  stock_qty = EXCLUDED.stock_qty,
  duration = EXCLUDED.duration,
  ingredient_name_th = EXCLUDED.ingredient_name_th,
  ingredient_name_en = EXCLUDED.ingredient_name_en,
  unit_th = EXCLUDED.unit_th,
  unit_en = EXCLUDED.unit_en;

-- ingredient_type: ใช้เฉพาะชื่อแบบ explicit
INSERT INTO ingredient_type (type_id, type_name_th, type_name_en) VALUES
('T01', 'วัตถุดิบเครื่องดื่ม', 'Beverage Ingredient'),
('T02', 'อุปกรณ์', 'Equipment')
ON CONFLICT (type_id) DO UPDATE SET
  type_name_th = EXCLUDED.type_name_th,
  type_name_en = EXCLUDED.type_name_en;

-- menu: ใช้เฉพาะชื่อแบบ explicit
INSERT INTO menu (menu_id, menu_name_th, menu_name_en, menu_type, menu_subtype, has_milk, price, duration) VALUES
('M00101', 'เอสเปรสโซ่', 'Espresso', 'T01', 'S01', false, 40, 30),
('M00102', 'เอสเปรสโซ่', 'Espresso', 'T01', 'S02', false, 45, 30),
('M00201', 'อเมริกาโน่', 'Americano', 'T01', 'S01', false, 45, 30),
('M00202', 'อเมริกาโน่', 'Americano', 'T01', 'S02', false, 50, 30),
('M00203', 'อเมริกาโน่', 'Americano', 'T01', 'S03', false, 55, 30),
('M00301', 'ลาเต้', 'Latte', 'T01', 'S01', true, 50, 35),
('M00302', 'ลาเต้', 'Latte', 'T01', 'S02', true, 55, 35),
('M00303', 'ลาเต้', 'Latte', 'T01', 'S03', true, 60, 35),
('M00401', 'กรีนทีลาเต้', 'Green Tea Latte', 'T02', 'S01', true, 55, 35),
('M00402', 'กรีนทีลาเต้', 'Green Tea Latte', 'T02', 'S02', true, 60, 35),
('M00403', 'กรีนทีลาเต้', 'Green Tea Latte', 'T02', 'S03', true, 65, 35),
('M00501', 'ชาดำ', 'Black Tea', 'T02', 'S01', false, 40, 30),
('M00502', 'ชาดำ', 'Black Tea', 'T02', 'S02', false, 45, 30),
('M00503', 'ชาดำ', 'Black Tea', 'T02', 'S03', false, 50, 30),
('M00602', 'เลมอนโซดา', 'Lemon Soda', 'T03', 'S02', false, 50, 20),
('M00702', 'ช็อกโกแลตเย็น', 'Iced Chocolate', 'T04', 'S02', true, 60, 20),
('M00801', 'คาราเมลมัคคิอาโต้', 'Caramel Macchiato', 'T01', 'S01', true, 65, 40),
('M00802', 'คาราเมลมัคคิอาโต้', 'Caramel Macchiato', 'T01', 'S02', true, 70, 40),
('M00803', 'คาราเมลมัคคิอาโต้', 'Caramel Macchiato', 'T01', 'S03', true, 75, 40)
ON CONFLICT (menu_id) DO UPDATE SET
  menu_name_th = EXCLUDED.menu_name_th,
  menu_name_en = EXCLUDED.menu_name_en,
  menu_type = EXCLUDED.menu_type,
  menu_subtype = EXCLUDED.menu_subtype,
  has_milk = EXCLUDED.has_milk,
  price = EXCLUDED.price,
  duration = EXCLUDED.duration;

-- menu_type: ใช้เฉพาะชื่อแบบ explicit
INSERT INTO menu_type (type_id, type_name_th, type_name_en) VALUES
('T01', 'กาแฟ', 'Coffee'),
('T02', 'ชา', 'Tea'),
('T03', 'โซดา', 'Soda'),
('T04', 'โกโก้', 'Cocoa')
ON CONFLICT (type_id) DO UPDATE SET
  type_name_th = EXCLUDED.type_name_th,
  type_name_en = EXCLUDED.type_name_en;

-- menu_subtype: ใช้เฉพาะชื่อแบบ explicit
INSERT INTO menu_subtype (subtype_id, subtype_name_th, subtype_name_en, extra_duration) VALUES
('S01', 'ร้อน', 'Hot', 0),
('S02', 'เย็น', 'Iced', 2),
('S03', 'ปั่น', 'Frappe', 10)
ON CONFLICT (subtype_id) DO UPDATE SET
  subtype_name_th = EXCLUDED.subtype_name_th,
  subtype_name_en = EXCLUDED.subtype_name_en,
  extra_duration = EXCLUDED.extra_duration;
