export const STOCK_STATUS = {
  OUT: 'out',
  LOW: 'low',
  NORMAL: 'normal',
};

export const getStockStatus = (qty, lowThreshold = 10) => {
  const safeQty = Number(qty || 0);
  if (safeQty <= 0) return STOCK_STATUS.OUT;
  if (safeQty <= lowThreshold) return STOCK_STATUS.LOW;
  return STOCK_STATUS.NORMAL;
};

export const getStockStatusLabelTh = (status) => {
  if (status === STOCK_STATUS.OUT) return 'หมด';
  if (status === STOCK_STATUS.LOW) return 'ใกล้หมด';
  return 'ปกติ';
};

export const getIngredientTypeLabelTh = (typeId) => {
  if (typeId === 'T01') return 'วัตถุดิบ';
  if (typeId === 'T02') return 'อุปกรณ์';
  return 'อื่นๆ';
};
