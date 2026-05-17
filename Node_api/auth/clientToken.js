// clientToken.js — ออก/ตรวจสอบ short-lived client token สำหรับ public API
// ใช้ HMAC-SHA256 signature ไม่ต้องพึ่ง JWT library
// Token format: base64url(JSON payload) + "." + HMAC-SHA256(base64url(payload), APP_SECRET)
import crypto from 'crypto';

/** อ่าน APP_SECRET จาก env (ต้องตั้งค่าใน Vercel dashboard / .env) */
const APP_SECRET = process.env.APP_SECRET;

if (!APP_SECRET) {
  console.warn('[clientToken] APP_SECRET not set — public API will not be protected');
}

const TOKEN_TTL_MS = 4 * 60 * 60 * 1000; // 4 ชั่วโมง

/** แปลง Buffer/string เป็น base64url (URL-safe base64) */
const toBase64Url = (input) =>
  Buffer.from(input).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');

/** คำนวณ HMAC-SHA256 */
const sign = (data, secret) =>
  crypto.createHmac('sha256', secret).update(data).digest('hex');

/**
 * ออก token ใหม่ อายุ TOKEN_TTL_MS
 * @returns {string} token string
 */
export function issueClientToken() {
  if (!APP_SECRET) return 'dev-mode-no-secret';
  const now = Date.now();
  const payload = toBase64Url(JSON.stringify({ iat: now, exp: now + TOKEN_TTL_MS }));
  const sig = sign(payload, APP_SECRET);
  return `${payload}.${sig}`;
}

/**
 * ตรวจสอบว่า token ถูกต้องและยังไม่หมดอายุ
 * @param {string} token
 * @returns {boolean}
 */
export function verifyClientToken(token) {
  // ถ้าไม่มี APP_SECRET ข้าม validation เพื่อไม่ block development
  if (!APP_SECRET) return true;
  if (!token || typeof token !== 'string') return false;

  const parts = token.split('.');
  if (parts.length !== 2) return false;

  const [payload, receivedSig] = parts;

  // ตรวจ signature ด้วย timing-safe compare
  const expectedSig = sign(payload, APP_SECRET);
  if (expectedSig.length !== receivedSig.length) return false;
  const sigBuffer = Buffer.from(expectedSig, 'hex');
  let receivedBuffer;
  try {
    receivedBuffer = Buffer.from(receivedSig, 'hex');
  } catch {
    return false;
  }
  if (sigBuffer.length !== receivedBuffer.length) return false;
  if (!crypto.timingSafeEqual(sigBuffer, receivedBuffer)) return false;

  // ตรวจ expiry
  try {
    const decoded = JSON.parse(Buffer.from(payload, 'base64').toString('utf8'));
    return decoded.exp && Date.now() < decoded.exp;
  } catch {
    return false;
  }
}

/**
 * Express middleware — ตรวจ header x-client-token ทุก public request
 */
export function requireClientToken(req, res, next) {
  const token = req.headers['x-client-token'];
  if (!verifyClientToken(token)) {
    return res.status(401).json({ error: 'Unauthorized: missing or invalid client token' });
  }
  return next();
}
