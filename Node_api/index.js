// index.js — entry point สำหรับ local development (node index.js / nodemon)
// Vercel serverless ใช้ api/index.js แทน ไม่ผ่านไฟล์นี้
import app from './app.js';

const port = process.env.PORT || 4000;

// เริ่ม HTTP server บน port ที่กำหนด
app.listen(port, () => {
  console.log(`Cafe Node API listening on port ${port}`);
});
