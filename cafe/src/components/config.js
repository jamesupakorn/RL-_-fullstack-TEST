// กำหนด URL สำหรับ backend API จาก .env (CRA ต้องใช้ prefix REACT_APP_)
// REACT_APP_API_MODE: local | production
const apiMode = (process.env.REACT_APP_API_MODE || 'local').toLowerCase();

const localUrl = process.env.REACT_APP_API_URL_LOCAL;
const productionUrl = process.env.REACT_APP_API_URL_PROD;

const selectedUrl = apiMode === 'production' ? productionUrl : localUrl;
const normalizedBaseUrl = selectedUrl.replace(/\/+$/, '');

export const URL = `${normalizedBaseUrl}/`;
