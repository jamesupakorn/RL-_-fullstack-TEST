



DROP TABLE IF EXISTS menu_ingredient;
DROP TABLE IF EXISTS menu;
DROP TABLE IF EXISTS ingredient;
DROP TABLE IF EXISTS ingredient_type;
DROP TABLE IF EXISTS menu_subtype;
DROP TABLE IF EXISTS menu_type;



CREATE TABLE menu_subtype (
    subtype_id VARCHAR(10) PRIMARY KEY,
    subtype_name VARCHAR(20) NOT NULL, -- Hot/Iced/Frappe
    extra_duration INTEGER NOT NULL -- เวลาที่ต้องบวกเพิ่ม (วินาที)
);

-- คำอธิบายฟิลด์ menu_subtype
COMMENT ON COLUMN menu_subtype.subtype_id IS 'รหัสประเภทเมนูย่อย';
COMMENT ON COLUMN menu_subtype.subtype_name IS 'ชื่อประเภทเมนูย่อย เช่น Hot/Iced/Frappe';
COMMENT ON COLUMN menu_subtype.extra_duration IS 'เวลาที่ต้องบวกเพิ่ม (วินาที)';



CREATE TABLE ingredient_type (
    type_id VARCHAR(20) PRIMARY KEY,
    type_name VARCHAR(50) NOT NULL -- เช่น Beverage Ingredient, Equipment
);

-- คำอธิบายฟิลด์ ingredient_type
COMMENT ON COLUMN ingredient_type.type_id IS 'รหัสประเภทวัตถุดิบ';
COMMENT ON COLUMN ingredient_type.type_name IS 'ชื่อประเภทวัตถุดิบ เช่น Beverage Ingredient หรือ Equipment';



CREATE TABLE ingredient (
    ingredient_id VARCHAR(20) PRIMARY KEY,
    ingredient_name VARCHAR(50) NOT NULL,
    ingredient_type VARCHAR(20) REFERENCES ingredient_type(type_id),
    stock_qty INTEGER NOT NULL DEFAULT 0,
    unit VARCHAR(20) NOT NULL,
    duration INTEGER
);




-- คำอธิบายฟิลด์ ingredient
COMMENT ON COLUMN ingredient.ingredient_id IS 'รหัสวัตถุดิบ';
COMMENT ON COLUMN ingredient.ingredient_name IS 'ชื่อวัตถุดิบ';
COMMENT ON COLUMN ingredient.ingredient_type IS 'รหัสประเภทวัตถุดิบ';
COMMENT ON COLUMN ingredient.stock_qty IS 'จำนวนวัตถุดิบในสต็อก';
COMMENT ON COLUMN ingredient.unit IS 'หน่วยของวัตถุดิบ เช่น g, ml, pieces';
COMMENT ON COLUMN ingredient.duration IS 'เวลาที่ใช้ในการเตรียมวัตถุดิบนี้ (วินาที)';

CREATE TABLE menu_type (
    type_id VARCHAR(20) PRIMARY KEY,
    type_name VARCHAR(50) NOT NULL -- เช่น Coffee, Tea, Soda, Cocoa
);

-- คำอธิบายฟิลด์ menu_type
COMMENT ON COLUMN menu_type.type_id IS 'รหัสประเภทเมนู เช่น T01, T02';
COMMENT ON COLUMN menu_type.type_name IS 'ชื่อประเภทเมนู เช่น Coffee, Tea, Soda, Cocoa';



CREATE TABLE menu (
    menu_id VARCHAR(20) PRIMARY KEY,
    menu_name VARCHAR(100) NOT NULL,
    menu_type VARCHAR(20) REFERENCES menu_type(type_id),
    menu_subtype VARCHAR(10) REFERENCES menu_subtype(subtype_id),
    has_milk BOOLEAN NOT NULL,
    price INTEGER NOT NULL,
    duration INTEGER NOT NULL
);

-- คำอธิบายฟิลด์ menu
COMMENT ON COLUMN menu.menu_id IS 'รหัสเมนู';
COMMENT ON COLUMN menu.menu_name IS 'ชื่อเมนู';
COMMENT ON COLUMN menu.menu_type IS 'ประเภทเมนู เช่น กาแฟ/ชา/โซดา';
COMMENT ON COLUMN menu.has_milk IS 'เมนูนี้มีนมหรือไม่';
COMMENT ON COLUMN menu.price IS 'ราคาขาย (บาท)';
COMMENT ON COLUMN menu.duration IS 'เวลารวมที่ใช้ในการเตรียมเมนูนี้ (วินาที)';

CREATE TABLE menu_ingredient (
    menu_id VARCHAR(20) REFERENCES menu(menu_id),
    ingredient_id VARCHAR(20) REFERENCES ingredient(ingredient_id),
    amount INTEGER NOT NULL,
    PRIMARY KEY (menu_id, ingredient_id)
);

