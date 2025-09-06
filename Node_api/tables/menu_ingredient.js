import pool from '../main.js';

// ดึงวัตถุดิบของเมนู (รองรับ ingredient_type)
export async function getMenuIngredients(menu_id, ingredient_type) {
  let query = `
    SELECT i.ingredient_id, i.ingredient_name, i.unit, mi.amount, i.duration
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

// ดึงวัตถุดิบของเมนูด้วย menu_name และ subtype_id
export async function getMenuIngredientsByNameSubtype(menu_name, subtype_id, ingredient_type) {
  // หา menu_id จาก menu_name และ subtype_id
  const menuRes = await pool.query(
    'SELECT menu_id, price FROM menu WHERE menu_name = $1 AND menu_subtype = $2 LIMIT 1',
    [menu_name, subtype_id]
  );
  const menu_id = menuRes.rows[0]?.menu_id;
  const price = menuRes.rows[0]?.price ?? null;
  if (!menu_id) return { ingredients: [], duration: null, price: null };
  // ใช้ฟังก์ชันเดิมในการดึง ingredient (จะรวม price ใน response ด้วย)
  const result = await getMenuIngredients(menu_id, ingredient_type);
  return { ...result, price };
}
