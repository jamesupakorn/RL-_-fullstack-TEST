// Cafe Menu API (Express)
// Backend Node.js สำหรับเมนูร้านกาแฟ
// อธิบายแต่ละ endpoint เป็นภาษาไทย




import express from 'express';
import cors from 'cors';
import { getMenus } from './tables/menu.js';
import { getMenuIngredients, getMenuIngredientsByNameSubtype } from './tables/menu_ingredient.js';
import { getMenuSubtypes } from './tables/menu_subtype.js';

const app = express();
const port = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());
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

app.listen(port, () => {
  console.log(`Cafe Node API listening on port ${port}`);
});
