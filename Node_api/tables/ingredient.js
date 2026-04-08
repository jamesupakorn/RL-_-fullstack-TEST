
import express from 'express';
const router = express.Router();
import pool from '../main.js'; // ปรับ pathตาม ES Module
import { requireAdmin } from '../auth/adminAuth.js';


// GET / และ GET (ไม่มี slash) - ดึงรายการ ingredient ทั้งหมดสำหรับหน้าเช็ค stock
const getAllIngredients = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT ingredient_id, ingredient_name_th, ingredient_name_en, ingredient_type, stock_qty, unit_th, unit_en, duration, addon_price
       FROM ingredient
       ORDER BY ingredient_id`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
router.get('/', getAllIngredients);
router.get('', getAllIngredients);

// PUT /:id - อัปเดตข้อมูล ingredient
router.put('/:id', requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { ingredient_name_th, ingredient_name_en, ingredient_type, stock_qty, unit_th, unit_en, duration, addon_price } = req.body;
  try {
    const result = await pool.query(
      `UPDATE ingredient
       SET ingredient_name_th = $1,
           ingredient_name_en = $2,
           ingredient_type = $3,
           stock_qty = $4,
           unit_th = $5,
           unit_en = $6,
           duration = $7,
           addon_price = $8
       WHERE ingredient_id = $9
       RETURNING *`,
      [ingredient_name_th, ingredient_name_en, ingredient_type, stock_qty, unit_th, unit_en, duration, addon_price ?? 5, id]
    );
    if (result.rowCount === 0) return res.status(404).json({ error: 'Ingredient not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST / - เพิ่ม ingredient ใหม่
router.post('/', requireAdmin, async (req, res) => {
  const { ingredient_id, ingredient_name_th, ingredient_name_en, ingredient_type, stock_qty, unit_th, unit_en, duration, addon_price } = req.body;
  if (!ingredient_id || !ingredient_type) return res.status(400).json({ error: 'Missing ingredient_id or ingredient_type' });
  try {
    const result = await pool.query(
      `INSERT INTO ingredient (ingredient_id, ingredient_name_th, ingredient_name_en, ingredient_type, stock_qty, unit_th, unit_en, duration, addon_price)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [ingredient_id, ingredient_name_th, ingredient_name_en, ingredient_type, stock_qty || 0, unit_th, unit_en, duration || 0, addon_price ?? 5]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /:id - ลบ ingredient
router.delete('/:id', requireAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM ingredient WHERE ingredient_id = $1 RETURNING *', [id]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Ingredient not found' });
    res.json({ success: true, deleted: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

// POST /deduct-stock-by-menu - ตัด stock ingredient ตามเมนูใน order
router.post('/deduct-stock-by-menu', async (req, res) => {
  console.log('API called /deduct-stock-by-menu', req.body); // log request
  const orders = req.body; // [{ menu_id, qty }]
  try {
    for (const order of orders) {
      // ถ้ามี ingredient_id ให้ตัด stock โดยตรง (เช่น หลอด/ฝา)
      if (order.ingredient_id) {
        await pool.query(
          'UPDATE ingredient SET stock_qty = stock_qty - $1 WHERE ingredient_id = $2',
          [order.qty, order.ingredient_id]
        );
        continue;
      }
      // ถ้าเป็น menu_id ให้ตัด stock จาก menu_ingredient
      const { menu_id, qty } = order;
      if (menu_id && menu_id.startsWith('IGD')) {
        // กรณีส่ง ingredient_id แบบเดิม (เช่น frontend ส่ง menu_id = IGD2001)
        await pool.query(
          'UPDATE ingredient SET stock_qty = stock_qty - $1 WHERE ingredient_id = $2',
          [qty, menu_id]
        );
        continue;
      }
      const result = await pool.query(
        'SELECT ingredient_id, amount FROM menu_ingredient WHERE menu_id = $1',
        [menu_id]
      );
      for (const ing of result.rows) {
        await pool.query(
          'UPDATE ingredient SET stock_qty = stock_qty - $1 WHERE ingredient_id = $2',
          [ing.amount * qty, ing.ingredient_id]
        );
      }
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// PUT / - bulk update ingredient
router.put('/', requireAdmin, async (req, res) => {
  const ingredients = req.body; // array
  if (!Array.isArray(ingredients)) return res.status(400).json({ error: 'Body must be array' });

  try {
    const results = [];
    for (const ing of ingredients) {
      const { ingredient_id, ingredient_name_th, ingredient_name_en, ingredient_type, stock_qty, unit_th, unit_en, duration, addon_price } = ing;
      if (!ingredient_id) continue; // ต้องมี id
      const result = await pool.query(
        `UPDATE ingredient
         SET ingredient_name_th = $1,
             ingredient_name_en = $2,
             ingredient_type = $3,
             stock_qty = $4,
             unit_th = $5,
             unit_en = $6,
             duration = $7,
             addon_price = $8
         WHERE ingredient_id = $9
         RETURNING *`,
        [ingredient_name_th, ingredient_name_en, ingredient_type, stock_qty, unit_th, unit_en, duration, addon_price ?? 5, ingredient_id]
      );
      if (result.rowCount > 0) results.push(result.rows[0]);
    }
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});