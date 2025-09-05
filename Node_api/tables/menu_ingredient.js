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
  const menuRes = await pool.query('SELECT duration FROM menu WHERE menu_id = $1', [menu_id]);
  const duration = menuRes.rows[0]?.duration || null;
  return { ingredients: result.rows, duration };
}