-- คำอธิบายฟิลด์ menu_ingredient
COMMENT ON COLUMN menu_ingredient.menu_id IS 'รหัสเมนูที่ใช้วัตถุดิบนี้';
COMMENT ON COLUMN menu_ingredient.ingredient_id IS 'รหัสวัตถุดิบที่ใช้ในเมนูนี้';
COMMENT ON COLUMN menu_ingredient.amount IS 'ปริมาณวัตถุดิบที่ใช้ในเมนูนี้';

-- Mock data for menu_type
INSERT INTO menu_type (type_id, type_name) VALUES
('T01', 'Coffee'),
('T02', 'Tea'),
('T03', 'Soda'),
('T04', 'Cocoa');

-- Mock data for menu_subtype
INSERT INTO menu_subtype (subtype_id, subtype_name, extra_duration) VALUES
('S01', 'Hot', 0),
('S02', 'Iced', 2),
('S03', 'Frappe', 10);

-- Mock data for ingredient_type
INSERT INTO ingredient_type (type_id, type_name) VALUES
('T01', 'Beverage Ingredient'),
('T02', 'Equipment');

-- Mock data for ingredient
INSERT INTO ingredient (ingredient_id, ingredient_name, ingredient_type, stock_qty, unit, duration) VALUES
('IGD1001', 'Coffee Beans', 'T01', 100, 'g', 8),
('IGD1002', 'Green Tea Powder', 'T01', 100, 'g', 8),
('IGD1003', 'Fresh Milk', 'T01', 100, 'ml', 5),
('IGD1004', 'Simple Syrup', 'T01', 100, 'ml', 5),
('IGD1005', 'Water', 'T01', 1000, 'ml', 3),
('IGD1006', 'Black Tea Leaves', 'T01', 100, 'g', 8),
('IGD2001', 'Drinking Straw', 'T02', 500, 'pieces', 0),
('IGD2002', 'Dome Lid', 'T02', 500, 'pieces', 0),
('IGD2003', 'Plastic Cup', 'T02', 500, 'pieces', 0),
('IGD1007', 'Granulated Sugar', 'T01', 500, 'g', 3),
('IGD1008', 'Ice Cubes', 'T01', 10000, 'g', 2),
('IGD1009', 'Chocolate Syrup', 'T01', 300, 'ml', 5),
('IGD1010', 'Lemon Juice', 'T01', 500, 'ml', 5),
('IGD1011', 'Caramel Syrup', 'T01', 200, 'ml', 5),
('IGD1012', 'Soda Water', 'T01', 1000, 'ml', 3);


-- Mapping menu_name → menu_code:
-- Espresso = M001, Americano = M002, Latte = M003, Green Tea Latte = M004, Black Tea = M005, Lemon Soda = M006, Iced Chocolate = M007, Caramel Macchiato = M008
INSERT INTO menu (menu_id, menu_name, menu_type, menu_subtype, has_milk, price, duration) VALUES
('M00101', 'Espresso', 'T01', 'S01', false, 40, 30), -- Hot
('M00102', 'Espresso', 'T01', 'S02', false, 45, 30), -- Iced
('M00201', 'Americano', 'T01', 'S01', false, 45, 30),
('M00202', 'Americano', 'T01', 'S02', false, 50, 30),
('M00203', 'Americano', 'T01', 'S03', false, 55, 30),
('M00301', 'Latte', 'T01', 'S01', true, 50, 35),
('M00302', 'Latte', 'T01', 'S02', true, 55, 35),
('M00303', 'Latte', 'T01', 'S03', true, 60, 35),
('M00401', 'Green Tea Latte', 'T02', 'S01', true, 55, 35),
('M00402', 'Green Tea Latte', 'T02', 'S02', true, 60, 35),
('M00403', 'Green Tea Latte', 'T02', 'S03', true, 65, 35),
('M00501', 'Black Tea', 'T02', 'S01', false, 40, 30),
('M00502', 'Black Tea', 'T02', 'S02', false, 45, 30),
('M00503', 'Black Tea', 'T02', 'S03', false, 50, 30),
('M00602', 'Lemon Soda', 'T03', 'S02', false, 50, 20), -- Iced
('M00702', 'Iced Chocolate', 'T04', 'S02', true, 60, 20), -- Iced
('M00801', 'Caramel Macchiato', 'T01', 'S01', true, 65, 40),
('M00802', 'Caramel Macchiato', 'T01', 'S02', true, 70, 40),
('M00803', 'Caramel Macchiato', 'T01', 'S03', true, 75, 40);

