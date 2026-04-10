// adminAuth.js — ระบบตรวจสอบสิทธิ์ admin
// ใช้ SHA-256 hash เปรียบเทียบแบบ timing-safe เพื่อป้องกัน timing attack
// ไม่เก็บ plaintext key ใน source code — อ่านจาก ADMIN_KEY_HASH ใน .env
import crypto from 'crypto';

// hash ที่ถูกต้อง อ่านจาก env (แนะนำ) หรือ fallback เป็น default สำหรับ dev
const ADMIN_KEY_HASH = process.env.ADMIN_KEY_HASH || '';
// fallback plaintext สำหรับ legacy config (ไม่แนะนำใช้ใน production)
const LEGACY_ADMIN_KEY = process.env.ADMIN_KEY || '';
const HEX_64 = /^[a-f0-9]{64}$/i;
const DEFAULT_ADMIN_KEY_HASH = '8cc418c4e4512014dbd2ea6a17feb5b0591c80ae95edb7ebef31ecacce00619e'; // System@min

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
  if (!rawKey) return false;
  const activeHash = (ADMIN_KEY_HASH || DEFAULT_ADMIN_KEY_HASH).toLowerCase();

  // Preferred mode: hash in env, no plaintext secret in code.
  if (activeHash) {
    const normalized = String(rawKey).trim().toLowerCase();

    // Client can send hash directly so plaintext key is never persisted/sent.
    if (HEX_64.test(normalized)) {
      return timingSafeHexEqual(normalized, activeHash);
    }

    return timingSafeHexEqual(sha256Hex(rawKey), activeHash);
  }

  // Backward-compatible fallback.
  if (LEGACY_ADMIN_KEY) {
    return rawKey === LEGACY_ADMIN_KEY;
  }

  return false;
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
