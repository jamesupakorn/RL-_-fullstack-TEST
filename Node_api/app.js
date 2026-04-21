// Cafe Menu API (Express)
// Backend Node.js สำหรับเมนูร้านกาแฟ
// แยก app ออกจากไฟล์ที่ listen เพื่อรองรับทั้ง local และ serverless

import express from 'express';
import cors from 'cors';
import pool from './main.js';
import { getMenus } from './tables/menu.js';
import { getMenuIngredients, getMenuIngredientsByNameSubtype } from './tables/menu_ingredient.js';
import { getMenuSubtypes } from './tables/menu_subtype.js';
import ingredientRouter from './tables/ingredient.js';
import { isAdminKeyValid, requireAdmin } from './auth/adminAuth.js';
import { issueClientToken, requireClientToken } from './auth/clientToken.js';
import { handleDbError, notFound } from './db/helpers.js';

const app = express();

// เปิด CORS และ parse JSON body สำหรับทุก endpoint
app.use(cors());
app.use(express.json());

// GET / — หน้า API catalog แสดงรายการ endpoint ทั้งหมด (HTML)
// ซ่อน auth endpoints และ header names — แสดงแค่ระดับสิทธิ์เพื่อความปลอดภัย
app.get('/', (req, res) => {
  void req;
  // หมายเหตุ: ซ่อน /api/token และ /api/admin/login จงใจ
  // เพื่อไม่เปิดเผย attack surface แก่ผู้ไม่ประสงค์ดี
  const endpoints = [
    { group: 'Menu', color: '#0ea5e9', items: [
      { method: 'GET',    path: '/api/menu',           auth: 'auth',  desc: 'ดึงเมนูทั้งหมด (grouped by prefix) รองรับ filter ผ่าน query string' },
      { method: 'GET',    path: '/api/menu_subtype',   auth: 'auth',  desc: 'ดึงประเภทย่อยของเมนู (Hot / Iced / Frappe)' },
      { method: 'GET',    path: '/api/menu_type',      auth: 'admin', desc: 'ดึงประเภทหลักของเมนู (กาแฟ / ชา / โกโก้ …)' },
      { method: 'GET',    path: '/api/menu_all',       auth: 'admin', desc: 'ดึงเมนูทุกแถวแบบไม่ group (สำหรับ admin จัดการ)' },
      { method: 'POST',   path: '/api/menu',           auth: 'admin', desc: 'เพิ่มเมนูใหม่' },
      { method: 'PUT',    path: '/api/menu/:id',       auth: 'admin', desc: 'แก้ไขข้อมูลเมนู' },
      { method: 'DELETE', path: '/api/menu/:id',       auth: 'admin', desc: 'ลบเมนู (ลบ menu_ingredient ที่เกี่ยวข้องด้วย)' },
    ]},
    { group: 'Menu Ingredient', color: '#10b981', items: [
      { method: 'GET',    path: '/api/menu_ingredient',                        auth: 'auth',  desc: 'ดึงวัตถุดิบของเมนูตาม ?menu_id=&ingredient_type=' },
      { method: 'GET',    path: '/api/menu_ingredient_by_name_subtype',        auth: 'auth',  desc: 'ดึงวัตถุดิบตามชื่อเมนู + subtype (?menu_name=&subtype_id=)' },
      { method: 'GET',    path: '/api/menu_ingredient_list/:menu_id',          auth: 'admin', desc: 'ดึงรายการวัตถุดิบของเมนู (admin view)' },
      { method: 'POST',   path: '/api/menu_ingredient',                        auth: 'admin', desc: 'เพิ่ม/อัปเดตวัตถุดิบในเมนู (upsert)' },
      { method: 'DELETE', path: '/api/menu_ingredient/:menu_id/:ingredient_id',auth: 'admin', desc: 'ลบวัตถุดิบออกจากเมนู' },
    ]},
    { group: 'Ingredient / Stock', color: '#f59e0b', items: [
      { method: 'GET',    path: '/api/ingredient',                    auth: 'auth',  desc: 'ดึงรายการวัตถุดิบทั้งหมด พร้อม stock_qty' },
      { method: 'POST',   path: '/api/ingredient',                    auth: 'admin', desc: 'เพิ่มวัตถุดิบใหม่' },
      { method: 'PUT',    path: '/api/ingredient/:id',                auth: 'admin', desc: 'แก้ไขวัตถุดิบรายตัว' },
      { method: 'PUT',    path: '/api/ingredient',                    auth: 'admin', desc: 'Bulk update วัตถุดิบหลายรายการพร้อมกัน' },
      { method: 'DELETE', path: '/api/ingredient/:id',                auth: 'admin', desc: 'ลบวัตถุดิบ' },
      { method: 'POST',   path: '/api/ingredient/deduct-stock-by-menu', auth: 'auth', desc: 'หัก stock ตามออเดอร์ที่ยืนยัน' },
    ]},
  ];

  const methodColor = { GET: '#10b981', POST: '#6c47ff', PUT: '#f59e0b', DELETE: '#ef4444' };
  const authBadge = {
    auth:  '<span style="background:#0c4a6e;color:#38bdf8;padding:2px 8px;border-radius:99px;font-size:11px;font-weight:600">🔑 Authenticated</span>',
    admin: '<span style="background:#4c1d95;color:#c4b5fd;padding:2px 8px;border-radius:99px;font-size:11px;font-weight:600">👑 Admin only</span>',
  };

  const rows = endpoints.map(({ group, color, items }) => {
    const itemRows = items.map(({ method, path, auth, desc }) => `
      <tr>
        <td style="padding:10px 14px;white-space:nowrap">
          <span style="background:${methodColor[method]}22;color:${methodColor[method]};border:1px solid ${methodColor[method]}44;padding:3px 10px;border-radius:6px;font-size:12px;font-weight:700;font-family:monospace">${method}</span>
        </td>
        <td style="padding:10px 14px;font-family:monospace;font-size:13px;color:#e2e8f0;white-space:nowrap">${path}</td>
        <td style="padding:10px 14px">${authBadge[auth]}</td>
        <td style="padding:10px 14px;color:#94a3b8;font-size:13px">${desc}</td>
      </tr>`).join('');

    return `
      <tr><td colspan="4" style="padding:20px 14px 6px;font-size:12px;font-weight:700;letter-spacing:.08em;color:${color};text-transform:uppercase">${group}</td></tr>
      ${itemRows}
      <tr><td colspan="4" style="padding:0;border-bottom:1px solid #1e293b"></td></tr>`;
  }).join('');

  const html = `<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>ToothBin API</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{background:#0f172a;color:#e2e8f0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;min-height:100vh;padding:40px 24px}
    h1{font-size:22px;font-weight:700;color:#f8fafc;margin-bottom:4px}
    .sub{color:#64748b;font-size:13px;margin-bottom:32px}
    .card{background:#1e293b;border:1px solid #334155;border-radius:14px;overflow:hidden}
    table{width:100%;border-collapse:collapse}
    tr:hover td{background:#ffffff08}
    .legend{display:flex;gap:16px;margin-top:20px;flex-wrap:wrap}
    .leg{display:flex;align-items:center;gap:6px;font-size:12px;color:#64748b}
    .dot{width:10px;height:10px;border-radius:50%}
  </style>
</head>
<body>
  <h1>☕ ToothBin API</h1>
  <p class="sub">Cafe Menu &amp; Stock Management API &nbsp;·&nbsp; v1.0 &nbsp;·&nbsp; ${new Date().toLocaleDateString('th-TH', { year:'numeric', month:'long', day:'numeric' })}</p>
  <div class="card">
    <table>
      <thead>
        <tr style="border-bottom:1px solid #334155">
          <th style="padding:12px 14px;text-align:left;font-size:12px;color:#64748b;font-weight:600">METHOD</th>
          <th style="padding:12px 14px;text-align:left;font-size:12px;color:#64748b;font-weight:600">PATH</th>
          <th style="padding:12px 14px;text-align:left;font-size:12px;color:#64748b;font-weight:600">ACCESS</th>
          <th style="padding:12px 14px;text-align:left;font-size:12px;color:#64748b;font-weight:600">DESCRIPTION</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  </div>
  <div class="legend">
    <span class="leg"><span class="dot" style="background:#38bdf8"></span>Authenticated — ต้องผ่านระบบ authentication ของ application</span>
    <span class="leg"><span class="dot" style="background:#c4b5fd"></span>Admin only — สิทธิ์ผู้ดูแลระบบเท่านั้น</span>
  </div>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(html);
});

// แยกเส้นทาง ingredient ไปจัดการใน router เฉพาะไฟล์
app.use('/api/ingredient', ingredientRouter);

// POST /api/token — ออก short-lived client token สำหรับ frontend (public endpoint)
// ทุก request อื่นต้องแนบ token นี้ใน header x-client-token
app.post('/api/token', (req, res) => {
  void req;
  res.json({ token: issueClientToken() });
});

// ตรวจสอบ admin credential ก่อนเข้าหน้า backend จัดการข้อมูล
app.post('/api/admin/login', (req, res) => {
  const { adminKey, adminKeyHash } = req.body || {};
  const credential = adminKeyHash || adminKey;
  if (!isAdminKeyValid(credential)) {
    return res.status(401).json({ error: 'Invalid admin key' });
  }
  return res.json({ success: true });
});

// GET /api/menu_ingredient_by_name_subtype - ดึงสูตรเมนูจากชื่อเมนู + subtype (เช่น hot/iced)
app.get('/api/menu_ingredient_by_name_subtype', requireClientToken, async (req, res) => {
  const { menu_name, subtype_id, ingredient_type } = req.query;
  if (!menu_name || !subtype_id) return res.status(400).json({ error: 'Missing menu_name or subtype_id' });
  try {
    const data = await getMenuIngredientsByNameSubtype(menu_name, subtype_id, ingredient_type);
    res.json(data);
  } catch (err) {
    handleDbError(res, err);
  }
});

// GET /api/menu - endpoint หน้า storefront (รองรับ filter ผ่าน query string)
app.get('/api/menu', requireClientToken, async (req, res) => {
  try {
    const menus = await getMenus(req.query);
    res.json(menus);
  } catch (err) {
    handleDbError(res, err);
  }
});

// GET /api/menu_ingredient - ใช้ตอนลูกค้าเลือกเมนู เพื่ออ่านวัตถุดิบ/ราคา/เวลา
app.get('/api/menu_ingredient', requireClientToken, async (req, res) => {
  try {
    const { menu_id, ingredient_type } = req.query;
    if (!menu_id) return res.status(400).json({ error: 'Missing menu_id' });
    const data = await getMenuIngredients(menu_id, ingredient_type);
    res.json(data);
  } catch (err) {
    handleDbError(res, err);
  }
});

// GET /api/menu_subtype - ดึงข้อมูลประเภทเมนูย่อย (Hot/Iced/Frappe)
app.get('/api/menu_subtype', requireClientToken, async (req, res) => {
  void req;
  try {
    const subtypes = await getMenuSubtypes();
    res.json(subtypes);
  } catch (err) {
    handleDbError(res, err);
  }
});

// GET /api/menu_type - ใช้ในหลังบ้านเท่านั้น จึงต้องผ่าน requireAdmin
app.get('/api/menu_type', requireAdmin, async (req, res) => {
  void req;
  try {
    const result = await pool.query('SELECT * FROM menu_type ORDER BY type_id');
    res.json(result.rows);
  } catch (err) {
    handleDbError(res, err);
  }
});

// ===== MENU CRUD =====
// กลุ่มนี้เป็นงานจัดการข้อมูลเมนูในหลังบ้าน (create/update/delete)

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
    handleDbError(res, err);
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
    if (result.rowCount === 0) return notFound(res, 'Menu');
    res.json(result.rows[0]);
  } catch (err) {
    handleDbError(res, err);
  }
});

// DELETE /api/menu/:id - ลบความสัมพันธ์ menu_ingredient ก่อน แล้วค่อยลบเมนูหลัก
app.delete('/api/menu/:id', requireAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM menu_ingredient WHERE menu_id = $1', [id]);
    const result = await pool.query('DELETE FROM menu WHERE menu_id = $1 RETURNING *', [id]);
    if (result.rowCount === 0) return notFound(res, 'Menu');
    res.json({ success: true, deleted: result.rows[0] });
  } catch (err) {
    handleDbError(res, err);
  }
});

// ===== MENU_INGREDIENT CRUD =====
// กลุ่มนี้จัดการ "สูตรวัตถุดิบต่อเมนู" (ตารางกลาง menu_ingredient)

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
    handleDbError(res, err);
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
    handleDbError(res, err);
  }
});

// DELETE /api/menu_ingredient/:menu_id/:ingredient_id - ลบ ingredient จากเมนู
app.delete('/api/menu_ingredient/:menu_id/:ingredient_id', requireAdmin, async (req, res) => {
  const { menu_id, ingredient_id } = req.params;
  try {
    await pool.query('DELETE FROM menu_ingredient WHERE menu_id=$1 AND ingredient_id=$2', [menu_id, ingredient_id]);
    res.json({ success: true });
  } catch (err) {
    handleDbError(res, err);
  }
});

// GET /api/menu_all - ดึงเมนูทุกแถว (ไม่ group) สำหรับ admin
app.get('/api/menu_all', requireAdmin, async (req, res) => {
  void req;
  try {
    const result = await pool.query('SELECT * FROM menu ORDER BY menu_id');
    res.json(result.rows);
  } catch (err) {
    handleDbError(res, err);
  }
});

export default app;