-- Mock data for menu_ingredient (แก้ไขให้สัมพันธ์กับรหัสเมนูใหม่และ logic จริง)
INSERT INTO menu_ingredient (menu_id, ingredient_id, amount) VALUES
-- Espresso Hot
('M00101', 'IGD1001', 10), -- coffee
('M00101', 'IGD2003', 1), -- Plastic Cup
-- Espresso Iced
('M00102', 'IGD1001', 10), -- coffee
('M00102', 'IGD1008', 100), -- Ice
('M00102', 'IGD2003', 1), -- Plastic Cup
-- Americano Hot
('M00201', 'IGD1001', 10), -- coffee
('M00201', 'IGD1005', 100), -- Water
('M00201', 'IGD2003', 1), -- Plastic Cup
-- Americano Iced
('M00202', 'IGD1001', 10), -- coffee
('M00202', 'IGD1008', 100), -- Ice
('M00202', 'IGD1005', 100), -- Water
('M00202', 'IGD2003', 1), -- Plastic Cup
-- Americano Frappe
('M00203', 'IGD1001', 10), -- coffee
('M00203', 'IGD1008', 100), -- Ice
('M00203', 'IGD1005', 100), -- Water
('M00203', 'IGD2003', 1), -- Plastic Cup
-- Latte Hot
('M00301', 'IGD1001', 10), -- coffee
('M00301', 'IGD1003', 100), -- milk
('M00301', 'IGD2003', 1), -- Plastic Cup
-- Latte Iced
('M00302', 'IGD1001', 10), -- coffee
('M00302', 'IGD1003', 100), -- milk
('M00302', 'IGD1008', 100), -- Ice
('M00302', 'IGD2003', 1), -- Plastic Cup
-- Latte Frappe
('M00303', 'IGD1001', 10), -- coffee
('M00303', 'IGD1003', 100), -- milk
('M00303', 'IGD1008', 100), -- Ice
('M00303', 'IGD2003', 1), -- Plastic Cup
-- Green Tea Latte Hot
('M00401', 'IGD1002', 10), -- greentea
('M00401', 'IGD1003', 100), -- milk
('M00401', 'IGD2003', 1), -- Plastic Cup
-- Green Tea Latte Iced
('M00402', 'IGD1002', 10), -- greentea
('M00402', 'IGD1003', 100), -- milk
('M00402', 'IGD1008', 100), -- Ice
('M00402', 'IGD2003', 1), -- Plastic Cup
-- Green Tea Latte Frappe
('M00403', 'IGD1002', 10), -- greentea
('M00403', 'IGD1003', 100), -- milk
('M00403', 'IGD1008', 100), -- Ice
('M00403', 'IGD2003', 1), -- Plastic Cup
-- Black Tea Hot
('M00501', 'IGD1006', 10), -- tea
('M00501', 'IGD2003', 1), -- Plastic Cup
-- Black Tea Iced
('M00502', 'IGD1006', 10), -- tea
('M00502', 'IGD1008', 100), -- Ice
('M00502', 'IGD2003', 1), -- Plastic Cup
-- Black Tea Frappe
('M00503', 'IGD1006', 10), -- tea
('M00503', 'IGD1008', 100), -- Ice
('M00503', 'IGD2003', 1), -- Plastic Cup
-- Lemon Soda Iced
('M00602', 'IGD1012', 150), -- Soda
('M00602', 'IGD1010', 30), -- Lemon Juice
('M00602', 'IGD1008', 100), -- Ice
('M00602', 'IGD2003', 1), -- Plastic Cup
-- Iced Chocolate
('M00702', 'IGD1009', 30), -- Chocolate Syrup
('M00702', 'IGD1003', 100), -- milk
('M00702', 'IGD1008', 100), -- Ice
('M00702', 'IGD2003', 1), -- Plastic Cup
-- Caramel Macchiato Hot
('M00801', 'IGD1001', 10), -- coffee
('M00801', 'IGD1003', 80), -- milk
('M00801', 'IGD1011', 15), -- Caramel Syrup
('M00801', 'IGD2003', 1), -- Plastic Cup
-- Caramel Macchiato Iced
('M00802', 'IGD1001', 10), -- coffee
('M00802', 'IGD1003', 80), -- milk
('M00802', 'IGD1011', 15), -- Caramel Syrup
('M00802', 'IGD1008', 100), -- Ice
('M00802', 'IGD2003', 1), -- Plastic Cup
-- Caramel Macchiato Frappe
('M00803', 'IGD1001', 10), -- coffee
('M00803', 'IGD1003', 80), -- milk
('M00803', 'IGD1011', 15), -- Caramel Syrup
('M00803', 'IGD1008', 100), -- Ice
('M00803', 'IGD2003', 1); -- Plastic Cup