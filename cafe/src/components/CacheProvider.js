import { createContext, useRef } from 'react';

export const CacheContext = createContext();

export function CacheProvider({ children }) {
  const cacheRef = useRef({
    menus: null,
    menuIngredients: {},
    menuIngredientsByNameSubtype: {},
    menuSubtypes: null,
    ingredients: null,
  });

  return (
    <CacheContext.Provider value={cacheRef.current}>
      {children}
    </CacheContext.Provider>
  );
}
