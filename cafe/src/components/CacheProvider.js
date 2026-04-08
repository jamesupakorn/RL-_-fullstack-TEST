import React, { createContext, useRef } from 'react';

export const CacheContext = createContext();

export function CacheProvider({ children }) {
  // ใช้ useRef เพื่อเก็บ cache แบบ in-memory
  const cacheRef = useRef({
    menus: null,
    menuIngredients: {},
    menuIngredientsByNameSubtype: {},
    menuSubtypes: null,
    ingredients: null,
  });

  // เคลียร์ cache ทุกครั้งที่ mount (refresh)
  React.useEffect(() => {
    cacheRef.current = {
      menus: null,
      menuIngredients: {},
      menuIngredientsByNameSubtype: {},
      menuSubtypes: null,
      ingredients: null,
    };
  }, []);

  return (
    <CacheContext.Provider value={cacheRef.current}>
      {children}
    </CacheContext.Provider>
  );
}
