/*
  แอปนี้เป็นตัวอย่างระบบเมนูร้านกาแฟ (Cafe Menu App)
  - ดึงข้อมูลเมนูจาก backend API โดยใช้ฟังก์ชัน getMenus()
  - แสดงผลเมนูแต่ละรายการเป็นปุ่ม
  - มีการจัดการสถานะโหลดและ error
  - สามารถขยายเพิ่มการเรียก API อื่น ๆ ได้ง่าย
*/
import React, { useEffect, useState } from 'react'; // นำเข้า React และ hook ที่จำเป็น
import { getMenus, getMenuIngredients } from './api'; // นำเข้าฟังก์ชันสำหรับเรียก API
import Cart from './Cart'; // นำเข้า Cart component จาก components
import MenuIngredients from './MenuIngredients'; // นำเข้า MenuIngredients component
import OrderCountdown from './OrderCountdown'; // นำเข้า OrderCountdown popup
import '../styles/Main.css'; // นำเข้าไฟล์ CSS สำหรับตกแต่ง component


function MainMenu() {
  const [menus, setMenus] = useState([]); // state สำหรับเก็บข้อมูลเมนู
  const [loading, setLoading] = useState(true); // state สำหรับสถานะโหลด
  const [error, setError] = useState(null); // state สำหรับ error

  // state สำหรับเก็บข้อมูลวัตถุดิบและระยะเวลาของเมนูที่เลือก
  const [selectedMenu, setSelectedMenu] = useState(null); // เก็บเมนูที่เลือก
  const [ingredients, setIngredients] = useState([]); // เก็บวัตถุดิบ
  const [menuDuration, setMenuDuration] = useState(null); // เก็บระยะเวลาการจัดเตรียม
  const [ingredientLoading, setIngredientLoading] = useState(false); // สถานะโหลดวัตถุดิบ
  const [ingredientError, setIngredientError] = useState(null); // error วัตถุดิบ

  // state สำหรับตะกร้าสินค้า
  const [cartItems, setCartItems] = useState([]); // เก็บรายการสินค้าในตะกร้า
  const [showCart, setShowCart] = useState(false); // state สำหรับแสดง/ซ่อน popup cart
  const [showCountdown, setShowCountdown] = useState(false); // state สำหรับแสดง popup countdown

  useEffect(() => {
    // เมื่อ component โหลดครั้งแรก ให้เรียก getMenus() เพื่อดึงข้อมูลเมนูจาก backend
    setLoading(true);
    getMenus()
      .then((data) => setMenus(data)) // ถ้าสำเร็จ เก็บข้อมูลเมนูใน state
      .catch((err) => setError(err.message)) // ถ้า error เก็บข้อความ error
      .finally(() => setLoading(false)); // เมื่อเสร็จสิ้นทุกกรณี ปิดสถานะโหลด
  }, []);

  // ฟังก์ชันเมื่อคลิกปุ่มเมนู
  const handleMenuClick = async (menu) => {
    setSelectedMenu(menu);
    setIngredientLoading(true);
    setIngredientError(null);
    setIngredients([]);
    setMenuDuration(null);
    try {
      const data = await getMenuIngredients(menu.menu_id);
      setIngredients(data.ingredients || []); // สมมติ API ส่งกลับ { ingredients: [...], duration: ... }
      setMenuDuration(data.duration || menu.duration); // ถ้า API ส่ง duration ให้ใช้ ถ้าไม่มีก็ใช้จาก menu
    } catch (err) {
      setIngredientError(err.message);
    } finally {
      setIngredientLoading(false);
    }
  };

  // ฟังก์ชันสำหรับเพิ่มสินค้าลงตะกร้า
  const handleAddToCart = () => {
    if (!selectedMenu) return;
    // ตรวจสอบว่ามีสินค้าในตะกร้าอยู่แล้วหรือยัง
    const idx = cartItems.findIndex(item => item.menu_id === selectedMenu.menu_id);
    const duration = menuDuration || selectedMenu.duration || 0;
    if (idx >= 0) {
      // ถ้ามีอยู่แล้ว เพิ่มจำนวน qty
      const newCart = [...cartItems];
      newCart[idx].qty += 1;
      // อัปเดต duration ด้วย (กรณีเปลี่ยนเมนูแล้วเวลาเปลี่ยน)
      newCart[idx].duration = duration;
      setCartItems(newCart);
    } else {
      // ถ้ายังไม่มี เพิ่มใหม่
      setCartItems([...cartItems, {
        menu_id: selectedMenu.menu_id,
        name: selectedMenu.menu_name,
        price: selectedMenu.price || 0,
        qty: 1,
        duration: duration
      }]);
    }
  };

  // ฟังก์ชันสำหรับลบสินค้าออกจากตะกร้า
  const handleRemoveFromCart = (idx) => {
    const newCart = [...cartItems];
    newCart.splice(idx, 1);
    setCartItems(newCart);
  };

  // ฟังก์ชันสำหรับแก้ไขจำนวนสินค้าในตะกร้า
  const handleUpdateQty = (idx, qty) => {
    if (qty < 1) return; // ไม่ให้จำนวนต่ำกว่า 1
    const newCart = [...cartItems];
    newCart[idx].qty = qty;
    setCartItems(newCart);
  };

  // จำนวนสินค้าทั้งหมดในตะกร้า
  const cartCount = cartItems.reduce((sum, item) => sum + item.qty, 0);

  return (
    <div className="App">
      <h1>Cafe Menu</h1> {/* เมนูร้านกาแฟ */}
      {/* ปุ่มเปิดตะกร้าสินค้า */}
      <button
        className="cart-button"
        onClick={() => setShowCart(true)}
      >
        Cart ({cartCount})
      </button>
      {/* แสดงข้อความ loading ขณะรอข้อมูล */}
      {loading && (
        // แสดง spinner (หน้าหมุน) และข้อความขณะกำลังโหลดข้อมูล
        <div className="spinner-container">
          {/* spinner ใช้ CSS animation หมุน */}
          <div className="spinner" />
          <div>Loading data...</div> {/* กำลังโหลดข้อมูล... */}
        </div>
      )}
      {/* แสดง error ถ้ามี */}
  {error && <div style={{ color: 'red' }}>Error: {error}</div>} {/* เกิดข้อผิดพลาด */}
      {/* วนลูปแสดงปุ่มสำหรับแต่ละเมนู โดยใช้ menu_id เป็น key และ menu_name เป็นข้อความบนปุ่ม */}
      {menus.map((menu) => (
        <button key={menu.menu_id} style={{ margin: 8 }} onClick={() => handleMenuClick(menu)}>{menu.menu_name}</button>
      ))}

      {/* แสดงข้อมูลวัตถุดิบและระยะเวลาของเมนูที่เลือก */}
      <MenuIngredients
        selectedMenu={selectedMenu}
        ingredients={ingredients}
        menuDuration={menuDuration}
        ingredientLoading={ingredientLoading}
        ingredientError={ingredientError}
        onAddToCart={handleAddToCart}
      />
      {/* Popup Cart */}
      {showCart && (
        <div
          className="cart-popup-overlay"
          onClick={() => setShowCart(false)}
        >
          <div
            className="cart-popup"
            onClick={e => e.stopPropagation()}
          >
            <Cart
              items={cartItems}
              onRemove={handleRemoveFromCart}
              onUpdateQty={handleUpdateQty}
              onConfirmOrder={() => {
                setShowCart(false);
                setShowCountdown(true);
              }}
            />
            <button className="cart-close-button" onClick={() => setShowCart(false)}>Close</button>
          </div>
        </div>
      )}
      {/* Popup Countdown */}
      {showCountdown && (
        <OrderCountdown
          items={cartItems}
          onFinish={() => {
            setShowCountdown(false);
            setCartItems([]);
          }}
          onCancel={() => setShowCountdown(false)}
        />
      )}
    </div>
  );
}

export default MainMenu; // ส่งออก component MainMenu เพื่อใช้ในไฟล์อื่น
