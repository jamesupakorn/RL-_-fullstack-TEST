/*
  แอปนี้เป็นตัวอย่างระบบเมนูร้านกาแฟ (Cafe Menu App)
  - ดึงข้อมูลเมนูจาก backend API โดยใช้ฟังก์ชัน getMenus()
  - แสดงผลเมนูแต่ละรายการเป็นปุ่ม
  - มีการจัดการสถานะโหลดและ error
  - สามารถขยายเพิ่มการเรียก API อื่น ๆ ได้ง่าย
*/
import React, { useCallback, useEffect, useState } from 'react';
import { useApiCache, deductStockByMenu } from './api';
import { buildOrderMenus, addToCart, removeFromCart, updateCartQty, getCartTotal, getCartTotalDuration } from './orderUtils';
import Cart from './Cart';
import MenuIngredients from './MenuIngredients';
import OrderCountdown from './OrderCountdown';
import AdminPanel from './AdminPanel';
import SubtypeButtons from './SubtypeButtons';
import { URL } from './config';
import '../styles/Main.css';

const ADMIN_TOKEN_KEY = 'adminKeyHash';
const LOW_STOCK_THRESHOLD = 10;
const sha256Hex = async (value) => {
  const data = new TextEncoder().encode(value);
  const digest = await window.crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, '0')).join('');
};

