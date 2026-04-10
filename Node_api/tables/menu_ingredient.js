// menu_ingredient.js — query ตารางกลาง menu_ingredient + JOIN ingredient
// ใช้ใน 2 endpoint หลัก:
//   GET /api/menu_ingredient          (by menu_id)
//   GET /api/menu_ingredient_by_name_subtype (by name + subtype, ใช้หน้า storefront)
import pool from '../main.js';

/**
 * ดึงรายการวัตถุดิบ (ingredient) ที่ใช้ในเมนูนั้น พร้อม duration และ price
 * @param {string}      menu_id         - รหัสเมนู เช่น M001HOT
 * @param {string|null} ingredient_type - กรองเฉพาะ type เช่น T01 (optional)
 * @returns {{ ingredients: Array, duration: number|null, price: number|null }}
 */
export async function getMenuIngredients(menu_id, ingredient_type) {
  let query = `
    SELECT i.ingredient_id, i.ingredient_name_th, i.ingredient_name_en, i.unit_th, i.unit_en, i.stock_qty, mi.amount, i.duration
    FROM menu_ingredient mi
    JOIN ingredient i ON mi.ingredient_id = i.ingredient_id
    WHERE mi.menu_id = $1
  `;
  const params = [menu_id];
  if (ingredient_type) {
    query += ' AND i.ingredient_type = $2';
    params.push(ingredient_type);
  }
  const result = await pool.query(query, params);
  const menuRes = await pool.query('SELECT duration, price FROM menu WHERE menu_id = $1', [menu_id]);
  const duration = menuRes.rows[0]?.duration || null;
  const price = menuRes.rows[0]?.price ?? null;
  return { ingredients: result.rows, duration, price };
}

/**
 * ดึงวัตถุดิบโดยระบุ ชื่อเมนู + subtype แทน menu_id โดยตรง
 * ใช้โดย storefront เพราะ frontend รู้แค่ชื่อและ subtype ที่เลือก
 * @param {string}      menu_name      - เช่น 'Americano'
 * @param {string}      subtype_id     - เช่น 'HOT', 'ICED'
 * @param {string|null} ingredient_type - กรอง type (optional)
 * @returns {{ ingredients: Array, duration: number|null, price: number|null }}
 */
export async function getMenuIngredientsByNameSubtype(menu_name, subtype_id, ingredient_type) {
  // หา menu_id จาก menu_name และ subtype_id
  const menuRes = await pool.query(
    'SELECT menu_id, price FROM menu WHERE menu_name_en = $1 AND menu_subtype = $2 LIMIT 1',
    [menu_name, subtype_id]
  );
  const menu_id = menuRes.rows[0]?.menu_id;
  const price = menuRes.rows[0]?.price ?? null;
  if (!menu_id) return { ingredients: [], duration: null, price: null };
  // ใช้ฟังก์ชันเดิมในการดึง ingredient (จะรวม price ใน response ด้วย)
  const result = await getMenuIngredients(menu_id, ingredient_type);
  return { ...result, price };
}
