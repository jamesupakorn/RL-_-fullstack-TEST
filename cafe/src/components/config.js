// config.js — กำหนด base URL ของ backend API จาก environment variable
// สลับ mode ได้ใน .env โดยตั้ง REACT_APP_API_MODE=local | production
const apiMode = (process.env.REACT_APP_API_MODE || 'local').toLowerCase();

// อ่าน URL local/production จาก .env (ไม่ hardcode ใน source code)
const localUrl = process.env.REACT_APP_API_URL_LOCAL;
const productionUrl = process.env.REACT_APP_API_URL_PROD;

// เลือก URL ตาม mode แล้วตัด trailing slash เพื่อป้องกัน double slash ใน path
const selectedUrl = apiMode === 'production' ? productionUrl : localUrl;
const normalizedBaseUrl = selectedUrl.replace(/\/+$/, '');

/** URL base ที่ใช้สำหรับ fetch ทุก endpoint เช่น URL + 'api/menu' */
export const URL = `${normalizedBaseUrl}/`;
