// main.js - ฟังก์ชันกลางและเชื่อมต่อฐานข้อมูล
import pkg from 'pg';
import dotenv from 'dotenv';
dotenv.config();
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

export default pool;
