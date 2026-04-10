// main.js — สร้างและ export PostgreSQL connection pool
// รองรับทั้ง local dev และ Vercel serverless (จำกัด max connection เป็น 1)
// Reuse pool ข้าม invocation ด้วย globalThis เพื่อลด cold reconnect ใน lambda
import pkg from 'pg';
import dotenv from 'dotenv';
dotenv.config();
const { Pool } = pkg;

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('[db] DATABASE_URL is not configured');
}

const shouldUseSsl = /supabase\.com/i.test(connectionString || '') || process.env.PGSSLMODE === 'require';

const poolConfig = {
  connectionString,
  // ลดจำนวน connection ต่อ lambda เพื่อลดโอกาสชน pool ใน serverless
  max: process.env.VERCEL ? 1 : 5,
  idleTimeoutMillis: 10000,
  connectionTimeoutMillis: 10000,
  ssl: shouldUseSsl ? { rejectUnauthorized: false } : false,
};

// Reuse pool ข้าม invocation ใน runtime เดิม (ช่วยลด cold reconnect)
const globalPg = globalThis;
const pool = globalPg.__toothbinPool || new Pool(poolConfig);
globalPg.__toothbinPool = pool;

pool.on('error', (err) => {
  console.error('[db] Unexpected pooled client error:', err);
});

export default pool;
