# Al-Wakeel Al-Shamel OMS

## Overview
Order Management System with four user roles, credit approval, inventory, and invoicing. Vue + ASP.NET Core Web API + MySQL, with CI via GitHub Actions.

**Live demo:** https://alwakeel-alshamel.vercel.app  
**My role:** Designed and built the full stack (frontend, API, database schema).

### Key features
- Role-based access control for four roles: Admin, Customer, Retail Salesperson, Warehouse Manager
- Separate admin login and role-specific dashboards
- Credit approval workflow, inventory management, and invoicing
- Continuous integration with GitHub Actions

Order Management System (OMS) implemented as:
- **Frontend**: Vue (Vite)
- **Backend**: ASP.NET Core Web API
- **Database**: MySQL (schema + seed scripts in `db/`)

## Quick start (local, no Docker)

## Demo logins (auto-seeded)

On API startup, the backend seeds a few demo users **if they do not already exist** (disable with `DemoSeed__Enabled=false`).

- **Admin**: `admin@demo.local` / `DemoPass!123` (use `/admin/login` in the UI)
- **Customer**: `customer@demo.local` / `DemoPass!123`
- **Retail Salesperson**: `sales@demo.local` / `DemoPass!123`
- **Warehouse Manager**: `warehouse@demo.local` / `DemoPass!123`

### Backend
```powershell
cd "backend/Oms.Api"
dotnet run
```

API defaults to `https://localhost:5001` / `http://localhost:5000` (see console output).

### Frontend
```powershell
cd "frontend"
npm install
npm run dev
```

Vite will print the local URL (usually `http://localhost:5173`).

## Database

This repo includes MySQL init scripts in `db/`. If you’re not using Docker yet, point them at any local MySQL instance.

## Demo phases

- **Phase 1 (~50%)**: customer cash checkout end-to-end + warehouse inventory + basic dashboards, seeded demo data.
- **Phase 2 (100%)**: credit approval flow + salesperson order management + invoicing + polish.

