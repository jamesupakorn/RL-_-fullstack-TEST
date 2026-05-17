import React from 'react';
import { formatDuration } from './orderUtils';

const fmtPrice = (n) => `฿${Number(n).toLocaleString('th-TH')}`;

function Cart({ items, onRemove, onUpdateQty, onConfirmOrder, onClose, cartTotal, cartTotalDuration }) {
  if (!items || items.length === 0) {
    return (
      <div className="cart-empty-state">
        <div className="cart-empty-icon">🛒</div>
        <div className="cart-empty-text">ยังไม่มีสินค้าในตะกร้า</div>
      </div>
    );
  }

  const handleCheckboxChange = (idx, field) => {
    const newItems = [...items];
    newItems[idx][field] = !newItems[idx][field];
    if (onUpdateQty) onUpdateQty(idx, newItems[idx].qty, newItems[idx].straw, newItems[idx].lid);
  };

  const handleConfirmOrder = () => {
    if (onConfirmOrder) onConfirmOrder(items);
  };

  return (
    <div className="cart-container">
      <div className="cart-popup-header">
        <h2>ตะกร้าสินค้า</h2>
        <button className="cart-popup-close-btn" onClick={onClose} aria-label="ปิด">✕</button>
      </div>
      <ul className="cart-list">
        {items.map((item, idx) => (
          <li key={idx} className="cart-item">
            <div className="cart-item-main">
              <span className="cart-item-name">{item.name}</span>
              <span className="cart-item-meta">×{item.qty} = {fmtPrice(item.price * item.qty)}</span>
            </div>
            {item.addons && item.addons.length > 0 && (
              <div className="cart-addon-line">
                เพิ่มเติม: {item.addons.map(addon => addon.name).join(', ')}
              </div>
            )}
            <div className="cart-item-controls">
              <div className="qty-controls">
                <button
                  className={`qty-btn ${item.qty <= 1 ? 'qty-btn--remove' : ''}`}
                  onClick={() => {
                    if (item.qty <= 1) { onRemove(idx); return; }
                    onUpdateQty(idx, item.qty - 1);
                  }}
                  aria-label={item.qty <= 1 ? `ลบ ${item.name}` : `ลด ${item.name}`}
                  title={item.qty <= 1 ? 'ลบรายการ' : 'ลดจำนวน'}
                >
                  {item.qty <= 1 ? (
                    <svg className="qty-trash-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                      <path d="M4 7h16" /><path d="M9 7V5h6v2" />
                      <path d="M7 7l1 12h8l1-12" /><path d="M10 11v5" /><path d="M14 11v5" />
                    </svg>
                  ) : '-'}
                </button>
                <span className="qty-value">{item.qty}</span>
                <button className="qty-btn" onClick={() => onUpdateQty(idx, item.qty + 1)} aria-label={`เพิ่ม ${item.name}`}>+</button>
              </div>
              <div className="option-controls">
                <label>
                  <input type="checkbox" checked={!!item.straw} onChange={() => handleCheckboxChange(idx, 'straw')} /> รับหลอด
                </label>
                <label>
                  <input type="checkbox" checked={!!item.lid} onChange={() => handleCheckboxChange(idx, 'lid')} /> รับฝา
                </label>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <div className="cart-footer">
        <div className="cart-total">
          <div className="cart-total-line">
            <span>รวม</span>
            <strong>{fmtPrice(cartTotal)}</strong>
          </div>
          <div className="cart-total-line">
            <span>เวลาเตรียม</span>
            <strong>{formatDuration(cartTotalDuration)}</strong>
          </div>
        </div>
        <div className="cart-action-stack">
          <button className="cart-close-button" onClick={onClose}>ปิด</button>
          <button className="cart-confirm-button" onClick={handleConfirmOrder}>ยืนยันออเดอร์</button>
        </div>
      </div>
    </div>
  );
}

export default Cart;
