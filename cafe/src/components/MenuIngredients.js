import React from 'react';

function MenuIngredients({ selectedMenu, ingredients, menuDuration, ingredientLoading, ingredientError, onAddToCart }) {
  if (!selectedMenu) return null;
  return (
    <div style={{ marginTop: 32 }}>
      <h2>Ingredients for {selectedMenu.menu_name}</h2>
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
              <li key={idx}>{ing.ingredient_name} ({ing.amount} {ing.unit})</li>
            ))}
          </ul>
          <div style={{ marginTop: 12 }}>
            <strong>Preparation time:</strong> {menuDuration} seconds
            <div style={{ marginTop: 16 }}>
              <button onClick={onAddToCart}>Add to Cart</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default MenuIngredients;
