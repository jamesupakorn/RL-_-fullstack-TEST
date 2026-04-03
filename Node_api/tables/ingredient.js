
import express from 'express';
const router = express.Router();
import pool from '../main.js'; // ปรับ pathตาม ES Module

// PUT /:id - อัปเดตข้อมูล ingredient
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { ingredient_name, ingredient_type, stock_qty, unit, duration } = req.body;
  try {
    const result = await pool.query(
      `UPDATE ingredient
       SET ingredient_name = $1,
           ingredient_type = $2,
           stock_qty = $3,
           unit = $4,
           duration = $5
       WHERE ingredient_id = $6
       RETURNING *`,
      [ingredient_name, ingredient_type, stock_qty, unit, duration, id]
    );
    if (result.rowCount === 0) return res.status(404).json({ error: 'Ingredient not found' });
    res.json(result.rows[0]);
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
router.put('/', async (req, res) => {
  const ingredients = req.body; // array
  if (!Array.isArray(ingredients)) return res.status(400).json({ error: 'Body must be array' });

  try {
    const results = [];
    for (const ing of ingredients) {
      const { ingredient_id, ingredient_name, ingredient_type, stock_qty, unit, duration } = ing;
      if (!ingredient_id) continue; // ต้องมี id
      const result = await pool.query(
        `UPDATE ingredient
         SET ingredient_name = $1,
             ingredient_type = $2,
             stock_qty = $3,
             unit = $4,
             duration = $5
         WHERE ingredient_id = $6
         RETURNING *`,
        [ingredient_name, ingredient_type, stock_qty, unit, duration, ingredient_id]
      );
      if (result.rowCount > 0) results.push(result.rows[0]);
    }
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});