function MainMenu() {
  const { getMenus, getMenuIngredientsByNameSubtype, getMenuSubtypes, invalidateCache } = useApiCache();
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
  const [showAdmin, setShowAdmin] = useState(false);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(() => Boolean(sessionStorage.getItem(ADMIN_TOKEN_KEY)));
  const [adminAuthError, setAdminAuthError] = useState(null);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminKeyInput, setAdminKeyInput] = useState('');
  const [isAdminPasswordVisible, setIsAdminPasswordVisible] = useState(false);
  const [lowStockCount, setLowStockCount] = useState(0);
  const [menuAvailability, setMenuAvailability] = useState({});
  const [ingredientStockList, setIngredientStockList] = useState([]);

  // subtype ทั้งหมด
  const [allSubtypes, setAllSubtypes] = useState([]);

  const availabilityKey = useCallback((menuNameEn, subtypeId) => `${menuNameEn}__${subtypeId}`, []);

  const isSubtypeAvailable = useCallback((menuNameEn, subtypeId) => {
    const status = menuAvailability[availabilityKey(menuNameEn, subtypeId)];
    return status !== false;
  }, [menuAvailability, availabilityKey]);

  const isMenuAvailable = useCallback((menu) => {
    const subtypes = Array.isArray(menu.menu_subtype) ? menu.menu_subtype : [menu.menu_subtype];
    return subtypes.some((st) => isSubtypeAvailable(menu.menu_name_en, st));
  }, [isSubtypeAvailable]);

  const refreshMenuAvailability = useCallback(async (menusSource = menus, forceRefresh = false) => {
    if (!menusSource || menusSource.length === 0) {
      setMenuAvailability({});
      return;
    }

    const checks = menusSource.flatMap((menu) => {
      const subtypes = Array.isArray(menu.menu_subtype) ? menu.menu_subtype : [menu.menu_subtype];
      return subtypes.map(async (subtypeId) => {
        try {
          const data = await getMenuIngredientsByNameSubtype(menu.menu_name_en, subtypeId, forceRefresh);
          const menuIngredients = data?.ingredients || [];
          const available = menuIngredients.length === 0
            ? true
            : menuIngredients.every((ing) => Number(ing.stock_qty) >= Number(ing.amount));
          return [availabilityKey(menu.menu_name_en, subtypeId), available];
        } catch (_) {
          return [availabilityKey(menu.menu_name_en, subtypeId), true];
        }
      });
    });

    const entries = await Promise.all(checks);
    setMenuAvailability(Object.fromEntries(entries));
  }, [menus, getMenuIngredientsByNameSubtype, availabilityKey]);

  const loadLowStockCount = useCallback(async () => {
    try {
      const response = await fetch(URL + 'api/ingredient');
      if (!response.ok) return;
      const ingredientsData = await response.json();
      setIngredientStockList(ingredientsData || []);
      const lowCount = (ingredientsData || []).filter((item) => Number(item.stock_qty) <= LOW_STOCK_THRESHOLD).length;
      setLowStockCount(lowCount);
    } catch (_) {
      // ignore badge errors to avoid blocking the main UI
    }
  }, []);

  const refreshStockDrivenUI = useCallback(() => {
    invalidateCache(['ingredients', 'menuIngredients', 'menuIngredientsByNameSubtype']);
    loadLowStockCount();
    refreshMenuAvailability(menus, true);
  }, [invalidateCache, loadLowStockCount, refreshMenuAvailability, menus]);

  useEffect(() => {
    setLoading(true);
    getMenus()
      .then((data) => {
        setMenus(data);
        refreshMenuAvailability(data);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
    getMenuSubtypes()
      .then(data => setAllSubtypes(data));
    // รันครั้งเดียวตอน mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadLowStockCount();
    const timer = setInterval(loadLowStockCount, 60000);
    return () => clearInterval(timer);
  }, [loadLowStockCount]);

  // เมื่อคลิกเมนูหลัก
  const handleMenuClick = (menu) => {
    if (!isMenuAvailable(menu)) return;
    setSelectedMenuName(menu.menu_name_en);
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
        if (!isSubtypeAvailable(selectedMenuName, subtypeId)) return;
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
        setSelectedMenuObj({ menu_name_en: selectedMenuName, menu_name_th: data.menu_name_th, subtype_id: subtypeId, price: data.price });
        console.log('ingredients:', data.ingredients, 'price:', data.price);
      } catch (err) {
        setIngredientError(err.message);
        console.log('handleSubtypeClick error:', err);
      } finally {
        setIngredientLoading(false);
      }
    };

  const resetMenuSelection = () => {
    setSelectedMenuName(null);
    setSelectedSubtypes(null);
    setSelectedSubtype(null);
    setSelectedMenuObj(null);
    setIngredients([]);
    setMenuDuration(null);
    setIngredientError(null);
    setIngredientLoading(false);
  };

  // เพิ่มสินค้าลงตะกร้า
  const handleAddToCart = (selectedAddons = []) => {
    if (!isSubtypeAvailable(selectedMenuName, selectedSubtype)) return;
    if (!selectedMenuObj || !selectedMenuObj.menu_name_en || !selectedMenuObj.subtype_id) {
      console.log('Add to cart failed: selectedMenuObj incomplete', selectedMenuObj);
      return;
    }
    // หา menuObj จาก menus โดยใช้ menu_name และ menu_subtype (menu_id จริงจาก db)
    const menuObj = menus.find(m => {
      if (m.menu_name_en !== selectedMenuObj.menu_name_en) return false;
      if (Array.isArray(m.menu_subtype)) {
        return m.menu_subtype.includes(selectedMenuObj.subtype_id);
      } else {
        return m.menu_subtype === selectedMenuObj.subtype_id;
      }
    });
    if (!menuObj) {
      console.log('Menu object not found for', selectedMenuObj.menu_name_en, selectedMenuObj.subtype_id);
      return;
    }
    const extraDuration = selectedAddons.reduce((sum, addon) => sum + (Number(addon.duration) || 0) * (Number(addon.amount) || 1), 0);
    const extraPrice = selectedAddons.reduce((sum, addon) => sum + (Number(addon.price) || 0) * (Number(addon.amount) || 1), 0);
    const duration = (menuDuration || menuObj.duration || 0) + extraDuration;
    const finalPrice = (Number(menuObj.price) || 0) + extraPrice;
    setCartItems(prev => addToCart(prev, menuObj, duration, finalPrice, selectedAddons));
    resetMenuSelection();
    console.log('Add to cart:', menuObj.menu_id, selectedMenuObj.menu_name_th || selectedMenuObj.menu_name_en, 'price:', menuObj.price);
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
  const addonOptions = ingredientStockList
    .filter((item) => item.ingredient_type === 'T01' && Number(item.stock_qty) > 0)
    .map((item) => ({
      ingredient_id: item.ingredient_id,
      name: item.ingredient_name_th || item.ingredient_name_en,
      unit: item.unit_th || item.unit_en,
      stock_qty: Number(item.stock_qty) || 0,
      duration: Number(item.duration) || 0,
      price: Number(item.addon_price) || 0,
      amount: 1,
    }));

  const handleAdminClick = async () => {
    if (isAdminAuthenticated) {
      setShowAdmin(true);
      return;
    }

    setAdminAuthError(null);
    setIsAdminPasswordVisible(false);
    setShowAdminLogin(true);
  };

  const handleAdminLogin = async (e) => {
    if (e) e.preventDefault();
    const key = adminKeyInput.trim();
    if (!key) {
      setAdminAuthError('กรุณาใส่รหัส Admin');
      return;
    }

    try {
      const adminKeyHash = await sha256Hex(key);
      const response = await fetch(URL + 'api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminKeyHash }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || 'Admin login failed');
      }
      sessionStorage.setItem(ADMIN_TOKEN_KEY, adminKeyHash);
      setIsAdminAuthenticated(true);
      setAdminAuthError(null);
      setAdminKeyInput('');
      setIsAdminPasswordVisible(false);
      setShowAdminLogin(false);
      setShowAdmin(true);
    } catch (err) {
      setAdminAuthError(err.message || 'Admin login failed');
    }
  };

  return (
    <div className="App cafe-shell">
      <header className="hero">
        <img className="hero-logo" src="/toothbin.png" alt="Toothbin Beverage" />
        <div className="hero-copy">
          <p className="hero-kicker">TOOTHBIN BEVERAGE</p>
          <h1>Cafe Menu</h1>
          <p className="hero-sub">เลือกเมนูที่ต้องการ ปรับ Add-on แล้วกดใส่ตะกร้าได้ทันที</p>
        </div>
        <div className="hero-actions">
          <button className="cart-button" onClick={() => setShowCart(true)}>
            Cart ({cartCount})
          </button>
          <button className="cart-button" onClick={handleAdminClick}>
            Admin
            {lowStockCount > 0 && (
              <span className="admin-badge">
                {lowStockCount}
              </span>
            )}
          </button>
        </div>
      </header>

      <section className="menu-section">
      {loading && (
        <div className="spinner-container">
          <div className="spinner" />
          <div>Loading data...</div>
        </div>
      )}
      {error && <div className="error-text">Error: {error}</div>}

      <div className="menu-layout">
      <div className="menu-left-panel">
      <div className="section-heading">เลือกเมนูหลัก</div>
      <div className="menu-grid">
      {menus.map((menu) => (
        <button
          key={menu.menu_id}
          className={`menu-chip ${selectedMenuName === menu.menu_name_en ? 'is-active' : ''} ${isMenuAvailable(menu) ? '' : 'is-disabled'}`}
          onClick={() => handleMenuClick(menu)}
          disabled={!isMenuAvailable(menu)}
          title={!isMenuAvailable(menu) ? 'วัตถุดิบของเมนูนี้หมด/ไม่พอ' : ''}
        >
          {menu.menu_name_th || menu.menu_name_en}
        </button>
      ))}
      </div>
      {/* ปุ่ม subtype เฉพาะที่เมนูนั้นมี */}
      {selectedMenuName && selectedSubtypes && (
        <div className="subtype-wrap">
          <div className="section-subheading">เลือกระดับความเย็น/ร้อน</div>
          <SubtypeButtons
            subtypes={allSubtypes.filter(st => selectedSubtypes.includes(st.subtype_id))}
            onSelect={handleSubtypeClick}
            selectedSubtype={selectedSubtype}
            isSubtypeDisabled={(st) => !isSubtypeAvailable(selectedMenuName, st.subtype_id)}
          />
        </div>
      )}
      </div>

      <div className="menu-right-panel">
      {/* ส่วนผสมและรายละเอียดตรงกับเมนู+subtype ที่เลือก */}
      {selectedMenuObj && selectedSubtype && (
        <MenuIngredients
          selectedMenu={selectedMenuObj}
          ingredients={ingredients}
          addonOptions={addonOptions}
          menuDuration={menuDuration}
          ingredientLoading={ingredientLoading}
          ingredientError={ingredientError}
          onAddToCart={handleAddToCart}
          canAddToCart={selectedSubtype ? isSubtypeAvailable(selectedMenuName, selectedSubtype) : true}
        />
      )}

      {!selectedMenuObj && (
        <div className="menu-placeholder">
          <h3>พร้อมเสิร์ฟ</h3>
          <p>เลือกเมนูและประเภทด้านซ้าย เพื่อดูส่วนผสมและ Add-on ทางด้านนี้</p>
        </div>
      )}
      </div>
      </div>
      </section>
      {showCart && (
        <div className="cart-popup-overlay" onClick={() => setShowCart(false)}>
          <div className="cart-popup cart-popup--cart" onClick={e => e.stopPropagation()}>
            <Cart
              items={cartItems}
              onRemove={handleRemoveFromCart}
              onUpdateQty={handleUpdateQty}
              cartTotal={cartTotal}
              cartTotalDuration={cartTotalDuration}
              onClose={() => setShowCart(false)}
              onConfirmOrder={() => {
                setShowCart(false);
                setShowCountdown(true);
              }}
            />
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
              refreshStockDrivenUI();
            } catch (err) {
              console.error('Error deducting stock:', err);
            }
            setShowCountdown(false);
            setCartItems([]);
          }}
          onCancel={() => setShowCountdown(false)}
        />
      )}
      {showAdmin && (
        <AdminPanel
          onClose={() => setShowAdmin(false)}
          onDataChange={refreshStockDrivenUI}
          onLogout={() => {
            sessionStorage.removeItem(ADMIN_TOKEN_KEY);
            setIsAdminAuthenticated(false);
            setShowAdmin(false);
            refreshStockDrivenUI();
          }}
        />
      )}
      {showAdminLogin && (
        <div className="cart-popup-overlay" onClick={() => { setShowAdminLogin(false); setAdminAuthError(null); setIsAdminPasswordVisible(false); }}>
          <form className="cart-popup" onSubmit={handleAdminLogin} onClick={e => e.stopPropagation()}>
            <h3>เข้าสู่ระบบแอดมิน</h3>
            <div className="admin-login-field">
              <input
                type={isAdminPasswordVisible ? 'text' : 'password'}
                value={adminKeyInput}
                onChange={(e) => setAdminKeyInput(e.target.value)}
                placeholder="กรอกรหัส Admin"
                className="admin-login-input"
              />
              <button
                type="button"
                className="admin-login-toggle"
                onClick={() => setIsAdminPasswordVisible((prev) => !prev)}
                aria-label={isAdminPasswordVisible ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
                title={isAdminPasswordVisible ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
              >
                {isAdminPasswordVisible ? (
                  <svg viewBox="0 0 24 24" aria-hidden="true" className="admin-login-eye-icon">
                    <path d="M3 4l18 16" />
                    <path d="M10.6 10.7A3 3 0 0012 15a3 3 0 002.2-.96" />
                    <path d="M9.5 5.6A10.4 10.4 0 0112 5c6 0 9.7 7 9.7 7a16 16 0 01-4.1 4.7" />
                    <path d="M6.2 8.3A16 16 0 002.3 12s3.7 7 9.7 7a10.4 10.4 0 004.1-.8" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" aria-hidden="true" className="admin-login-eye-icon">
                    <path d="M2.3 12s3.7-7 9.7-7 9.7 7 9.7 7-3.7 7-9.7 7-9.7-7-9.7-7z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
            {adminAuthError && <div className="admin-login-error">{adminAuthError}</div>}
            <div className="admin-login-actions">
              <button type="submit" className="cart-close-button">เข้าสู่ระบบ</button>
              <button type="button" className="cart-close-button" onClick={() => { setShowAdminLogin(false); setAdminAuthError(null); setIsAdminPasswordVisible(false); }}>ยกเลิก</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default MainMenu;
