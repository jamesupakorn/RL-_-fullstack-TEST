// adminAuth.js — ระบบตรวจสอบสิทธิ์ admin
// ใช้ SHA-256 hash เปรียบเทียบแบบ timing-safe เพื่อป้องกัน timing attack
// ไม่เก็บ plaintext key ใน source code — อ่านจาก ADMIN_KEY_HASH ใน .env
import crypto from 'crypto';

const ADMIN_KEY_HASH = process.env.ADMIN_KEY_HASH || '';
const HEX_64 = /^[a-f0-9]{64}$/i;

if (!ADMIN_KEY_HASH) {
  console.error('[adminAuth] ADMIN_KEY_HASH not set — admin routes are disabled');
}

/** คำนวณ SHA-256 ของ string -> hex string */
const sha256Hex = (value) => crypto.createHash('sha256').update(String(value), 'utf8').digest('hex');

/**
 * เปรียบเทียบ hex string สองค่าแบบ constant-time
 * ป้องกัน timing attack ที่ใช้เวลาตอบกลับ short-circuit วัดความยาว match
 */
const timingSafeHexEqual = (leftHex, rightHex) => {
  if (!leftHex || !rightHex) return false;
  if (leftHex.length !== rightHex.length) return false;
  const left = Buffer.from(leftHex, 'hex');
  const right = Buffer.from(rightHex, 'hex');
  if (left.length !== right.length) return false;
  return crypto.timingSafeEqual(left, right);
};

/**
 * ตรวจสอบว่า rawKey ที่ส่งมาเป็น admin key ที่ถูกต้องหรือไม่
 * รองรับ 2 รูปแบบ:
 *   1. ส่ง SHA-256 hex ตรงมาจาก client (แนะนำ — ไม่ต้องส่ง plaintext)
 *   2. ส่ง plaintext key มา แล้ว hash ฝั่ง server ก่อนเปรียบเทียบ
 */
export const isAdminKeyValid = (rawKey) => {
  if (!rawKey || !ADMIN_KEY_HASH) return false;
  const activeHash = ADMIN_KEY_HASH.toLowerCase();
  const normalized = String(rawKey).trim().toLowerCase();
  if (HEX_64.test(normalized)) {
    return timingSafeHexEqual(normalized, activeHash);
  }
  return timingSafeHexEqual(sha256Hex(rawKey), activeHash);
};

/**
 * Express middleware — ตรวจ header x-admin-key ทุก request ที่ต้องการสิทธิ์ admin
 * ใช้ใน route ที่เป็น admin-only เช่น POST/PUT/DELETE menu, ingredient
 */
export const requireAdmin = (req, res, next) => {
  const token = req.headers['x-admin-key'];
  if (!isAdminKeyValid(token)) {
    return res.status(401).json({ error: 'Unauthorized: admin only' });
  }
  return next();
};
