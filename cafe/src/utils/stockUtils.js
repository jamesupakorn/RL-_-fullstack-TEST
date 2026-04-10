// stockUtils.js — helper ร่วมสำหรับสถานะสต็อกและ label ภาษาไทย
// ใช้ร่วมกันระหว่าง AdminPanel.js และ StockCheck (ถ้ามีในอนาคต)

/** enum-like: ค่าคงที่แทนสถานะสต็อก เพื่อป้องกัน typo เมื่อเปรียบเทียบ */
export const STOCK_STATUS = {
  OUT: 'out',
  LOW: 'low',
  NORMAL: 'normal',
};

/**
 * แปลงปริมาณสต็อก -> สถานะ (out / low / normal)
 * @param {number|string} qty           - ปริมาณสต็อกปัจจุบัน
 * @param {number}        lowThreshold  - เกณฑ์ที่ถือว่า "ใกล้หมด" (default 10)
 * @returns {string} STOCK_STATUS value
 */
export const getStockStatus = (qty, lowThreshold = 10) => {
  const safeQty = Number(qty || 0);
  if (safeQty <= 0) return STOCK_STATUS.OUT;
  if (safeQty <= lowThreshold) return STOCK_STATUS.LOW;
  return STOCK_STATUS.NORMAL;
};

/**
 * แปลงสถานะสต็อก -> label ภาษาไทย สำหรับแสดงผลใน UI
 * @param {string} status - ค่าจาก STOCK_STATUS
 * @returns {string} 'หมด' | 'ใกล้หมด' | 'ปกติ'
 */
export const getStockStatusLabelTh = (status) => {
  if (status === STOCK_STATUS.OUT) return 'หมด';
  if (status === STOCK_STATUS.LOW) return 'ใกล้หมด';
  return 'ปกติ';
};

/**
 * แปลง ingredient type ID -> ชื่อภาษาไทย
 * T01 = วัตถุดิบ (เช่น กาแฟ, น้ำนม), T02 = อุปกรณ์ (เช่น หลอด, ฝา)
 * @param {string} typeId
 * @returns {string}
 */
export const getIngredientTypeLabelTh = (typeId) => {
  if (typeId === 'T01') return 'วัตถุดิบ';
  if (typeId === 'T02') return 'อุปกรณ์';
  return 'อื่นๆ';
};
