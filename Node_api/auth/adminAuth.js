import crypto from 'crypto';

const ADMIN_KEY_HASH = process.env.ADMIN_KEY_HASH || '';
const LEGACY_ADMIN_KEY = process.env.ADMIN_KEY || '';
const HEX_64 = /^[a-f0-9]{64}$/i;
const DEFAULT_ADMIN_KEY_HASH = '8cc418c4e4512014dbd2ea6a17feb5b0591c80ae95edb7ebef31ecacce00619e'; // System@min

const sha256Hex = (value) => crypto.createHash('sha256').update(String(value), 'utf8').digest('hex');

const timingSafeHexEqual = (leftHex, rightHex) => {
  if (!leftHex || !rightHex) return false;
  if (leftHex.length !== rightHex.length) return false;
  const left = Buffer.from(leftHex, 'hex');
  const right = Buffer.from(rightHex, 'hex');
  if (left.length !== right.length) return false;
  return crypto.timingSafeEqual(left, right);
};

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

export const requireAdmin = (req, res, next) => {
  const token = req.headers['x-admin-key'];
  if (!isAdminKeyValid(token)) {
    return res.status(401).json({ error: 'Unauthorized: admin only' });
  }
  return next();
};
