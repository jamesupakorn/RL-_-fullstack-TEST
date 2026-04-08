import React, { useEffect, useMemo, useState } from 'react';

function MenuIngredients({ selectedMenu, ingredients, addonOptions = [], menuDuration, ingredientLoading, ingredientError, onAddToCart, canAddToCart }) {
  const [selectedAddons, setSelectedAddons] = useState([]);

  useEffect(() => {
    setSelectedAddons([]);
  }, [selectedMenu?.menu_id, selectedMenu?.subtype_id]);

  const addonDuration = useMemo(() => selectedAddons.reduce((sum, addon) => sum + (Number(addon.duration) || 0), 0), [selectedAddons]);
  const addonPrice = useMemo(() => selectedAddons.reduce((sum, addon) => sum + (Number(addon.price) || 0), 0), [selectedAddons]);
  const finalDuration = (Number(menuDuration) || 0) + addonDuration;
  const basePrice = Number(selectedMenu?.price) || 0;
  const finalPrice = basePrice + addonPrice;

  const toggleAddon = (addon) => {
    setSelectedAddons((prev) => {
      const exists = prev.some((item) => item.ingredient_id === addon.ingredient_id);
      if (exists) return prev.filter((item) => item.ingredient_id !== addon.ingredient_id);
      return [...prev, addon];
    });
  };

  if (!selectedMenu) return null;
  return (
    <div style={{ marginTop: 32 }}>
      <h2>Ingredients for {selectedMenu.menu_name_th || selectedMenu.menu_name_en}</h2>
      {ingredientLoading && (
        <div className="spinner-container">
          <div className="spinner" />
          <div>Loading ingredients...</div>
        </div>
      )}
      {ingredientError && <div style={{ color: 'red' }}>Error: {ingredientError}</div>}
      {!ingredientLoading && !ingredientError && (
        <>
          <ul>
            {ingredients.map((ing, idx) => (
              <li key={idx}>{ing.ingredient_name_th || ing.ingredient_name_en} ({ing.amount} {ing.unit_th || ing.unit_en})</li>
            ))}
          </ul>
          <div style={{ marginTop: 12 }}>
            <strong>Add-on ตามวัตถุดิบที่มี:</strong>
            {addonOptions.length === 0 ? (
              <div style={{ marginTop: 6, color: '#888' }}>ไม่มี add-on ที่พร้อมใช้งาน</div>
            ) : (
              <div style={{ marginTop: 8, display: 'grid', gap: 6 }}>
                {addonOptions.map((addon) => {
                  const checked = selectedAddons.some((item) => item.ingredient_id === addon.ingredient_id);
                  return (
                    <label key={addon.ingredient_id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <input type="checkbox" checked={checked} onChange={() => toggleAddon(addon)} />
                      <span>
                        {addon.name} (+{addon.price} ฿, +{addon.duration} วิ)
                      </span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>
          <div style={{ marginTop: 12 }}>
            <strong>Preparation time:</strong> {finalDuration} seconds
            {selectedMenu.price !== undefined && (
              <div style={{ marginTop: 8 }}>
                <strong>Price:</strong> {finalPrice} ฿ {addonPrice > 0 ? `(base ${basePrice} + add-on ${addonPrice})` : ''}
              </div>
            )}
            {!canAddToCart && (
              <div style={{ marginTop: 8, color: '#c0392b', fontWeight: 700 }}>
                วัตถุดิบไม่พอ เมนูนี้กดสั่งไม่ได้ชั่วคราว
              </div>
            )}
            <div style={{ marginTop: 16 }}>
              <button onClick={() => onAddToCart(selectedAddons)} disabled={!canAddToCart} style={!canAddToCart ? { opacity: 0.5, cursor: 'not-allowed' } : undefined}>
                Add to Cart
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default MenuIngredients;
