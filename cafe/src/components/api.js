

import { useContext } from 'react';
import { CacheContext } from './CacheProvider';
import { URL } from './config';
// เรียก API ตัด stock ingredient ตามเมนูใน order
export async function deductStockByMenu(orderMenus) {
  return fetch(URL + 'api/ingredient/deduct-stock-by-menu', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(orderMenus)
  });
}

export function useApiCache() {
  const cache = useContext(CacheContext);

  const getMenus = async () => {
    if (cache.menus) return cache.menus;
    const response = await fetch(URL + 'api/menu');
    if (!response.ok) throw new Error('Network response was not ok');
    const data = await response.json();
    cache.menus = data;
    return data;
  };

  const getMenuIngredients = async (menu_id) => {
    if (cache.menuIngredients[menu_id]) return cache.menuIngredients[menu_id];
    const response = await fetch(`${URL}api/menu_ingredient?menu_id=${menu_id}&ingredient_type=T01`);
    if (!response.ok) throw new Error('Network response was not ok');
    const data = await response.json();
    cache.menuIngredients[menu_id] = data;
    return data;
  };

  const getMenuIngredientsByNameSubtype = async (menu_name, subtype_id) => {
    const key = `${menu_name}_${subtype_id}`;
    if (cache.menuIngredientsByNameSubtype[key]) return cache.menuIngredientsByNameSubtype[key];
    const response = await fetch(
      URL+`api/menu_ingredient_by_name_subtype?menu_name=${encodeURIComponent(menu_name)}&subtype_id=${encodeURIComponent(subtype_id)}&ingredient_type=T01`
    );
    if (!response.ok) throw new Error('Network response was not ok');
    const data = await response.json();
    cache.menuIngredientsByNameSubtype[key] = data;
    return data;
  };  
  
  const getMenuSubtypes = async () => {
    if (cache.menuSubtypes) return cache.menuSubtypes;
    const response = await fetch(URL + 'api/menu_subtype');
    if (!response.ok) throw new Error('Network response was not ok');
    const data = await response.json();
    cache.menuSubtypes = data;
    return data;
  };

  return { getMenus, getMenuIngredients, getMenuIngredientsByNameSubtype, getMenuSubtypes };
}