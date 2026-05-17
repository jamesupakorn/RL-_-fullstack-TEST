
import express from 'express';
import pool from '../main.js';
import { requireAdmin } from '../auth/adminAuth.js';
import { requireClientToken } from '../auth/clientToken.js';
import { handleDbError, notFound } from '../db/helpers.js';

const router = express.Router();

// SQL กลางสำหรับ update ingredient ใช้ซ้ำทั้ง update รายตัวและ bulk update
const INGREDIENT_UPDATE_SQL = `UPDATE ingredient
  SET ingredient_name_th = $1,
      ingredient_name_en = $2,
      ingredient_type = $3,
      stock_qty = $4,
      unit_th = $5,
      unit_en = $6,
      duration = $7,
      addon_price = $8
  WHERE ingredient_id = $9
  RETURNING *`;

const DEDUCT_STOCK_SQL = 'UPDATE ingredient SET stock_qty = stock_qty - $1 WHERE ingredient_id = $2';

// map object ingredient -> parameter array ตามลำดับ placeholder ใน INGREDIENT_UPDATE_SQL
const buildIngredientUpdateParams = ({
  ingredient_id,
  ingredient_name_th,
  ingredient_name_en,
  ingredient_type,
  stock_qty,
  unit_th,
  unit_en,
  duration,
  addon_price,
}) => [
  ingredient_name_th,
  ingredient_name_en,
  ingredient_type,
  stock_qty,
  unit_th,
  unit_en,
  duration,
  addon_price ?? 5,
  ingredient_id,
];

// GET / - ดึงรายการ ingredient ทั้งหมดสำหรับหน้าเช็ค stock
router.get('/', requireClientToken, async (_req, res) => {
  try {
    const result = await pool.query(
      `SELECT ingredient_id, ingredient_name_th, ingredient_name_en, ingredient_type, stock_qty, unit_th, unit_en, duration, addon_price
       FROM ingredient
       ORDER BY ingredient_id`
    );
    res.json(result.rows);
  } catch (err) {
    handleDbError(res, err);
  }
});

// PUT /:id - อัปเดตข้อมูล ingredient
router.put('/:id', requireAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      INGREDIENT_UPDATE_SQL,
      buildIngredientUpdateParams({ ...req.body, ingredient_id: id })
    );
    if (result.rowCount === 0) return notFound(res, 'Ingredient');
    res.json(result.rows[0]);
  } catch (err) {
    handleDbError(res, err);
  }
});

// POST / - เพิ่ม ingredient ใหม่
router.post('/', requireAdmin, async (req, res) => {
  const {
    ingredient_id,
    ingredient_name_th,
    ingredient_name_en,
    ingredient_type,
    stock_qty,
    unit_th,
    unit_en,
    duration,
    addon_price,
  } = req.body;

  if (!ingredient_id || !ingredient_type) {
    return res.status(400).json({ error: 'Missing ingredient_id or ingredient_type' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO ingredient (ingredient_id, ingredient_name_th, ingredient_name_en, ingredient_type, stock_qty, unit_th, unit_en, duration, addon_price)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        ingredient_id,
        ingredient_name_th,
        ingredient_name_en,
        ingredient_type,
        stock_qty || 0,
        unit_th,
        unit_en,
        duration || 0,
        addon_price ?? 5,
      ]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    handleDbError(res, err);
  }
});

// DELETE /:id - ลบ ingredient
router.delete('/:id', requireAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM ingredient WHERE ingredient_id = $1 RETURNING *', [id]);
    if (result.rowCount === 0) return notFound(res, 'Ingredient');
    res.json({ success: true, deleted: result.rows[0] });
  } catch (err) {
    handleDbError(res, err);
  }
});

// POST /deduct-stock-by-menu - endpoint ใช้หลังยืนยันออเดอร์ เพื่อหัก stock ตามสูตรเมนู (transaction)
router.post('/deduct-stock-by-menu', requireClientToken, async (req, res) => {
  const orders = req.body;
  if (!Array.isArray(orders)) return res.status(400).json({ error: 'Body must be array' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const order of orders) {
      // ถ้ามี ingredient_id ให้ตัด stock โดยตรง (เช่น หลอด/ฝา)
      if (order.ingredient_id) {
        await client.query(DEDUCT_STOCK_SQL, [order.qty, order.ingredient_id]);
        continue;
      }

      const { menu_id, qty } = order;
      if (menu_id && menu_id.startsWith('IGD')) {
        // กรณีส่ง ingredient_id แบบเดิม (เช่น frontend ส่ง menu_id = IGD2001)
        await client.query(DEDUCT_STOCK_SQL, [qty, menu_id]);
        continue;
      }

      // lookup สูตรวัตถุดิบของเมนู แล้วคูณตามจำนวนที่สั่ง
      const result = await client.query(
        'SELECT ingredient_id, amount FROM menu_ingredient WHERE menu_id = $1',
        [menu_id]
      );
      for (const ing of result.rows) {
        await client.query(DEDUCT_STOCK_SQL, [ing.amount * qty, ing.ingredient_id]);
      }
    }
    await client.query('COMMIT');
    res.json({ success: true });
  } catch (err) {
    await client.query('ROLLBACK');
    handleDbError(res, err);
  } finally {
    client.release();
  }
});

// PUT / - bulk update ingredient (transaction)
router.put('/', requireAdmin, async (req, res) => {
  const ingredients = req.body;
  if (!Array.isArray(ingredients)) return res.status(400).json({ error: 'Body must be array' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const results = [];
    for (const ingredient of ingredients) {
      if (!ingredient.ingredient_id) continue;
      const result = await client.query(INGREDIENT_UPDATE_SQL, buildIngredientUpdateParams(ingredient));
      if (result.rowCount > 0) results.push(result.rows[0]);
    }
    await client.query('COMMIT');
    res.json(results);
  } catch (err) {
    await client.query('ROLLBACK');
    handleDbError(res, err);
  } finally {
    client.release();
  }
});

export default router;