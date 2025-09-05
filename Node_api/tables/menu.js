
// นำเข้า pool สำหรับเชื่อมต่อฐานข้อมูลจาก main.js
import pool from '../main.js';

/**
 * ฟังก์ชัน getMenus สำหรับดึงข้อมูลเมนูจาก table menu
 * - รองรับการ filter ตาม query string ที่ส่งมา
 * - filterFields คือฟิลด์ที่สามารถกรองได้
 * - สร้าง query และ parameter ตามค่าที่รับมา
 * - คืนค่าข้อมูลเมนูทั้งหมดหรือเฉพาะที่ตรงเงื่อนไข
 * @param {object} queryParams - อ็อบเจกต์ที่เก็บ query string จาก request
 * @returns {Promise<Array>} - array ของเมนู
 */
export async function getMenus(queryParams) {
  // กำหนดฟิลด์ที่สามารถ filter ได้
  const filterFields = ['menu_id', 'menu_name', 'menu_type', 'has_milk', 'price', 'duration'];
  const filters = [];
  const values = [];
  let idx = 1;
  // วนลูปเช็คแต่ละฟิลด์ ถ้ามีใน queryParams ให้เพิ่มเงื่อนไข filter
  filterFields.forEach(field => {
    if (queryParams[field] !== undefined) {
      if (field === 'has_milk') {
        // กรณี has_milk แปลงค่าเป็น boolean
        filters.push(`${field} = $${idx}`);
        values.push(queryParams[field] === 'true' || queryParams[field] === '1');
      } else if (field === 'price' || field === 'duration') {
        // กรณี price, duration แปลงเป็นตัวเลข
        filters.push(`${field} = $${idx}`);
        values.push(Number(queryParams[field]));
      } else {
        // ฟิลด์อื่น ๆ ใช้ค่าตามที่รับมา
        filters.push(`${field} = $${idx}`);
        values.push(queryParams[field]);
      }
      idx++;
    }
  });
  // สร้าง query หลัก
  let query = 'SELECT * FROM menu';
  // ถ้ามี filter ให้เพิ่ม WHERE
  if (filters.length > 0) {
    query += ' WHERE ' + filters.join(' AND ');
  }
  // ดึงข้อมูลจากฐานข้อมูล
  const result = await pool.query(query, values);
  // คืน array ของเมนู
  return result.rows;
}
