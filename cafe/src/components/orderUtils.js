/**
 * คำนวณราคารวมของ cart
 */
export function getCartTotal(cartItems) {
  return cartItems.reduce((sum, item) => sum + (item.price * item.qty), 0);
}

/**
 * คำนวณเวลารวมของ cart
 */
export function getCartTotalDuration(cartItems) {
  return cartItems.reduce((sum, item) => sum + ((item.duration || 0) * item.qty), 0);
}

/**
 * เพิ่มสินค้าเข้า cart
 */
export function addToCart(cartItems, menuObj, duration) {
  const menu_id = menuObj.menu_id;
  const idx = cartItems.findIndex(item => item.menu_id === menu_id);
  if (idx >= 0) {
    const newCart = [...cartItems];
    newCart[idx].qty += 1;
    newCart[idx].duration = duration;
    return newCart;
  } else {
    return [...cartItems, {
      menu_id: menu_id,
      name: menuObj.menu_name,
      price: menuObj.price,
      qty: 1,
      duration: duration
    }];
  }
}

/**
 * ลบสินค้าออกจาก cart
 */
export function removeFromCart(cartItems, idx) {
  const newCart = [...cartItems];
  newCart.splice(idx, 1);
  return newCart;
}

/**
 * แก้ไขจำนวนสินค้าใน cart
 */
export function updateCartQty(cartItems, idx, qty) {
  if (qty < 1) return cartItems;
  const newCart = [...cartItems];
  newCart[idx].qty = qty;
  return newCart;
}
// orderUtils.js - รวม logic ธุรกิจสำหรับ order

/**
 * สร้าง orderMenus สำหรับ deductStockByMenu
 * - รวม cartItems
 * - คำนวณ qty หลอด/ฝา
 * @param {Array} cartItems
 * @returns {Array} orderMenus
 */
export function buildOrderMenus(cartItems) {
  const orderMenus = [...cartItems];
  let strawQty = 0;
  let lidQty = 0;
  cartItems.forEach(item => {
    if (item.straw) strawQty += item.qty;
    if (item.lid) lidQty += item.qty;
  });
  if (strawQty > 0) {
    orderMenus.push({ menu_id: 'IGD2001', name: 'Drinking Straw', qty: strawQty });
  }
  if (lidQty > 0) {
    orderMenus.push({ menu_id: 'IGD2002', name: 'Dome Lid', qty: lidQty });
  }
  return orderMenus;
}
