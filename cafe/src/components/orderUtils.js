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
export function addToCart(cartItems, menuObj, duration, finalPrice, addons = []) {
  const menu_id = menuObj.menu_id;
  const addonSignature = (addons || [])
    .map((item) => `${item.ingredient_id}:${item.amount || 1}`)
    .sort()
    .join('|');
  const idx = cartItems.findIndex(item => item.menu_id === menu_id && (item.addonSignature || '') === addonSignature);
  if (idx >= 0) {
    const newCart = [...cartItems];
    newCart[idx].qty += 1;
    newCart[idx].duration = duration;
    newCart[idx].price = finalPrice;
    newCart[idx].addons = addons;
    return newCart;
  } else {
    return [...cartItems, {
      menu_id: menu_id,
      name: menuObj.menu_name_th || menuObj.menu_name_en,
      price: finalPrice,
      qty: 1,
      duration: duration,
      addons,
      addonSignature,
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
  const addonMap = new Map();
  let strawQty = 0;
  let lidQty = 0;
  cartItems.forEach(item => {
    if (item.straw) strawQty += item.qty;
    if (item.lid) lidQty += item.qty;
    (item.addons || []).forEach((addon) => {
      const key = addon.ingredient_id;
      const amount = Number(addon.amount) || 1;
      if (!key) return;
      const prev = addonMap.get(key) || { ingredient_id: key, qty: 0, name: addon.name };
      prev.qty += amount * item.qty;
      addonMap.set(key, prev);
    });
  });
  addonMap.forEach((value) => orderMenus.push(value));
  if (strawQty > 0) {
    orderMenus.push({ menu_id: 'IGD2001', name: 'Drinking Straw', qty: strawQty });
  }
  if (lidQty > 0) {
    orderMenus.push({ menu_id: 'IGD2002', name: 'Dome Lid', qty: lidQty });
  }
  return orderMenus;
}

/**
 * แปลงวินาที -> ข้อความภาษาไทย (0 วินาที / X วินาที / X นาที / X นาที Y วินาที)
 */
export function formatDuration(seconds) {
  const s = Number(seconds) || 0;
  const mins = Math.floor(s / 60);
  const secs = s % 60;
  if (mins === 0) return `${secs} วินาที`;
  if (secs === 0) return `${mins} นาที`;
  return `${mins} นาที ${secs} วินาที`;
}
