import React, { useCallback, useEffect, useState } from 'react';
import { URL } from './config';
import { getClientToken } from './api';
import { getIngredientTypeLabelTh, getStockStatus, getStockStatusLabelTh, STOCK_STATUS } from '../utils/stockUtils';
import '../styles/AdminPanel.css';

const API = URL;
const getAdminKey = () => sessionStorage.getItem('adminKeyHash') || '';

// ===== API helpers =====
const apiFetch = async (path, opts = {}) => {
  const headers = { ...(opts.headers || {}) };
  const adminKey = getAdminKey();
  if (adminKey) headers['x-admin-key'] = adminKey;

  // แนบ client token ทุก request (ไม่ว่าจะเป็น admin route หรือ public route)
  const token = await getClientToken();
  if (token) headers['x-client-token'] = token;

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

  const fld = (key, type = 'text', obj, setter) => (
    <td className="admin-td">
      <input
        type={type}
        value={obj[key] ?? ''}
        onChange={e => setter(prev => ({ ...prev, [key]: type === 'number' ? Number(e.target.value) : e.target.value }))}
        className={`admin-input ${type === 'number' ? 'admin-input--sm' : 'admin-input--md'}`}
      />
    </td>
  );

  const sortedItems = [...items].sort((a, b) => Number(a.stock_qty) - Number(b.stock_qty));

  return (
    <div className="admin-tab-content">
      {error && <div className="admin-error">Error: {error} <button className="admin-error-close" onClick={() => setError(null)}>✕</button></div>}
      <div className="admin-toolbar">
        <button onClick={() => setShowAdd(v => !v)} className="admin-btn admin-btn--success">+ เพิ่มวัตถุดิบ</button>
        <button onClick={load} className="admin-btn admin-btn--neutral">↺ Refresh</button>
      </div>
      {showAdd && (
        <div className="admin-table-wrap">
        <table className="admin-table admin-table--editor">
          <thead><tr>
            <th className="admin-th">ID</th><th className="admin-th">ชื่อ TH</th><th className="admin-th">ชื่อ EN</th>
            <th className="admin-th">Type</th><th className="admin-th">Stock</th><th className="admin-th">หน่วย TH</th>
            <th className="admin-th">หน่วย EN</th><th className="admin-th">เวลาเพิ่ม(วิ)</th><th className="admin-th">ราคา Add-on</th><th className="admin-th">สถานะ</th><th className="admin-th"></th>
          </tr></thead>
          <tbody><tr>
            {['ingredient_id','ingredient_name_th','ingredient_name_en'].map(k => fld(k, 'text', newItem, setNewItem))}
            <td className="admin-td"><select value={newItem.ingredient_type} onChange={e => setNewItem(p => ({ ...p, ingredient_type: e.target.value }))} className="admin-select">
              <option value="T01">T01 - วัตถุดิบ</option>
              <option value="T02">T02 - อุปกรณ์</option>
            </select></td>
            {fld('stock_qty', 'number', newItem, setNewItem)}
            {fld('unit_th', 'text', newItem, setNewItem)}
            {fld('unit_en', 'text', newItem, setNewItem)}
            {fld('duration', 'number', newItem, setNewItem)}
            {fld('addon_price', 'number', newItem, setNewItem)}
            <td className="admin-td">-</td>
            <td className="admin-td"><button onClick={addItem} className="admin-btn admin-btn--success">บันทึก</button></td>
          </tr></tbody>
        </table>
        </div>
      )}
      {loading ? <div className="admin-loading">Loading...</div> : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead><tr>
              <th className="admin-th">ID</th><th className="admin-th">ชื่อ TH</th><th className="admin-th">ชื่อ EN</th>
              <th className="admin-th">Type</th><th className="admin-th">Stock</th><th className="admin-th">หน่วย TH</th>
              <th className="admin-th">หน่วย EN</th><th className="admin-th">เวลาเพิ่ม(วิ)</th><th className="admin-th">ราคา Add-on</th><th className="admin-th">สถานะ</th><th className="admin-th">จัดการ</th>
            </tr></thead>
            <tbody>
              {sortedItems.map(item => editId === item.ingredient_id ? (
                <tr key={item.ingredient_id} className="admin-row admin-row--editing">
                  <td className="admin-td">{item.ingredient_id}</td>
                  {['ingredient_name_th','ingredient_name_en'].map(k => fld(k, 'text', editData, setEditData))}
                  <td className="admin-td"><select value={editData.ingredient_type} onChange={e => setEditData(p => ({...p,ingredient_type:e.target.value}))} className="admin-select">
                    <option value="T01">T01 - วัตถุดิบ</option>
                    <option value="T02">T02 - อุปกรณ์</option>
                  </select></td>
                  {fld('stock_qty', 'number', editData, setEditData)}
                  {fld('unit_th', 'text', editData, setEditData)}
                  {fld('unit_en', 'text', editData, setEditData)}
                  {fld('duration', 'number', editData, setEditData)}
                  {fld('addon_price', 'number', editData, setEditData)}
                  <td className="admin-td">-</td>
                  <td className="admin-td admin-actions-cell">
                    <button onClick={saveEdit} className="admin-btn admin-btn--success">บันทึก</button>
                    <button onClick={cancelEdit} className="admin-btn admin-btn--light">ยกเลิก</button>
                  </td>
                </tr>
              ) : (
                <tr
                  key={item.ingredient_id}
                  className={`admin-row ${getStockStatus(item.stock_qty, LOW_STOCK_THRESHOLD) === STOCK_STATUS.OUT ? 'admin-row--danger' : getStockStatus(item.stock_qty, LOW_STOCK_THRESHOLD) === STOCK_STATUS.LOW ? 'admin-row--warn' : ''}`}
                >
                  <td className="admin-td">{item.ingredient_id}</td>
                  <td className="admin-td">{item.ingredient_name_th}</td>
                  <td className="admin-td">{item.ingredient_name_en}</td>
                  <td className="admin-td">{getIngredientTypeLabelTh(item.ingredient_type)}</td>
                  <td className="admin-td admin-td--num">{item.stock_qty}</td>
                  <td className="admin-td">{item.unit_th}</td>
                  <td className="admin-td">{item.unit_en}</td>
                  <td className="admin-td">{item.duration}</td>
                  <td className="admin-td admin-td--num">{Number(item.addon_price) || 0} ฿</td>
                  <td className="admin-td admin-td--status">
                    {getStockStatusLabelTh(getStockStatus(item.stock_qty, LOW_STOCK_THRESHOLD))}
                  </td>
                  <td className="admin-td admin-actions-cell">
                    <button onClick={() => startEdit(item)} className="admin-btn admin-btn--primary">แก้ไข</button>
                    <button onClick={() => deleteItem(item.ingredient_id)} className="admin-btn admin-btn--danger">ลบ</button>
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
    <td className="admin-td"><select value={val} onChange={e => setter(p => ({ ...p, menu_type: e.target.value }))} className="admin-select">
      {menuTypes.map(t => <option key={t.type_id} value={t.type_id}>{t.type_name_th || t.type_id}</option>)}
    </select></td>
  );

  const subtypeSelect = (val, setter) => (
    <td className="admin-td"><select value={val} onChange={e => setter(p => ({ ...p, menu_subtype: e.target.value }))} className="admin-select">
      {subtypes.map(s => <option key={s.subtype_id} value={s.subtype_id}>{s.subtype_name_th || s.subtype_id}</option>)}
    </select></td>
  );

  const inputSizeClass = (width) => {
    if (width <= 90) return 'admin-input--sm';
    if (width <= 130) return 'admin-input--md';
    return 'admin-input--lg';
  };

  const numFld = (key, obj, setter, w = 70) => (
    <td className="admin-td"><input className={`admin-input ${inputSizeClass(w + 18)}`} type="number" value={obj[key] ?? 0} onChange={e => setter(p => ({ ...p, [key]: Number(e.target.value) }))} /></td>
  );
  const txtFld = (key, obj, setter, w = 110) => (
    <td className="admin-td"><input className={`admin-input ${inputSizeClass(w + 18)}`} type="text" value={obj[key] ?? ''} onChange={e => setter(p => ({ ...p, [key]: e.target.value }))} /></td>
  );

  return (
    <div className="admin-tab-content">
      {error && <div className="admin-error">Error: {error} <button className="admin-error-close" onClick={() => setError(null)}>✕</button></div>}
      <div className="admin-toolbar">
        <button onClick={() => setShowAdd(v => !v)} className="admin-btn admin-btn--success">+ เพิ่มเมนู</button>
        <button onClick={load} className="admin-btn admin-btn--neutral">↺ Refresh</button>
      </div>

      {/* Modal ingredient จัดการ */}
      {ingredientModal && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-card">
            <h3 className="admin-modal-title">วัตถุดิบของเมนู: {ingredientModal}</h3>
            <table className="admin-table">
              <thead><tr>
                <th className="admin-th">Ingredient ID</th><th className="admin-th">ชื่อ TH</th><th className="admin-th">จำนวน</th><th className="admin-th">หน่วย</th><th className="admin-th">ลบ</th>
              </tr></thead>
              <tbody>
                {menuIngredients.map(r => (
                  <tr key={r.ingredient_id}>
                    <td className="admin-td">{r.ingredient_id}</td>
                    <td className="admin-td">{r.ingredient_name_th}</td>
                    <td className="admin-td">{r.amount}</td>
                    <td className="admin-td">{r.unit_th}</td>
                    <td className="admin-td"><button onClick={() => deleteMenuIngredient(ingredientModal, r.ingredient_id)} className="admin-btn admin-btn--danger">ลบ</button></td>
                  </tr>
                ))}
                <tr className="admin-row admin-row--add">
                  <td className="admin-td"><select className="admin-select admin-select--wide" value={newIngRow.ingredient_id} onChange={e => setNewIngRow(p => ({ ...p, ingredient_id: e.target.value }))}>
                    <option value="">-- เลือก --</option>
                    {ingredients.map(i => <option key={i.ingredient_id} value={i.ingredient_id}>{i.ingredient_id} {i.ingredient_name_th}</option>)}
                  </select></td>
                  <td className="admin-td"></td>
                  <td className="admin-td"><input className="admin-input admin-input--sm" type="number" value={newIngRow.amount} onChange={e => setNewIngRow(p => ({ ...p, amount: Number(e.target.value) }))} /></td>
                  <td className="admin-td"></td>
                  <td className="admin-td"><button onClick={addMenuIngredient} className="admin-btn admin-btn--success">+ เพิ่ม</button></td>
                </tr>
              </tbody>
            </table>
            <button onClick={() => setIngredientModal(null)} className="admin-btn admin-btn--light admin-modal-close">ปิด</button>
          </div>
        </div>
      )}

      {showAdd && (
        <div className="admin-table-wrap">
        <table className="admin-table admin-table--editor">
          <thead><tr>
            <th className="admin-th">menu_id</th><th className="admin-th">ชื่อ TH</th><th className="admin-th">ชื่อ EN</th>
            <th className="admin-th">ประเภท</th><th className="admin-th">Subtype</th><th className="admin-th">มีนม</th>
            <th className="admin-th">ราคา</th><th className="admin-th">เวลา(วิ)</th><th className="admin-th"></th>
          </tr></thead>
          <tbody><tr>
            {txtFld('menu_id', newItem, setNewItem, 80)}
            {txtFld('menu_name_th', newItem, setNewItem)}
            {txtFld('menu_name_en', newItem, setNewItem)}
            {typeSelect(newItem.menu_type, setNewItem)}
            {subtypeSelect(newItem.menu_subtype, setNewItem)}
            <td className="admin-td"><input type="checkbox" checked={!!newItem.has_milk} onChange={e => setNewItem(p => ({ ...p, has_milk: e.target.checked }))} /></td>
            {numFld('price', newItem, setNewItem)}
            {numFld('duration', newItem, setNewItem)}
            <td className="admin-td"><button onClick={addMenu} className="admin-btn admin-btn--success">บันทึก</button></td>
          </tr></tbody>
        </table>
        </div>
      )}

      {loading ? <div className="admin-loading">Loading...</div> : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead><tr>
              <th className="admin-th">menu_id</th><th className="admin-th">ชื่อ TH</th><th className="admin-th">ชื่อ EN</th>
              <th className="admin-th">ประเภท</th><th className="admin-th">Subtype</th><th className="admin-th">มีนม</th>
              <th className="admin-th">ราคา</th><th className="admin-th">เวลา(วิ)</th><th className="admin-th">วัตถุดิบ</th><th className="admin-th">จัดการ</th>
            </tr></thead>
            <tbody>
              {menus.map(menu => editId === menu.menu_id ? (
                <tr key={menu.menu_id} className="admin-row admin-row--editing">
                  <td className="admin-td">{menu.menu_id}</td>
                  {txtFld('menu_name_th', editData, setEditData)}
                  {txtFld('menu_name_en', editData, setEditData)}
                  {typeSelect(editData.menu_type, setEditData)}
                  {subtypeSelect(editData.menu_subtype, setEditData)}
                  <td className="admin-td"><input type="checkbox" checked={!!editData.has_milk} onChange={e => setEditData(p => ({ ...p, has_milk: e.target.checked }))} /></td>
                  {numFld('price', editData, setEditData)}
                  {numFld('duration', editData, setEditData)}
                  <td className="admin-td"></td>
                  <td className="admin-td admin-actions-cell">
                    <button onClick={saveEdit} className="admin-btn admin-btn--success">บันทึก</button>
                    <button onClick={() => setEditId(null)} className="admin-btn admin-btn--light">ยกเลิก</button>
                  </td>
                </tr>
              ) : (
                <tr key={menu.menu_id}>
                  <td className="admin-td">{menu.menu_id}</td>
                  <td className="admin-td">{menu.menu_name_th}</td>
                  <td className="admin-td">{menu.menu_name_en}</td>
                  <td className="admin-td">{menuTypes.find(t => t.type_id === menu.menu_type)?.type_name_th || menu.menu_type}</td>
                  <td className="admin-td">{subtypes.find(s => s.subtype_id === menu.menu_subtype)?.subtype_name_th || menu.menu_subtype}</td>
                  <td className="admin-td admin-td--center">{menu.has_milk ? '✓' : '-'}</td>
                  <td className="admin-td admin-td--num">{menu.price} ฿</td>
                  <td className="admin-td admin-td--num">{menu.duration} วิ</td>
                  <td className="admin-td"><button onClick={() => loadMenuIngredients(menu.menu_id)} className="admin-btn admin-btn--accent">วัตถุดิบ</button></td>
                  <td className="admin-td admin-actions-cell">
                    <button onClick={() => { setEditId(menu.menu_id); setEditData({ ...menu }); }} className="admin-btn admin-btn--primary">แก้ไข</button>
                    <button onClick={() => deleteMenu(menu.menu_id)} className="admin-btn admin-btn--danger">ลบ</button>
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
      className={`admin-tab-btn ${tab === key ? 'is-active' : ''}`}
    >{label}</button>
  );

  return (
    <div className="cart-popup-overlay" onClick={handleClose}>
      <div onClick={e => e.stopPropagation()} className="admin-panel-card">
        <div className="admin-panel-header">
          <h2 className="admin-panel-title">ระบบจัดการหลังบ้าน</h2>
          <button onClick={handleClose} className="admin-btn admin-btn--light admin-panel-close">✕ ปิด</button>
        </div>
        <div className="admin-tab-strip">
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
