// Cart.js - React component สำหรับตะกร้าสินค้า
// อธิบายโค้ดเป็นภาษาไทยในแต่ละส่วน
import React from 'react';

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
function Cart({ items, onRemove, onUpdateQty, onConfirmOrder }) {
  // ถ้าไม่มีสินค้าในตะกร้า
  if (!items || items.length === 0) {
    return <div className="cart-empty">Cart is empty</div>; // ตะกร้าว่าง
  }

  // คำนวณราคารวม
  const total = items.reduce((sum, item) => sum + (item.price * item.qty), 0);
  // คำนวณเวลารวมที่ใช้ในการเตรียม (สมมติ field ชื่อ duration ในแต่ละ item)
  const totalDuration = items.reduce((sum, item) => sum + ((item.duration || 0) * item.qty), 0);

  return (
    <div className="cart-container">
      <h2>Shopping Cart</h2> {/* หัวข้อ */}
      <ul>
        {items.map((item, idx) => (
          <li key={idx}>
            {item.name} x {item.qty} = {item.price * item.qty} ฿
            <button onClick={() => onUpdateQty(idx, item.qty - 1)} style={{ marginLeft: 8 }}>-</button>
            <button onClick={() => onUpdateQty(idx, item.qty + 1)} style={{ marginLeft: 4 }}>+</button>
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
        onClick={() => onConfirmOrder && onConfirmOrder(items)}
      >
        ยืนยัน Order
      </button>
    </div>
  );
}

export default Cart;
