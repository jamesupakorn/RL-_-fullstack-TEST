// Cafe Menu API (Express)
// Backend Node.js สำหรับเมนูร้านกาแฟ
// อธิบายแต่ละ endpoint เป็นภาษาไทย




import express from 'express';
import cors from 'cors';
import pool from './main.js';
import { getMenus } from './tables/menu.js';
import { getMenuIngredients, getMenuIngredientsByNameSubtype } from './tables/menu_ingredient.js';
import { getMenuSubtypes } from './tables/menu_subtype.js';
import ingredientRouter from './tables/ingredient.js';
import { isAdminKeyValid, requireAdmin } from './auth/adminAuth.js';

const app = express();
const port = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.use('/api/ingredient', ingredientRouter);

app.post('/api/admin/login', (req, res) => {
  const { adminKey, adminKeyHash } = req.body || {};
  const credential = adminKeyHash || adminKey;
  if (!isAdminKeyValid(credential)) {
    return res.status(401).json({ error: 'Invalid admin key' });
  }
  return res.json({ success: true });
});

// GET /api/menu_ingredient_by_name_subtype - ดึงวัตถุดิบของเมนูด้วย menu_name และ subtype_id
app.get('/api/menu_ingredient_by_name_subtype', async (req, res) => {
  const { menu_name, subtype_id, ingredient_type } = req.query;
  if (!menu_name || !subtype_id) return res.status(400).json({ error: 'Missing menu_name or subtype_id' });
  try {
    const data = await getMenuIngredientsByNameSubtype(menu_name, subtype_id, ingredient_type);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/menu - ดึงข้อมูลเมนูทั้งหมด หรือ filter ตาม query
app.get('/api/menu', async (req, res) => {
  try {
    const menus = await getMenus(req.query);
    res.json(menus);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/menu_ingredient - ดึงวัตถุดิบของเมนู (รองรับ ingredient_type)
app.get('/api/menu_ingredient', async (req, res) => {
  try {
    const { menu_id, ingredient_type } = req.query;
    if (!menu_id) return res.status(400).json({ error: 'Missing menu_id' });
    const data = await getMenuIngredients(menu_id, ingredient_type);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/menu_subtype - ดึงข้อมูลประเภทเมนูย่อย (Hot/Iced/Frappe)
app.get('/api/menu_subtype', async (req, res) => {
  try {
    const subtypes = await getMenuSubtypes();
    res.json(subtypes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/menu_type - ดึงข้อมูลประเภทเมนูหลัก
app.get('/api/menu_type', requireAdmin, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM menu_type ORDER BY type_id');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== MENU CRUD =====

// POST /api/menu - เพิ่มเมนูใหม่
app.post('/api/menu', requireAdmin, async (req, res) => {
  const { menu_id, menu_name_th, menu_name_en, menu_type, menu_subtype, has_milk, price, duration } = req.body;
  if (!menu_id || !menu_type || !menu_subtype) return res.status(400).json({ error: 'Missing required fields' });
  try {
    const result = await pool.query(
      `INSERT INTO menu (menu_id, menu_name_th, menu_name_en, menu_type, menu_subtype, has_milk, price, duration)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [menu_id, menu_name_th, menu_name_en, menu_type, menu_subtype, has_milk || false, price || 0, duration || 0]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/menu/:id - แก้ไขเมนู
app.put('/api/menu/:id', requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { menu_name_th, menu_name_en, menu_type, menu_subtype, has_milk, price, duration } = req.body;
  try {
    const result = await pool.query(
      `UPDATE menu SET menu_name_th=$1, menu_name_en=$2, menu_type=$3, menu_subtype=$4, has_milk=$5, price=$6, duration=$7
       WHERE menu_id=$8 RETURNING *`,
      [menu_name_th, menu_name_en, menu_type, menu_subtype, has_milk, price, duration, id]
    );
    if (result.rowCount === 0) return res.status(404).json({ error: 'Menu not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/menu/:id - ลบเมนู
app.delete('/api/menu/:id', requireAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM menu_ingredient WHERE menu_id = $1', [id]);
    const result = await pool.query('DELETE FROM menu WHERE menu_id = $1 RETURNING *', [id]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Menu not found' });
    res.json({ success: true, deleted: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== MENU_INGREDIENT CRUD =====

// GET /api/menu_ingredient_list/:menu_id - ดึง ingredient list ของเมนูสำหรับ admin
app.get('/api/menu_ingredient_list/:menu_id', requireAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT mi.menu_id, mi.ingredient_id, mi.amount,
              i.ingredient_name_th, i.ingredient_name_en, i.unit_th, i.unit_en
       FROM menu_ingredient mi
       JOIN ingredient i ON mi.ingredient_id = i.ingredient_id
       WHERE mi.menu_id = $1`,
      [req.params.menu_id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/menu_ingredient - เพิ่ม ingredient ให้เมนู
app.post('/api/menu_ingredient', requireAdmin, async (req, res) => {
  const { menu_id, ingredient_id, amount } = req.body;
  if (!menu_id || !ingredient_id) return res.status(400).json({ error: 'Missing menu_id or ingredient_id' });
  try {
    const result = await pool.query(
      `INSERT INTO menu_ingredient (menu_id, ingredient_id, amount) VALUES ($1, $2, $3)
       ON CONFLICT (menu_id, ingredient_id) DO UPDATE SET amount = EXCLUDED.amount
       RETURNING *`,
      [menu_id, ingredient_id, amount || 1]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/menu_ingredient/:menu_id/:ingredient_id - ลบ ingredient จากเมนู
app.delete('/api/menu_ingredient/:menu_id/:ingredient_id', requireAdmin, async (req, res) => {
  const { menu_id, ingredient_id } = req.params;
  try {
    await pool.query('DELETE FROM menu_ingredient WHERE menu_id=$1 AND ingredient_id=$2', [menu_id, ingredient_id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/menu_all - ดึงเมนูทุกแถว (ไม่ group) สำหรับ admin
app.get('/api/menu_all', requireAdmin, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM menu ORDER BY menu_id');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(port, () => {
  console.log(`Cafe Node API listening on port ${port}`);
});
