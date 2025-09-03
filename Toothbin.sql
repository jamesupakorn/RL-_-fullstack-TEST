
DROP TABLE IF EXISTS menu_ingredient;
DROP TABLE IF EXISTS menu;
DROP TABLE IF EXISTS ingredient;

CREATE TABLE ingredient (
    ingredient_id VARCHAR(20) PRIMARY KEY,
    ingredient_name VARCHAR(50) NOT NULL,
    ingredient_type VARCHAR(30) NOT NULL, -- ประเภทวัตถุดิบ: ส่วนผสมเครื่องดื่ม/อุปกรณ์
    stock_qty INTEGER NOT NULL DEFAULT 0,
    unit VARCHAR(20) NOT NULL,
    duration INTEGER
);

-- คำอธิบายฟิลด์ ingredient
COMMENT ON COLUMN ingredient.ingredient_id IS 'รหัสวัตถุดิบ';
COMMENT ON COLUMN ingredient.ingredient_name IS 'ชื่อวัตถุดิบ';
COMMENT ON COLUMN ingredient.ingredient_type IS 'ประเภทวัตถุดิบ เช่น ส่วนผสมเครื่องดื่ม หรือ อุปกรณ์';
COMMENT ON COLUMN ingredient.stock_qty IS 'จำนวนวัตถุดิบในสต็อก';
COMMENT ON COLUMN ingredient.unit IS 'หน่วยของวัตถุดิบ เช่น g, ml, pieces';
COMMENT ON COLUMN ingredient.duration IS 'เวลาที่ใช้ในการเตรียมวัตถุดิบนี้ (วินาที)';

