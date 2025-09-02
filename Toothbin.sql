DROP TABLE IF EXISTS order_detail;
DROP TABLE IF EXISTS "order";
DROP TABLE IF EXISTS menu_ingredient;
DROP TABLE IF EXISTS menu;
DROP TABLE IF EXISTS ingredient;

CREATE TABLE ingredient (
    ingredient_id VARCHAR(20) PRIMARY KEY,
    ingredient_name VARCHAR(50) NOT NULL,
    stock_qty INTEGER NOT NULL DEFAULT 0,
    unit VARCHAR(20) NOT NULL,
    duration INTEGER
);

CREATE TABLE menu (
    menu_id VARCHAR(20) PRIMARY KEY,
    menu_name VARCHAR(100) NOT NULL,
    menu_type VARCHAR(20) NOT NULL, -- กาแฟ/ชา/โซดา
    has_milk BOOLEAN NOT NULL,
    price INTEGER NOT NULL,
    duration INTEGER NOT NULL
);

CREATE TABLE menu_ingredient (
    menu_id VARCHAR(20) REFERENCES menu(menu_id),
    ingredient_id VARCHAR(20) REFERENCES ingredient(ingredient_id),
    amount INTEGER NOT NULL,
    unit VARCHAR(20) NOT NULL,
    PRIMARY KEY (menu_id, ingredient_id)
);

CREATE TABLE "order" (
    order_id VARCHAR(20) PRIMARY KEY,
    order_time TIMESTAMP NOT NULL DEFAULT NOW(),
    total_price INTEGER NOT NULL
);

CREATE TABLE order_detail (
    order_detail_id VARCHAR(20) PRIMARY KEY,
    order_id VARCHAR(20) REFERENCES "order"(order_id),
    menu_id VARCHAR(20) REFERENCES menu(menu_id),
    qty INTEGER NOT NULL
);