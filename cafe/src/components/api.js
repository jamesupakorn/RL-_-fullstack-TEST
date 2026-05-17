

import { useContext } from 'react';
import { CacheContext } from './CacheProvider';
import { URL } from './config';

// ===== CLIENT TOKEN MANAGER =====
// เก็บ token ใน memory (ไม่ persist ข้าม session เพื่อความปลอดภัย)
let _clientToken = null;
let _tokenExpiry = 0;
let _pendingTokenFetch = null; // deduplication: ป้องกัน fetch ซ้ำเมื่อ concurrent call
const TOKEN_MARGIN_MS = 5 * 60 * 1000; // รีเฟรชก่อนหมดอายุ 5 นาที

/** ดึง token จาก backend ถ้ายังไม่มีหรือหมดอายุแล้ว (exported สำหรับ component อื่น) */
export async function getClientToken() {
  if (_clientToken && Date.now() < _tokenExpiry - TOKEN_MARGIN_MS) {
    return _clientToken;
  }
  if (!_pendingTokenFetch) {
    _pendingTokenFetch = (async () => {
      const res = await fetch(URL + 'api/token', { method: 'POST' });
      if (!res.ok) throw new Error('Failed to obtain client token');
      const { token } = await res.json();
      try {
        const payload = JSON.parse(atob(token.split('.')[0].replace(/-/g, '+').replace(/_/g, '/')));
        _tokenExpiry = payload.exp || Date.now() + 4 * 60 * 60 * 1000;
      } catch {
        _tokenExpiry = Date.now() + 4 * 60 * 60 * 1000;
      }
      _clientToken = token;
      return _clientToken;
    })().finally(() => { _pendingTokenFetch = null; });
  }
  return _pendingTokenFetch;
}

/** wrapper ของ fetch ที่แนบ x-client-token ทุก request */
async function apiFetch(path, options = {}) {
  const token = await getClientToken();
  return fetch(URL + path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
      'x-client-token': token,
    },
  });
}

// เรียก API ตัด stock ingredient ตามเมนูใน order
export async function deductStockByMenu(orderMenus) {
  return apiFetch('api/ingredient/deduct-stock-by-menu', {
    method: 'POST',
    body: JSON.stringify(orderMenus)
  });
}

export function useApiCache() {
  const cache = useContext(CacheContext);

  const invalidateCache = (keys = ['all']) => {
    if (keys.includes('all')) {
      cache.menus = null;
      cache.menuIngredients = {};
      cache.menuIngredientsByNameSubtype = {};
      cache.menuSubtypes = null;
      cache.ingredients = null;
      return;
    }

    keys.forEach((key) => {
      if (key === 'menus') cache.menus = null;
      if (key === 'menuIngredients') cache.menuIngredients = {};
      if (key === 'menuIngredientsByNameSubtype') cache.menuIngredientsByNameSubtype = {};
      if (key === 'menuSubtypes') cache.menuSubtypes = null;
      if (key === 'ingredients') cache.ingredients = null;
    });
  };

  const getMenus = async (forceRefresh = false) => {
    if (!forceRefresh && cache.menus) return cache.menus;
    const response = await apiFetch('api/menu');
    if (!response.ok) throw new Error('Network response was not ok');
    const data = await response.json();
    cache.menus = data;
    return data;
  };

  const getMenuIngredients = async (menu_id, forceRefresh = false) => {
    if (!forceRefresh && cache.menuIngredients[menu_id]) return cache.menuIngredients[menu_id];
    const response = await apiFetch(`api/menu_ingredient?menu_id=${menu_id}&ingredient_type=T01`);
    if (!response.ok) throw new Error('Network response was not ok');
    const data = await response.json();
    cache.menuIngredients[menu_id] = data;
    return data;
  };

  const getMenuIngredientsByNameSubtype = async (menu_name, subtype_id, forceRefresh = false) => {
    const key = `${menu_name}_${subtype_id}`;
    if (!forceRefresh && cache.menuIngredientsByNameSubtype[key]) return cache.menuIngredientsByNameSubtype[key];
    const response = await apiFetch(
      `api/menu_ingredient_by_name_subtype?menu_name=${encodeURIComponent(menu_name)}&subtype_id=${encodeURIComponent(subtype_id)}&ingredient_type=T01`
    );
    if (!response.ok) throw new Error('Network response was not ok');
    const data = await response.json();
    cache.menuIngredientsByNameSubtype[key] = data;
    return data;
  };

  const getMenuSubtypes = async (forceRefresh = false) => {
    if (!forceRefresh && cache.menuSubtypes) return cache.menuSubtypes;
    const response = await apiFetch('api/menu_subtype');
    if (!response.ok) throw new Error('Network response was not ok');
    const data = await response.json();
    cache.menuSubtypes = data;
    return data;
  };

  const getIngredients = async (forceRefresh = false) => {
    if (!forceRefresh && cache.ingredients) return cache.ingredients;
    const response = await apiFetch('api/ingredient');
    if (!response.ok) throw new Error('Network response was not ok');
    const data = await response.json();
    cache.ingredients = data;
    return data;
  };

  return {
    getMenus,
    getMenuIngredients,
    getMenuIngredientsByNameSubtype,
    getMenuSubtypes,
    getIngredients,
    invalidateCache,
  };
}