CREATE TABLE menu (
    menu_id VARCHAR(20) PRIMARY KEY,
    menu_name VARCHAR(100) NOT NULL,
    menu_type VARCHAR(20) NOT NULL, -- กาแฟ/ชา/โซดา
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
COMMENT ON COLUMN menu_ingredient.menu_id IS 'รหัสเมนู';
COMMENT ON COLUMN menu_ingredient.ingredient_id IS 'รหัสวัตถุดิบ';
COMMENT ON COLUMN menu_ingredient.amount IS 'ปริมาณวัตถุดิบที่ใช้ในเมนูนี้';


-- Mock data for ingredient
INSERT INTO ingredient (ingredient_id, ingredient_name, ingredient_type, stock_qty, unit, duration) VALUES
('IGD1001', 'Coffee Beans', 'Beverage Ingredient', 100, 'g', 8), -- Brew coffee 10s
('IGD1002', 'Green Tea Powder', 'Beverage Ingredient', 100, 'g', 8), -- Brew green tea 10s
('IGD1003', 'Fresh Milk', 'Beverage Ingredient', 100, 'ml', 5), -- addon: +5s
('IGD1004', 'Simple Syrup', 'Beverage Ingredient', 100, 'ml', 5), -- addon: +5s
('IGD1005', 'Water', 'Beverage Ingredient', 1000, 'ml', 3), -- Pour water 3s
('IGD1006', 'Black Tea Leaves', 'Beverage Ingredient', 100, 'g', 8), -- Brew tea 10s
('IGD2001', 'Drinking Straw', 'Equipment', 500, 'pieces', 0),
('IGD2002', 'Dome Lid', 'Equipment', 500, 'pieces', 0),
('IGD2003', 'Plastic Cup', 'Equipment', 500, 'pieces', 0),
('IGD1007', 'Granulated Sugar', 'Beverage Ingredient', 500, 'g', 3), -- addon: +3s
('IGD1008', 'Ice Cubes', 'Beverage Ingredient', 10000, 'g', 2), -- Scoop ice 2s
('IGD1009', 'Chocolate Syrup', 'Beverage Ingredient', 300, 'ml', 5), -- addon: +5s
('IGD1010', 'Fresh Lemon', 'Beverage Ingredient', 50, 'piece', 5), -- addon: +5s
('IGD1011', 'Caramel Syrup', 'Beverage Ingredient', 200, 'ml', 5), -- addon: +5s
('IGD1012', 'Soda Water', 'Beverage Ingredient', 1000, 'ml', 3); -- addon: +3s

-- Mock data for menu
INSERT INTO menu (menu_id, menu_name, menu_type, has_milk, price, duration) VALUES
('M01001', 'Espresso', 'Coffee', false, 40, 30), -- 30s
('M01002', 'Americano', 'Coffee', false, 45, 30), -- 30s (Espresso + water)
('M01003', 'Latte', 'Coffee', true, 50, 35), -- 30+5s
('M01004', 'Cappuccino', 'Coffee', true, 55, 35), -- 30+5s
('M01005', 'Mocha', 'Coffee', true, 60, 40), -- 30+5+5s
('M02001', 'Green Tea Latte', 'Tea', true, 55, 35), -- 30+5s
('M02002', 'Black Tea', 'Tea', false, 40, 30), -- 30s
('M03001', 'Lemon Soda', 'Soda', false, 50, 20), -- Squeeze lemon 10s
('M04001', 'Iced Chocolate', 'Cocoa', true, 60, 20), -- Add chocolate 5s + milk 5s
('M01006', 'Caramel Macchiato', 'Coffee', true, 65, 40); -- 30+5+5s

-- Mock data for menu_ingredient
INSERT INTO menu_ingredient (menu_id, ingredient_id, amount) VALUES
('M01001', 'IGD1001', 10), -- Espresso: coffee
('M01001', 'IGD1008', 100), -- Ice
('M01001', 'IGD2003', 1), -- Plastic Cup
('M01002', 'IGD1001', 10), -- Americano: coffee
('M01002', 'IGD1008', 100), -- Ice
('M01002', 'IGD1005', 100), -- Water
('M01002', 'IGD2003', 1), -- Plastic Cup
('M01003', 'IGD1001', 10), -- Latte: coffee
('M01003', 'IGD1003', 100), -- milk
('M01003', 'IGD1008', 100), -- Ice
('M01003', 'IGD2003', 1), -- Plastic Cup
('M01004', 'IGD1001', 10), -- Cappuccino: coffee
('M01004', 'IGD1003', 80), -- milk
('M01004', 'IGD1008', 100), -- Ice
('M01004', 'IGD2003', 1), -- Plastic Cup
('M01005', 'IGD1001', 10), -- Mocha: coffee
('M01005', 'IGD1003', 80), -- milk
('M01005', 'IGD1009', 20), -- Chocolate Syrup
('M01005', 'IGD1008', 100), -- Ice
('M01005', 'IGD2003', 1), -- Plastic Cup
('M02001', 'IGD1002', 10), -- Green Tea Latte: greentea
('M02001', 'IGD1003', 100), -- milk
('M02001', 'IGD1008', 100), -- Ice
('M02001', 'IGD2003', 1), -- Plastic Cup
('M02002', 'IGD1006', 10), -- Black Tea
('M02002', 'IGD1008', 100), -- Ice
('M02002', 'IGD2003', 1), -- Plastic Cup
('M03001', 'IGD1012', 150), -- Lemon Soda: Soda
('M03001', 'IGD1010', 1), -- Lemon
('M03001', 'IGD1008', 100), -- Ice
('M03001', 'IGD2003', 1), -- Plastic Cup
('M04001', 'IGD1009', 30), -- Iced Chocolate: Chocolate Syrup
('M04001', 'IGD1003', 100), -- milk
('M04001', 'IGD1008', 100), -- Ice
('M04001', 'IGD2003', 1), -- Plastic Cup
('M01006', 'IGD1001', 10), -- Caramel Macchiato: coffee
('M01006', 'IGD1003', 80), -- milk
('M01006', 'IGD1011', 15), -- Caramel Syrup
('M01006', 'IGD1008', 100), -- Ice
('M01006', 'IGD2003', 1); -- Plastic Cup