/*
  แอปนี้เป็นตัวอย่างระบบเมนูร้านกาแฟ (Cafe Menu App)
  - ดึงข้อมูลเมนูจาก backend API โดยใช้ฟังก์ชัน getMenus()
  - แสดงผลเมนูแต่ละรายการเป็นปุ่ม
  - มีการจัดการสถานะโหลดและ error
  - สามารถขยายเพิ่มการเรียก API อื่น ๆ ได้ง่าย
*/
import React, { useEffect, useState } from 'react';
import { useApiCache, deductStockByMenu } from './api';
import { buildOrderMenus, addToCart, removeFromCart, updateCartQty, getCartTotal, getCartTotalDuration } from './orderUtils';
import Cart from './Cart';
import MenuIngredients from './MenuIngredients';
import OrderCountdown from './OrderCountdown';
import SubtypeButtons from './SubtypeButtons';
import '../styles/Main.css';

function MainMenu() {
  const { getMenus, getMenuIngredients, getMenuIngredientsByNameSubtype, getMenuSubtypes } = useApiCache();
  // import deductStockByMenu
  const [menus, setMenus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // state สำหรับเมนูหลักที่เลือก
  const [selectedMenuName, setSelectedMenuName] = useState(null);
  const [selectedSubtypes, setSelectedSubtypes] = useState(null);
  const [selectedSubtype, setSelectedSubtype] = useState(null);
  const [selectedMenuObj, setSelectedMenuObj] = useState(null); // เก็บ menuObj ที่ตรงกับ subtype ที่เลือก
  const [ingredients, setIngredients] = useState([]);
  const [menuDuration, setMenuDuration] = useState(null);
  const [ingredientLoading, setIngredientLoading] = useState(false);
  const [ingredientError, setIngredientError] = useState(null);

  // ตะกร้า
  const [cartItems, setCartItems] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [showCountdown, setShowCountdown] = useState(false);

  // subtype ทั้งหมด
  const [allSubtypes, setAllSubtypes] = useState([]);

  useEffect(() => {
    setLoading(true);
    getMenus()
      .then((data) => setMenus(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
    getMenuSubtypes()
      .then(data => setAllSubtypes(data));
  }, []);

  // เมื่อคลิกเมนูหลัก
  const handleMenuClick = (menu) => {
    setSelectedMenuName(menu.menu_name);
    setSelectedSubtypes(menu.menu_subtype);
    setSelectedSubtype(null); // ยังไม่เลือก subtype
    setSelectedMenuObj(null);
    setIngredients([]);
    setMenuDuration(null);
    setIngredientError(null);
    setIngredientLoading(false);
  };

  // เมื่อคลิก subtype
    const handleSubtypeClick = async (subtype) => {
      const subtypeId = subtype.subtype_id || subtype;
      console.log('handleSubtypeClick called:', { selectedMenuName, subtypeId });
      setSelectedSubtype(subtypeId);
      setIngredientLoading(true);
      setIngredientError(null);
      setIngredients([]);
      setMenuDuration(null);
      // เรียก API ใหม่ getMenuIngredientsByNameSubtype
      try {
        const data = await getMenuIngredientsByNameSubtype(selectedMenuName, subtypeId);
        console.log('API response:', data); // log ทั้ง object
        setIngredients(data.ingredients || []);
        setMenuDuration(data.duration || null);
        setSelectedMenuObj({ menu_name: selectedMenuName, subtype_id: subtypeId, price: data.price });
        console.log('ingredients:', data.ingredients, 'price:', data.price);
      } catch (err) {
        setIngredientError(err.message);
        console.log('handleSubtypeClick error:', err);
      } finally {
        setIngredientLoading(false);
      }
    };

  // เพิ่มสินค้าลงตะกร้า
  const handleAddToCart = () => {
    if (!selectedMenuObj || !selectedMenuObj.menu_name || !selectedMenuObj.subtype_id) {
      console.log('Add to cart failed: selectedMenuObj incomplete', selectedMenuObj);
      return;
    }
    // หา menuObj จาก menus โดยใช้ menu_name และ menu_subtype (menu_id จริงจาก db)
    const menuObj = menus.find(m => {
      if (m.menu_name !== selectedMenuObj.menu_name) return false;
      if (Array.isArray(m.menu_subtype)) {
        return m.menu_subtype.includes(selectedMenuObj.subtype_id);
      } else {
        return m.menu_subtype === selectedMenuObj.subtype_id;
      }
    });
    if (!menuObj) {
      console.log('Menu object not found for', selectedMenuObj.menu_name, selectedMenuObj.subtype_id);
      return;
    }
    const duration = menuDuration || menuObj.duration;
    setCartItems(prev => addToCart(prev, menuObj, duration));
    console.log('Add to cart:', menuObj.menu_id, selectedMenuObj.menu_name, 'price:', menuObj.price);
  };

  const handleRemoveFromCart = (idx) => {
  setCartItems(prev => removeFromCart(prev, idx));
  };

  const handleUpdateQty = (idx, qty) => {
  setCartItems(prev => updateCartQty(prev, idx, qty));
  };

  const cartCount = cartItems.reduce((sum, item) => sum + item.qty, 0);
  const cartTotal = getCartTotal(cartItems);
  const cartTotalDuration = getCartTotalDuration(cartItems);

  return (
    <div className="App">
      <h1>Cafe Menu</h1>
      <button className="cart-button" onClick={() => setShowCart(true)}>
        Cart ({cartCount})
      </button>
      {loading && (
        <div className="spinner-container">
          <div className="spinner" />
          <div>Loading data...</div>
        </div>
      )}
      {error && <div style={{ color: 'red' }}>Error: {error}</div>}
      {menus.map((menu) => (
        <button key={menu.menu_id} style={{ margin: 8 }} onClick={() => handleMenuClick(menu)}>{menu.menu_name}</button>
      ))}
      {/* ปุ่ม subtype เฉพาะที่เมนูนั้นมี */}
      {selectedMenuName && selectedSubtypes && (
        <div style={{ marginTop: 16 }}>
          <SubtypeButtons
            subtypes={allSubtypes.filter(st => selectedSubtypes.includes(st.subtype_id))}
            onSelect={handleSubtypeClick}
            selectedSubtype={selectedSubtype}
          />
        </div>
      )}
      {/* ส่วนผสมและรายละเอียดตรงกับเมนู+subtype ที่เลือก */}
      {selectedMenuObj && selectedSubtype && (
        <MenuIngredients
          selectedMenu={selectedMenuObj}
          ingredients={ingredients}
          menuDuration={menuDuration}
          ingredientLoading={ingredientLoading}
          ingredientError={ingredientError}
          onAddToCart={handleAddToCart}
        />
      )}
      {showCart && (
        <div className="cart-popup-overlay" onClick={() => setShowCart(false)}>
          <div className="cart-popup" onClick={e => e.stopPropagation()}>
            <Cart
              items={cartItems}
              onRemove={handleRemoveFromCart}
              onUpdateQty={handleUpdateQty}
              cartTotal={cartTotal}
              cartTotalDuration={cartTotalDuration}
              onConfirmOrder={() => {
                setShowCart(false);
                setShowCountdown(true);
              }}
            />
            <button className="cart-close-button" onClick={() => setShowCart(false)}>Close</button>
          </div>
        </div>
      )}
      {showCountdown && (
        <OrderCountdown
          items={cartItems}
          onFinish={async () => {
            // หัก stock หลัง countdown จบ
            try {
              const orderMenus = buildOrderMenus(cartItems);
              await deductStockByMenu(orderMenus);
            } catch (err) {
              console.error('Error deducting stock:', err);
            }
            setShowCountdown(false);
            setCartItems([]);
          }}
          onCancel={() => setShowCountdown(false)}
        />
      )}
    </div>
  );
}

export default MainMenu;
