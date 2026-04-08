// Cart.js - React component สำหรับตะกร้าสินค้า
// อธิบายโค้ดเป็นภาษาไทยในแต่ละส่วน
import React from 'react';
// import { deductStockByMenu } from './api';

/**
 * Cart component สำหรับแสดงรายการสินค้าในตะกร้า
 * @param {Array} items - array ของสินค้าในตะกร้า
 * @param {Function} onRemove - ฟังก์ชันสำหรับลบสินค้าออกจากตะกร้า
 */
/**
 * Cart component สำหรับแสดงรายการสินค้าในตะกร้า
 * @param {Array} items - array ของสินค้าในตะกร้า
 * @param {Function} onRemove - ฟังก์ชันสำหรับลบสินค้าออกจากตะกร้า
 * @param {Function} onUpdateQty - ฟังก์ชันสำหรับแก้ไขจำนวนสินค้า
 */
function Cart({ items, onRemove, onUpdateQty, onConfirmOrder, onClose, cancelDisabled, cartTotal, cartTotalDuration }) {
  // ถ้าไม่มีสินค้าในตะกร้า
  if (!items || items.length === 0) {
    return <div className="cart-empty">Cart is empty</div>; // ตะกร้าว่าง
  }

  // รับค่าราคารวมและเวลารวมจาก props (คำนวณด้วย orderUtils.js)
  const total = cartTotal;
  const totalDuration = cartTotalDuration;

  // ฟังก์ชันสำหรับ toggle checkbox หลอด/ฝา
  const handleCheckboxChange = (idx, field) => {
    const newItems = [...items];
    newItems[idx][field] = !newItems[idx][field];
    if (onUpdateQty) onUpdateQty(idx, newItems[idx].qty, newItems[idx].straw, newItems[idx].lid);
  };

  // ฟังก์ชันสำหรับยืนยัน order ส่ง event ไป parent เท่านั้น
  const handleConfirmOrder = () => {
    if (onConfirmOrder) onConfirmOrder(items);
  };

  return (
    <div className="cart-container">
      <h2>Shopping Cart</h2> {/* Title */}
      <ul className="cart-list">
        {items.map((item, idx) => (
          <li key={idx} className="cart-item">
            <div className="cart-item-main">
              <span className="cart-item-name">{item.name}</span>
              <span className="cart-item-meta">x {item.qty} = {item.price * item.qty} ฿</span>
            </div>
            {item.addons && item.addons.length > 0 && (
              <div className="cart-addon-line">
                Add-on: {item.addons.map(addon => addon.name).join(', ')}
              </div>
            )}

            <div className="cart-item-controls">
              <div className="qty-controls">
                <button
                  className={`qty-btn ${item.qty <= 1 ? 'qty-btn--remove' : ''}`}
                  onClick={() => {
                    if (item.qty <= 1) {
                      onRemove(idx);
                      return;
                    }
                    onUpdateQty(idx, item.qty - 1);
                  }}
                  aria-label={item.qty <= 1 ? `Remove ${item.name}` : `Decrease ${item.name}`}
                  title={item.qty <= 1 ? 'Remove item' : 'Decrease quantity'}
                >
                  {item.qty <= 1 ? (
                    <svg className="qty-trash-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                      <path d="M4 7h16" />
                      <path d="M9 7V5h6v2" />
                      <path d="M7 7l1 12h8l1-12" />
                      <path d="M10 11v5" />
                      <path d="M14 11v5" />
                    </svg>
                  ) : '-'}
                </button>
                <span className="qty-value">{item.qty}</span>
                <button
                  className="qty-btn"
                  onClick={() => onUpdateQty(idx, item.qty + 1)}
                  aria-label={`Increase ${item.name}`}
                >
                  +
                </button>
              </div>

              <div className="option-controls">
                <label>
                  <input
                    type="checkbox"
                    checked={!!item.straw}
                    onChange={() => handleCheckboxChange(idx, 'straw')}
                  /> รับหลอด
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={!!item.lid}
                    onChange={() => handleCheckboxChange(idx, 'lid')}
                  /> รับฝา
                </label>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <div className="cart-footer">
        <div className="cart-total">
          <div className="cart-total-line">
            <span>Total</span>
            <strong>{total} ฿</strong>
          </div>
          <div className="cart-total-line">
            <span>Preparation time</span>
            <strong>{totalDuration} seconds</strong>
          </div>
        </div>

        <div className="cart-action-stack">
          <button className="cart-close-button" onClick={onClose}>Close</button>
          <button
            className="cart-confirm-button"
            onClick={handleConfirmOrder}
          >
            Confirm Order
          </button>
        </div>
      </div>
    </div>
  );
}

export default Cart;
