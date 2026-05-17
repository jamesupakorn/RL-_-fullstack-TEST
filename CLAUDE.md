# CLAUDE.md

## Project Overview

- **Repo**: RL-_-fullstack-TEST
- **Frontend**: React app in `cafe/`
- **Backend**: Node/Express API in `Node_api/`
- **Deploy**: Vercel (backend) + Supabase (database/auth)
- **Branches**: `dev` (development), `prd` (production)

## Architecture

```
/
├── cafe/                        # React 19 frontend
│   └── src/
│       ├── components/          # UI components
│       │   ├── AdminPanel.js
│       │   ├── Cart.js
│       │   ├── MainMenu.js
│       │   ├── MenuIngredients.js
│       │   ├── OrderCountdown.js
│       │   ├── SubtypeButtons.js
│       │   ├── CacheProvider.js
│       │   ├── api.js           # API call helpers
│       │   ├── config.js        # Frontend config
│       │   └── orderUtils.js
│       ├── styles/
│       └── utils/
├── Node_api/                    # Node/Express backend (ESM)
│   ├── api/index.js             # API route handlers
│   ├── auth/
│   │   ├── adminAuth.js
│   │   ├── clientToken.js
│   │   └── helpers.js
│   ├── db/                      # Database layer (pg)
│   ├── tables/
│   ├── app.js
│   └── index.js
├── supabase/                    # Supabase config/migrations
└── vercel.json                  # Vercel routing config
```

## Environment Variables (Node_api/.env)

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string (Supabase pooler, ap-southeast-1) |
| `KEEPALIVE_SECRET` | Secret header สำหรับ keepalive endpoint |

> ห้าม commit `.env` — ใช้ `.env.example` แทน

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React 19, MUI v7, Axios |
| Backend | Node.js, Express 4, ESM (`"type": "module"`) |
| Database | PostgreSQL via `pg`, hosted on Supabase |
| Auth | Client token + Admin auth (custom) |
| Deploy | Vercel (backend), Supabase (DB/auth) |

## Operating Rules

- Always read current file content before editing.
- Prefer small, safe, reversible edits.
- Preserve existing APIs unless migration is explicitly required.
- Avoid destructive git commands.
- Commit with focused, clear messages.
- Keep `dev` and `prd` branch behavior consistent.

## After Every Change

- Validate CORS headers and auth headers.
- Verify Vercel routing config (`Node_api/vercel.json`) is correct.
- Keep backend and frontend changes aligned.

## Common Checks

| Check | Target |
|-------|--------|
| API token endpoint | `GET /api/token` |
| Keepalive endpoint | `GET /api/internal/keepalive` |
| Keepalive schedule | `.github/workflows/supabase-keepalive.yml` |
| CORS/routing config | `Node_api/vercel.json` |

## Supabase Keepalive Workflow

- **File**: `.github/workflows/supabase-keepalive.yml`
- **Schedule**: ทุกวัน เวลา 02:17 UTC (cron: `17 2 * * *`)
- **Trigger**: schedule หรือ `workflow_dispatch` (manual)
- **Required GitHub Secrets**:
  - `KEEPALIVE_URL` — URL ของ keepalive endpoint
  - `KEEPALIVE_SECRET` — ส่งใน header `x-keepalive-secret`
- **Behavior**: curl พร้อม retry 4 ครั้ง, timeout 25s, ถ้า HTTP status ไม่ใช่ 2xx จะ fail
- เมื่อแก้ไข workflow นี้ ให้ตรวจ secrets ทั้งสองตัวยังมีอยู่ใน GitHub repo settings

## Git Branch Sync Workflow

**กฎ:** ถ้า `dev` และ `prd` ไม่เท่ากัน — ให้ merge `prd` เข้า `dev` ก่อน แล้วค่อย merge `dev` เข้า `prd`

```bash
# Step 1: sync prd → dev
git checkout dev
git merge origin/prd
# ถ้า conflict → เลือก dev version (--ours) เสมอ เพราะ dev คือ source of truth
git push origin dev

# Step 2: sync dev → prd
git checkout prd
git merge origin/dev   # ควร fast-forward ถ้าทำ step 1 ถูกต้อง
git push origin prd
```

**Branch Protection Settings** (ตั้งแล้วใน GitHub):
- `required_linear_history`: false — อนุญาต merge commit
- `allow_force_pushes`: true — อนุญาต force push หลัง rebase

## Definition of Done

1. Requested change implemented.
2. Relevant checks pass.
3. Changes pushed to target branch(es).
4. Short summary provided to user.
