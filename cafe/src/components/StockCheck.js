import React, { useEffect, useMemo, useState } from 'react';
import { useApiCache } from './api';

function StockCheck({ onClose }) {
  const { getIngredients } = useApiCache();
  const [ingredients, setIngredients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [keyword, setKeyword] = useState('');

  const loadStock = async (forceRefresh = false) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getIngredients(forceRefresh);
      setIngredients(data || []);
    } catch (err) {
      setError(err.message || 'Failed to load stock');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStock(false);
    // รันครั้งเดียวตอน mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredIngredients = useMemo(() => {
    const search = keyword.trim().toLowerCase();
    if (!search) return ingredients;
    return ingredients.filter((item) => {
      const id = String(item.ingredient_id || '').toLowerCase();
      const name = String(item.ingredient_name_th || item.ingredient_name_en || '').toLowerCase();
      return id.includes(search) || name.includes(search);
    });
  }, [ingredients, keyword]);

  const categorizedIngredients = useMemo(() => {
    // Map ingredient_type เป็นชื่อหมวดหมู่ภาษาไทย
    const typeMap = {
      T01: 'วัตถุดิบ',
      T02: 'อุปกรณ์',
    };
    return filteredIngredients.map((item) => {
      const qty = Number(item.stock_qty || 0);
      const type = String(item.ingredient_type || '');
      let category = typeMap[type] || 'อื่นๆ';

      let status = 'ยังเหลือ';
      if (qty <= 0) {
        status = 'หมด';
      } else if (qty <= 10) {
        status = 'ใกล้หมด';
      }

      return {
        ...item,
        qty,
        category,
        status,
        isCritical: qty <= 10,
      };
    });
  }, [filteredIngredients]);

  const summary = useMemo(() => {
    const total = ingredients.length;
    const low = ingredients.filter((item) => Number(item.stock_qty || 0) > 0 && Number(item.stock_qty || 0) <= 10).length;
    const out = ingredients.filter((item) => Number(item.stock_qty || 0) <= 0).length;
    const normal = ingredients.filter((item) => Number(item.stock_qty || 0) > 10).length;
    return { total, low, out, normal };
  }, [ingredients]);

  const groupedByCategory = useMemo(() => {
    const groups = {
      'วัตถุดิบ': { critical: [], normal: [] },
      'อุปกรณ์': { critical: [], normal: [] },
      'อื่นๆ': { critical: [], normal: [] },
    };

    categorizedIngredients.forEach((item) => {
      if (!groups[item.category]) {
        groups[item.category] = { critical: [], normal: [] };
      }
      if (item.isCritical) {
        groups[item.category].critical.push(item);
      } else {
        groups[item.category].normal.push(item);
      }
    });

    Object.values(groups).forEach((group) => {
      group.critical.sort((a, b) => a.qty - b.qty);
      group.normal.sort((a, b) => a.qty - b.qty);
    });

    return groups;
  }, [categorizedIngredients]);

  const renderTable = (rows, emptyText) => (
    <div style={{ border: '1px solid #ddd', borderRadius: 8, overflow: 'hidden', marginBottom: 12 }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: '#f7f7f7' }}>
            <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #ddd' }}>ID</th>
            <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #ddd' }}>Name</th>
            <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #ddd' }}>Type</th>
            <th style={{ textAlign: 'right', padding: 8, borderBottom: '1px solid #ddd' }}>Stock</th>
            <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #ddd' }}>Unit</th>
            <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #ddd' }}>Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((item) => (
            <tr key={item.ingredient_id} style={item.isCritical ? { background: '#fff8e1' } : undefined}>
              <td style={{ padding: 8, borderBottom: '1px solid #eee' }}>{item.ingredient_id}</td>
              <td style={{ padding: 8, borderBottom: '1px solid #eee' }}>{item.ingredient_name_th || item.ingredient_name_en}</td>
              <td style={{ padding: 8, borderBottom: '1px solid #eee' }}>{item.ingredient_type}</td>
              <td style={{ padding: 8, textAlign: 'right', borderBottom: '1px solid #eee' }}>{item.qty}</td>
              <td style={{ padding: 8, borderBottom: '1px solid #eee' }}>{item.unit_th || item.unit_en}</td>
              <td style={{ padding: 8, borderBottom: '1px solid #eee' }}>{item.status}</td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={6} style={{ padding: 12, textAlign: 'center', color: '#666' }}>
                {emptyText}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="cart-popup-overlay" onClick={onClose}>
      <div className="cart-popup" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 900 }}>
        <h2 style={{ marginTop: 0 }}>Stock Check</h2>

        <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="Search by ingredient id or name"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            style={{ flex: 1, minWidth: 240, padding: '8px 10px' }}
          />
          <button onClick={() => loadStock(true)}>Refresh</button>
          <button onClick={onClose}>Close</button>
        </div>

        <div style={{ marginBottom: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <div style={{ padding: '6px 10px', background: '#eef7ff', borderRadius: 6 }}><strong>ทั้งหมด:</strong> {summary.total}</div>
          <div style={{ padding: '6px 10px', background: '#e8f7ee', borderRadius: 6 }}><strong>ยังเหลือ:</strong> {summary.normal}</div>
          <div style={{ padding: '6px 10px', background: '#fff8e1', borderRadius: 6 }}><strong>ใกล้หมด ({'<=10'}):</strong> {summary.low}</div>
          <div style={{ padding: '6px 10px', background: '#ffe8e8', borderRadius: 6 }}><strong>หมด:</strong> {summary.out}</div>
        </div>

        {loading && <div>Loading stock...</div>}
        {error && <div style={{ color: 'red' }}>Error: {error}</div>}

        {!loading && !error && (
          <div style={{ maxHeight: 520, overflow: 'auto' }}>
            {['วัตถุดิบ', 'อุปกรณ์', 'อื่นๆ'].map((category) => {
              const group = groupedByCategory[category];
              const totalInCategory = (group?.critical.length || 0) + (group?.normal.length || 0);
              if (!totalInCategory) return null;

              return (
                <div key={category} style={{ marginBottom: 16 }}>
                  <h3 style={{ margin: '10px 0 8px 0' }}>{category}</h3>

                  <div style={{ fontWeight: 600, marginBottom: 6 }}>ต้องเติม / ใกล้หมด</div>
                  {renderTable(group.critical, 'ไม่มีรายการที่ใกล้หมดหรือหมด')}

                  <div style={{ fontWeight: 600, marginBottom: 6 }}>สต็อกยังเหลือ</div>
                  {renderTable(group.normal, 'ไม่มีรายการสต็อกปกติ')}
                </div>
              );
            })}

            {categorizedIngredients.length === 0 && (
              <div style={{ padding: 12, textAlign: 'center', color: '#666', border: '1px solid #ddd', borderRadius: 8 }}>
                No matching ingredient
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default StockCheck;
