import React, { useCallback, useEffect, useState } from 'react';
import { URL } from './config';

const API = URL;
const getAdminKey = () => sessionStorage.getItem('adminKeyHash') || '';

// ===== API helpers =====
const apiFetch = async (path, opts = {}) => {
  const headers = { ...(opts.headers || {}) };
  const adminKey = getAdminKey();
  if (adminKey) headers['x-admin-key'] = adminKey;

  const response = await fetch(API + path, { ...opts, headers });
  const raw = await response.text();

  let payload = null;
  try {
    payload = raw ? JSON.parse(raw) : null;
  } catch (_) {
    if (!response.ok) {
      throw new Error('Server returned non-JSON response');
    }
    return raw;
  }

  if (!response.ok) {
    throw new Error((payload && payload.error) || 'Error');
  }
  return payload;
};

const jsonOpts = (method, body) => ({
  method,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});

// ===== Stock (Ingredient) Tab =====
function StockTab({ onDataChange }) {
  const LOW_STOCK_THRESHOLD = 100;
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState(null);
  const [editData, setEditData] = useState({});
  const [newItem, setNewItem] = useState({ ingredient_id: '', ingredient_name_th: '', ingredient_name_en: '', ingredient_type: 'T01', stock_qty: 0, unit_th: '', unit_en: '', duration: 0, addon_price: 5 });
  const [showAdd, setShowAdd] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    apiFetch('api/ingredient').then(setItems).catch(e => setError(e.message)).finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const startEdit = (item) => { setEditId(item.ingredient_id); setEditData({ ...item }); };
  const cancelEdit = () => { setEditId(null); setEditData({}); };

  const saveEdit = async () => {
    try {
      await apiFetch(`api/ingredient/${editId}`, jsonOpts('PUT', editData));
      setEditId(null);
      load();
      if (onDataChange) onDataChange();
    } catch (e) { setError(e.message); }
  };

  const deleteItem = async (id) => {
    if (!window.confirm(`ลบ ${id} ?`)) return;
    try {
      await apiFetch(`api/ingredient/${id}`, { method: 'DELETE' });
      load();
      if (onDataChange) onDataChange();
    }
    catch (e) { setError(e.message); }
  };

  const addItem = async () => {
    try {
      await apiFetch('api/ingredient', jsonOpts('POST', newItem));
      setShowAdd(false);
      setNewItem({ ingredient_id: '', ingredient_name_th: '', ingredient_name_en: '', ingredient_type: 'T01', stock_qty: 0, unit_th: '', unit_en: '', duration: 0, addon_price: 5 });
      load();
      if (onDataChange) onDataChange();
    } catch (e) { setError(e.message); }
  };

  const fld = (key, label, type = 'text', obj, setter) => (
    <td>
      <input
        type={type}
        value={obj[key] ?? ''}
        onChange={e => setter(prev => ({ ...prev, [key]: type === 'number' ? Number(e.target.value) : e.target.value }))}
        style={{ width: type === 'number' ? 70 : 110, padding: '2px 4px' }}
      />
    </td>
  );

  const sortedItems = [...items].sort((a, b) => Number(a.stock_qty) - Number(b.stock_qty));

  return (
    <div>
      {error && <div style={{ color: 'red', marginBottom: 8 }}>Error: {error} <button onClick={() => setError(null)}>✕</button></div>}
      <div style={{ marginBottom: 12 }}>
        <button onClick={() => setShowAdd(v => !v)} style={btnStyle('#27ae60')}>+ เพิ่มวัตถุดิบ</button>
        <button onClick={load} style={{ ...btnStyle('#555'), marginLeft: 8 }}>↺ Refresh</button>
      </div>
      {showAdd && (
        <table style={tableStyle}>
          <thead><tr style={{ background: '#e8f5e9' }}>
            <th style={th}>ID</th><th style={th}>ชื่อ TH</th><th style={th}>ชื่อ EN</th>
            <th style={th}>Type</th><th style={th}>Stock</th><th style={th}>หน่วย TH</th>
            <th style={th}>หน่วย EN</th><th style={th}>เวลาเพิ่ม(วิ)</th><th style={th}>ราคา Add-on</th><th style={th}>สถานะ</th><th style={th}></th>
          </tr></thead>
          <tbody><tr>
            {['ingredient_id','ingredient_name_th','ingredient_name_en'].map(k => fld(k, k, 'text', newItem, setNewItem))}
            <td><select value={newItem.ingredient_type} onChange={e => setNewItem(p => ({ ...p, ingredient_type: e.target.value }))} style={{ padding: '2px 4px' }}>
              <option value="T01">T01 - วัตถุดิบ</option>
              <option value="T02">T02 - อุปกรณ์</option>
            </select></td>
            {fld('stock_qty','',  'number', newItem, setNewItem)}
            {fld('unit_th','', 'text', newItem, setNewItem)}
            {fld('unit_en','', 'text', newItem, setNewItem)}
            {fld('duration','', 'number', newItem, setNewItem)}
            {fld('addon_price','', 'number', newItem, setNewItem)}
            <td style={td}>-</td>
            <td><button onClick={addItem} style={btnStyle('#27ae60')}>บันทึก</button></td>
          </tr></tbody>
        </table>
      )}
      {loading ? <div>Loading...</div> : (
        <div style={{ overflowX: 'auto' }}>
          <table style={tableStyle}>
            <thead><tr style={{ background: '#f5f5f5' }}>
              <th style={th}>ID</th><th style={th}>ชื่อ TH</th><th style={th}>ชื่อ EN</th>
              <th style={th}>Type</th><th style={th}>Stock</th><th style={th}>หน่วย TH</th>
              <th style={th}>หน่วย EN</th><th style={th}>เวลาเพิ่ม(วิ)</th><th style={th}>ราคา Add-on</th><th style={th}>สถานะ</th><th style={th}>จัดการ</th>
            </tr></thead>
            <tbody>
              {sortedItems.map(item => editId === item.ingredient_id ? (
                <tr key={item.ingredient_id} style={{ background: '#fffde7' }}>
                  <td style={td}>{item.ingredient_id}</td>
                  {['ingredient_name_th','ingredient_name_en'].map(k => fld(k,'','text',editData,setEditData))}
                  <td><select value={editData.ingredient_type} onChange={e => setEditData(p => ({...p,ingredient_type:e.target.value}))} style={{padding:'2px 4px'}}>
                    <option value="T01">T01 - วัตถุดิบ</option>
                    <option value="T02">T02 - อุปกรณ์</option>
                  </select></td>
                  {fld('stock_qty','','number',editData,setEditData)}
                  {fld('unit_th','','text',editData,setEditData)}
                  {fld('unit_en','','text',editData,setEditData)}
                  {fld('duration','','number',editData,setEditData)}
                  {fld('addon_price','','number',editData,setEditData)}
                  <td style={td}>-</td>
                  <td>
                    <button onClick={saveEdit} style={btnStyle('#27ae60')}>บันทึก</button>
                    <button onClick={cancelEdit} style={{ ...btnStyle('#888'), marginLeft: 4 }}>ยกเลิก</button>
                  </td>
                </tr>
              ) : (
                <tr
                  key={item.ingredient_id}
                  style={{
                    background: Number(item.stock_qty) <= 0 ? '#ffe8e8' : Number(item.stock_qty) <= LOW_STOCK_THRESHOLD ? '#fff8e1' : undefined,
                    borderLeft: Number(item.stock_qty) <= 0 ? '4px solid #e74c3c' : Number(item.stock_qty) <= LOW_STOCK_THRESHOLD ? '4px solid #f39c12' : undefined,
                  }}
                >
                  <td style={td}>{item.ingredient_id}</td>
                  <td style={td}>{item.ingredient_name_th}</td>
                  <td style={td}>{item.ingredient_name_en}</td>
                  <td style={td}>{item.ingredient_type === 'T01' ? 'วัตถุดิบ' : 'อุปกรณ์'}</td>
                  <td style={{ ...td, textAlign: 'right', fontWeight: Number(item.stock_qty) <= LOW_STOCK_THRESHOLD ? 700 : undefined, color: Number(item.stock_qty) <= 0 ? 'red' : Number(item.stock_qty) <= LOW_STOCK_THRESHOLD ? '#e67e00' : undefined }}>{item.stock_qty}</td>
                  <td style={td}>{item.unit_th}</td>
                  <td style={td}>{item.unit_en}</td>
                  <td style={td}>{item.duration}</td>
                  <td style={{ ...td, textAlign: 'right' }}>{Number(item.addon_price) || 0} ฿</td>
                  <td style={{ ...td, fontWeight: 700, color: Number(item.stock_qty) <= 0 ? '#c0392b' : Number(item.stock_qty) <= LOW_STOCK_THRESHOLD ? '#d68910' : '#2d3436' }}>
                    {Number(item.stock_qty) <= 0 ? 'หมด' : Number(item.stock_qty) <= LOW_STOCK_THRESHOLD ? 'ใกล้หมด' : 'ปกติ'}
                  </td>
                  <td style={td}>
                    <button onClick={() => startEdit(item)} style={btnStyle('#2980b9')}>แก้ไข</button>
                    <button onClick={() => deleteItem(item.ingredient_id)} style={{ ...btnStyle('#e74c3c'), marginLeft: 4 }}>ลบ</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ===== Menu Tab =====
function MenuTab({ onDataChange }) {
  const [menus, setMenus] = useState([]);
  const [menuTypes, setMenuTypes] = useState([]);
  const [subtypes, setSubtypes] = useState([]);
  const [ingredients, setIngredients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState(null);
  const [editData, setEditData] = useState({});
  const [showAdd, setShowAdd] = useState(false);
  const [newItem, setNewItem] = useState({ menu_id: '', menu_name_th: '', menu_name_en: '', menu_type: 'T01', menu_subtype: 'S01', has_milk: false, price: 0, duration: 0 });
  const [error, setError] = useState(null);
  const [ingredientModal, setIngredientModal] = useState(null); // menu_id ที่กำลังดู ingredient
  const [menuIngredients, setMenuIngredients] = useState([]);
  const [newIngRow, setNewIngRow] = useState({ ingredient_id: '', amount: 1 });

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      apiFetch('api/menu_all'),
      apiFetch('api/menu_type'),
      apiFetch('api/menu_subtype'),
      apiFetch('api/ingredient'),
    ]).then(([m, t, s, i]) => { setMenus(m); setMenuTypes(t); setSubtypes(s); setIngredients(i); })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const loadMenuIngredients = async (menu_id) => {
    setIngredientModal(menu_id);
    const data = await apiFetch(`api/menu_ingredient_list/${menu_id}`);
    setMenuIngredients(data);
  };

  const deleteMenuIngredient = async (menu_id, ingredient_id) => {
    await apiFetch(`api/menu_ingredient/${menu_id}/${ingredient_id}`, { method: 'DELETE' });
    loadMenuIngredients(menu_id);
    if (onDataChange) onDataChange();
  };

  const addMenuIngredient = async () => {
    await apiFetch('api/menu_ingredient', jsonOpts('POST', { menu_id: ingredientModal, ...newIngRow }));
    setNewIngRow({ ingredient_id: '', amount: 1 });
    loadMenuIngredients(ingredientModal);
    if (onDataChange) onDataChange();
  };

  const saveEdit = async () => {
    try {
      await apiFetch(`api/menu/${editId}`, jsonOpts('PUT', editData));
      setEditId(null); load();
      if (onDataChange) onDataChange();
    } catch (e) { setError(e.message); }
  };

  const deleteMenu = async (id) => {
    if (!window.confirm(`ลบเมนู ${id} ?`)) return;
    try {
      await apiFetch(`api/menu/${id}`, { method: 'DELETE' });
      load();
      if (onDataChange) onDataChange();
    }
    catch (e) { setError(e.message); }
  };

  const addMenu = async () => {
    try {
      await apiFetch('api/menu', jsonOpts('POST', newItem));
      setShowAdd(false);
      setNewItem({ menu_id: '', menu_name_th: '', menu_name_en: '', menu_type: 'T01', menu_subtype: 'S01', has_milk: false, price: 0, duration: 0 });
      load();
      if (onDataChange) onDataChange();
    } catch (e) { setError(e.message); }
  };

  const typeSelect = (val, setter) => (
    <td><select value={val} onChange={e => setter(p => ({ ...p, menu_type: e.target.value }))} style={{ padding: '2px 4px' }}>
      {menuTypes.map(t => <option key={t.type_id} value={t.type_id}>{t.type_name_th || t.type_id}</option>)}
    </select></td>
  );

  const subtypeSelect = (val, setter) => (
    <td><select value={val} onChange={e => setter(p => ({ ...p, menu_subtype: e.target.value }))} style={{ padding: '2px 4px' }}>
      {subtypes.map(s => <option key={s.subtype_id} value={s.subtype_id}>{s.subtype_name_th || s.subtype_id}</option>)}
    </select></td>
  );

  const numFld = (key, obj, setter, w = 70) => (
    <td><input type="number" value={obj[key] ?? 0} onChange={e => setter(p => ({ ...p, [key]: Number(e.target.value) }))} style={{ width: w, padding: '2px 4px' }} /></td>
  );
  const txtFld = (key, obj, setter, w = 110) => (
    <td><input type="text" value={obj[key] ?? ''} onChange={e => setter(p => ({ ...p, [key]: e.target.value }))} style={{ width: w, padding: '2px 4px' }} /></td>
  );

  return (
    <div>
      {error && <div style={{ color: 'red', marginBottom: 8 }}>Error: {error} <button onClick={() => setError(null)}>✕</button></div>}
      <div style={{ marginBottom: 12 }}>
        <button onClick={() => setShowAdd(v => !v)} style={btnStyle('#27ae60')}>+ เพิ่มเมนู</button>
        <button onClick={load} style={{ ...btnStyle('#555'), marginLeft: 8 }}>↺ Refresh</button>
      </div>

      {/* Modal ingredient จัดการ */}
      {ingredientModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.4)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: 8, padding: 24, minWidth: 500, maxHeight: '80vh', overflow: 'auto' }}>
            <h3 style={{ marginTop: 0 }}>วัตถุดิบของเมนู: {ingredientModal}</h3>
            <table style={tableStyle}>
              <thead><tr style={{ background: '#f5f5f5' }}>
                <th style={th}>Ingredient ID</th><th style={th}>ชื่อ TH</th><th style={th}>จำนวน</th><th style={th}>หน่วย</th><th style={th}>ลบ</th>
              </tr></thead>
              <tbody>
                {menuIngredients.map(r => (
                  <tr key={r.ingredient_id}>
                    <td style={td}>{r.ingredient_id}</td>
                    <td style={td}>{r.ingredient_name_th}</td>
                    <td style={td}>{r.amount}</td>
                    <td style={td}>{r.unit_th}</td>
                    <td style={td}><button onClick={() => deleteMenuIngredient(ingredientModal, r.ingredient_id)} style={btnStyle('#e74c3c')}>ลบ</button></td>
                  </tr>
                ))}
                <tr style={{ background: '#f0fff4' }}>
                  <td><select value={newIngRow.ingredient_id} onChange={e => setNewIngRow(p => ({ ...p, ingredient_id: e.target.value }))} style={{ padding: '2px 4px', width: 130 }}>
                    <option value="">-- เลือก --</option>
                    {ingredients.map(i => <option key={i.ingredient_id} value={i.ingredient_id}>{i.ingredient_id} {i.ingredient_name_th}</option>)}
                  </select></td>
                  <td></td>
                  <td><input type="number" value={newIngRow.amount} onChange={e => setNewIngRow(p => ({ ...p, amount: Number(e.target.value) }))} style={{ width: 60, padding: '2px 4px' }} /></td>
                  <td></td>
                  <td><button onClick={addMenuIngredient} style={btnStyle('#27ae60')}>+ เพิ่ม</button></td>
                </tr>
              </tbody>
            </table>
            <button onClick={() => setIngredientModal(null)} style={{ ...btnStyle('#888'), marginTop: 12 }}>ปิด</button>
          </div>
        </div>
      )}

      {showAdd && (
        <table style={{ ...tableStyle, marginBottom: 12 }}>
          <thead><tr style={{ background: '#e8f5e9' }}>
            <th style={th}>menu_id</th><th style={th}>ชื่อ TH</th><th style={th}>ชื่อ EN</th>
            <th style={th}>ประเภท</th><th style={th}>Subtype</th><th style={th}>มีนม</th>
            <th style={th}>ราคา</th><th style={th}>เวลา(วิ)</th><th style={th}></th>
          </tr></thead>
          <tbody><tr>
            {txtFld('menu_id', newItem, setNewItem, 80)}
            {txtFld('menu_name_th', newItem, setNewItem)}
            {txtFld('menu_name_en', newItem, setNewItem)}
            {typeSelect(newItem.menu_type, setNewItem)}
            {subtypeSelect(newItem.menu_subtype, setNewItem)}
            <td><input type="checkbox" checked={!!newItem.has_milk} onChange={e => setNewItem(p => ({ ...p, has_milk: e.target.checked }))} /></td>
            {numFld('price', newItem, setNewItem)}
            {numFld('duration', newItem, setNewItem)}
            <td><button onClick={addMenu} style={btnStyle('#27ae60')}>บันทึก</button></td>
          </tr></tbody>
        </table>
      )}

      {loading ? <div>Loading...</div> : (
        <div style={{ overflowX: 'auto' }}>
          <table style={tableStyle}>
            <thead><tr style={{ background: '#f5f5f5' }}>
              <th style={th}>menu_id</th><th style={th}>ชื่อ TH</th><th style={th}>ชื่อ EN</th>
              <th style={th}>ประเภท</th><th style={th}>Subtype</th><th style={th}>มีนม</th>
              <th style={th}>ราคา</th><th style={th}>เวลา(วิ)</th><th style={th}>วัตถุดิบ</th><th style={th}>จัดการ</th>
            </tr></thead>
            <tbody>
              {menus.map(menu => editId === menu.menu_id ? (
                <tr key={menu.menu_id} style={{ background: '#fffde7' }}>
                  <td style={td}>{menu.menu_id}</td>
                  {txtFld('menu_name_th', editData, setEditData)}
                  {txtFld('menu_name_en', editData, setEditData)}
                  {typeSelect(editData.menu_type, setEditData)}
                  {subtypeSelect(editData.menu_subtype, setEditData)}
                  <td><input type="checkbox" checked={!!editData.has_milk} onChange={e => setEditData(p => ({ ...p, has_milk: e.target.checked }))} /></td>
                  {numFld('price', editData, setEditData)}
                  {numFld('duration', editData, setEditData)}
                  <td></td>
                  <td>
                    <button onClick={saveEdit} style={btnStyle('#27ae60')}>บันทึก</button>
                    <button onClick={() => setEditId(null)} style={{ ...btnStyle('#888'), marginLeft: 4 }}>ยกเลิก</button>
                  </td>
                </tr>
              ) : (
                <tr key={menu.menu_id}>
                  <td style={td}>{menu.menu_id}</td>
                  <td style={td}>{menu.menu_name_th}</td>
                  <td style={td}>{menu.menu_name_en}</td>
                  <td style={td}>{menuTypes.find(t => t.type_id === menu.menu_type)?.type_name_th || menu.menu_type}</td>
                  <td style={td}>{subtypes.find(s => s.subtype_id === menu.menu_subtype)?.subtype_name_th || menu.menu_subtype}</td>
                  <td style={{ ...td, textAlign: 'center' }}>{menu.has_milk ? '✓' : '-'}</td>
                  <td style={{ ...td, textAlign: 'right' }}>{menu.price} ฿</td>
                  <td style={{ ...td, textAlign: 'right' }}>{menu.duration} วิ</td>
                  <td style={td}><button onClick={() => loadMenuIngredients(menu.menu_id)} style={btnStyle('#8e44ad')}>วัตถุดิบ</button></td>
                  <td style={td}>
                    <button onClick={() => { setEditId(menu.menu_id); setEditData({ ...menu }); }} style={btnStyle('#2980b9')}>แก้ไข</button>
                    <button onClick={() => deleteMenu(menu.menu_id)} style={{ ...btnStyle('#e74c3c'), marginLeft: 4 }}>ลบ</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ===== Shared styles =====
const tableStyle = { width: '100%', borderCollapse: 'collapse', fontSize: 14 };
const th = { padding: '8px 10px', borderBottom: '2px solid #ddd', textAlign: 'left', whiteSpace: 'nowrap' };
const td = { padding: '6px 10px', borderBottom: '1px solid #eee' };
const btnStyle = (bg) => ({ background: bg, color: '#fff', border: 'none', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontSize: 13 });

// ===== AdminPanel main =====
function AdminPanel({ onClose, onLogout, onDataChange }) {
  const [tab, setTab] = useState('stock');

  const handleClose = () => {
    if (onLogout) {
      onLogout();
      return;
    }
    onClose();
  };

  const tabBtn = (key, label) => (
    <button
      key={key}
      onClick={() => setTab(key)}
      style={{ padding: '8px 20px', border: 'none', borderBottom: tab === key ? '3px solid #2980b9' : '3px solid transparent', background: 'none', cursor: 'pointer', fontWeight: tab === key ? 700 : 400, fontSize: 15 }}
    >{label}</button>
  );

  return (
    <div className="cart-popup-overlay" onClick={handleClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 10, padding: 28, width: '95vw', maxWidth: 1100, maxHeight: '90vh', overflow: 'auto', boxShadow: '0 4px 24px #0003' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ margin: 0 }}>ระบบจัดการหลังบ้าน</h2>
          <button onClick={handleClose} style={{ ...btnStyle('#888'), fontSize: 16, padding: '6px 14px' }}>✕ ปิด</button>
        </div>
        <div style={{ borderBottom: '1px solid #ddd', marginBottom: 20 }}>
          {tabBtn('stock', '📦 จัดการสต็อก')}
          {tabBtn('menu', '🍵 จัดการเมนู')}
        </div>
        {tab === 'stock' && <StockTab onDataChange={onDataChange} />}
        {tab === 'menu' && <MenuTab onDataChange={onDataChange} />}
      </div>
    </div>
  );
}

export default AdminPanel;
