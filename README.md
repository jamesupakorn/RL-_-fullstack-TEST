# RL-_-fullstack-TEST

โปรเจกต์ทดสอบระบบร้านกาแฟแบบ full-stack แยกเป็น 2 ส่วนหลัก:

- `cafe/` เป็น frontend ด้วย React
- `Node_api/` เป็น backend API ด้วย Express + PostgreSQL

ตัวระบบรองรับการแสดงเมนู, ตะกร้า, หลังบ้านสำหรับจัดการเมนู/วัตถุดิบ และตัด stock ตามออเดอร์

## Tech Stack

- Frontend: React, CRA, Axios, MUI
- Backend: Node.js, Express, PostgreSQL (`pg`)
- Deployment:
	- Frontend ใช้งานผ่าน Vercel
	- Backend มีทั้ง local server และ Vercel serverless entry

## Project Structure

```text
RL-_-fullstack-TEST/
├── cafe/                 # React frontend
├── Node_api/             # Express API + database access
├── Toothbin.sql          # SQL schema / seed ที่เกี่ยวข้อง
└── README.md
```

## Main Folders

### Frontend: `cafe/`

- `src/components/` คอมโพเนนต์หลักของหน้า user และ admin
- `src/styles/` ไฟล์ CSS แยกตามหน้าหรือ component
- `src/utils/` utility function ที่ใช้ซ้ำ

### Backend: `Node_api/`

- `app.js` รวม route หลักของระบบ
- `index.js` entry point สำหรับรัน local
- `api/` entry สำหรับ deploy แบบ serverless
- `tables/` ฟังก์ชัน/route ที่เกี่ยวกับตารางในฐานข้อมูล
- `auth/` middleware ตรวจ admin
- `db/` helper function ที่ใช้ซ้ำใน backend

## Prerequisites

ก่อนเริ่มใช้งานควรมี:

- Node.js 20+ หรือใหม่กว่า
- npm
- PostgreSQL หรือ Supabase database ที่ใช้งานได้

## Environment Variables

### Frontend: `cafe/.env`

ตัวอย่างค่าที่ใช้:

```dotenv
PORT=3000
REACT_APP_API_MODE=local
REACT_APP_API_URL_LOCAL=http://localhost:4000
REACT_APP_API_URL_PROD=https://tooth-node-api.vercel.app
```

คำอธิบาย:

- `REACT_APP_API_MODE=local` ให้ frontend เรียก local backend
- `REACT_APP_API_MODE=production` ให้ frontend เรียก production backend
- `REACT_APP_API_URL_LOCAL` URL ของ backend ตอนพัฒนาในเครื่อง
- `REACT_APP_API_URL_PROD` URL ของ backend production

### Backend: `Node_api/.env`

ต้องมีอย่างน้อย:

```dotenv
DATABASE_URL=your_database_connection_string
ADMIN_KEY_HASH=your_sha256_hash
PORT=4000
```

หมายเหตุ:

- ไม่ควร commit secret จริงลง repo
- `ADMIN_KEY_HASH` ควรเป็นค่า SHA-256 ของรหัส admin

## Installation

ติดตั้ง dependencies แยกทั้ง 2 ฝั่ง:

```bash
cd cafe
npm install

cd ../Node_api
npm install
```

## Run Locally

เปิด 2 terminal แล้วรันแยกกัน

### 1. Start backend

```bash
cd Node_api
npm run dev
```

backend local จะรันที่:

```text
http://localhost:4000
```

### 2. Start frontend

```bash
cd cafe
npm start
```

frontend local จะรันที่:

```text
http://localhost:3000
```

## Available Scripts

### Frontend

```bash
cd cafe
npm start
npm run build
npm test
```

### Backend

```bash
cd Node_api
npm run dev
npm start
```

## API Overview

ตัวอย่าง route หลักใน backend:

- `POST /api/admin/login` ตรวจ admin key
- `GET /api/menu` ดึงเมนูสำหรับหน้าใช้งานจริง
- `GET /api/menu_ingredient` ดึงวัตถุดิบของเมนู
- `GET /api/menu_subtype` ดึง subtype เช่น hot / iced / frappe
- `GET /api/menu_type` ดึงประเภทเมนูหลักสำหรับหลังบ้าน
- `POST /api/menu` เพิ่มเมนู
- `PUT /api/menu/:id` แก้ไขเมนู
- `DELETE /api/menu/:id` ลบเมนู
- `GET /api/ingredient` ดึงรายการวัตถุดิบ
- `POST /api/ingredient/deduct-stock-by-menu` ตัด stock หลังยืนยันออเดอร์

## Branch Workflow

ปัจจุบัน branch หลักที่ใช้งานคือ:

- `dev` สำหรับงานพัฒนา
- `prd` สำหรับงาน production / deploy

แนวทางใช้งานที่แนะนำ:

1. แตกงานจาก `dev`
2. พัฒนาและทดสอบใน branch งานของตัวเอง
3. merge กลับ `dev`
4. เมื่อพร้อมปล่อยจริง ค่อย merge หรือ promote ไป `prd`

## Notes

- backend local ใช้ `Node_api/index.js`
- backend serverless ใช้ `Node_api/api/`
- ถ้า frontend จะเรียก backend local ให้ตั้ง `REACT_APP_API_MODE=local`
- ถ้าเจอปัญหา CORS หรือเรียก API ไม่ได้ ให้ตรวจ `.env` ของทั้งสองฝั่งก่อน
