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
function Cart({ items, onRemove, onUpdateQty, onConfirmOrder, cancelDisabled, cartTotal, cartTotalDuration }) {
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
      <ul>
        {items.map((item, idx) => (
          <li key={idx}>
            {item.name} x {item.qty} = {item.price * item.qty} ฿
            {item.addons && item.addons.length > 0 && (
              <div style={{ marginTop: 4, color: '#444', fontSize: 14 }}>
                Add-on: {item.addons.map(addon => addon.name).join(', ')}
              </div>
            )}
            <button onClick={() => onUpdateQty(idx, item.qty - 1)} style={{ marginLeft: 8 }}>-</button>
            <button onClick={() => onUpdateQty(idx, item.qty + 1)} style={{ marginLeft: 4 }}>+</button>
            <label style={{ marginLeft: 12 }}>
              <input
                type="checkbox"
                checked={!!item.straw}
                onChange={() => handleCheckboxChange(idx, 'straw')}
              /> รับหลอด
            </label>
            <label style={{ marginLeft: 8 }}>
              <input
                type="checkbox"
                checked={!!item.lid}
                onChange={() => handleCheckboxChange(idx, 'lid')}
              /> รับฝา
            </label>
            <button onClick={() => onRemove(idx)} style={{ marginLeft: 8 }}>Remove</button>
          </li>
        ))}
      </ul>
      <div className="cart-total">
        <strong>Total:</strong> {total} ฿<br />
        <strong>Preparation time:</strong> {totalDuration} seconds
      </div>
      <button
        className="cart-confirm-button"
        style={{ marginTop: 16, background: '#27ae60', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: '1rem', cursor: 'pointer' }}
        onClick={handleConfirmOrder}
      >
        Confirm Order
      </button>
    </div>
  );
}

export default Cart;
