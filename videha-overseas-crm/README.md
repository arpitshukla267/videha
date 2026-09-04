# Videha Overseas CRM

Sales CRM for Videha Overseas — **MongoDB backend** + **Vite React frontend**.

## Architecture

```text
videha-overseas-crm/
├── backend/     Express + TypeScript + Mongoose (port 5000)
└── frontend/    Vite + React SPA (port 3000, proxies /api → backend)
```

MongoDB URI and JWT secrets live **only** in `backend/.env`.

## Setup

### 1. Backend

```bash
cd backend
cp .env.example .env   # set MONGODB_URI + JWT_SECRET
npm install
npm run seed
npm run dev
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:3000

## Seed logins

| Email | Password | Role |
|-------|----------|------|
| superadmin@videhaoverseas.com | admin123 | Super Admin |
| admin@videhaoverseas.com | admin123 | Admin |
| manager@videhaoverseas.com | admin123 | Manager |
| rahul.sharma@videhaoverseas.com | sales123 | Sales |
| vikram.singh@videhaoverseas.com | ops123 | Operations |

## Departments

- Stored in MongoDB (`Department` model)
- Admins manage them under **Settings → Departments**
- Soft-deactivate when users/leads still reference a department
- Hard delete only when no dependencies exist

## Countries

Shared static list aligned with website markets (Middle East, North America, Europe, Southeast Asia, Oceania):

- `backend/src/constants/countries.ts`
- `frontend/src/constants/countries.ts`

Edit both when adding destinations.
