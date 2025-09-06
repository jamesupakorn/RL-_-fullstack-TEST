import pool from '../main.js';

// ดึงข้อมูล menu_subtype ทั้งหมด
export async function getMenuSubtypes() {
  const result = await pool.query('SELECT * FROM menu_subtype');
  return result.rows;
}
