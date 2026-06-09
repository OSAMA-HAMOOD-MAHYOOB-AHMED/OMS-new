# Supabase + Render + Vercel setup guide
$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "=== OMS → Supabase + Render + Vercel ===" -ForegroundColor Cyan
Write-Host ""

Write-Host "Architecture:" -ForegroundColor White
Write-Host "  Frontend  →  Vercel"
Write-Host "  API       →  Render (free Docker web service)"
Write-Host "  Database  →  Supabase Postgres (free tier)"
Write-Host ""

Write-Host "STEP 1 — Create Supabase project (free)" -ForegroundColor Yellow
Write-Host "  1. Go to https://supabase.com → New project"
Write-Host "  2. Choose a name + database password (save the password!)"
Write-Host "  3. Open SQL Editor → New query"
Write-Host "  4. Paste all of db/supabase_init.sql → Run"
Write-Host ""

Write-Host "STEP 2 — Copy connection string" -ForegroundColor Yellow
Write-Host "  Supabase → Project Settings → Database"
Write-Host "  Copy the URI or use .NET format from .env.supabase.example"
Write-Host "  Example:"
Write-Host "    Host=db.xxxx.supabase.co;Port=5432;Database=postgres;Username=postgres;Password=...;SSL Mode=Require;Trust Server Certificate=true;"
Write-Host ""

Write-Host "STEP 3 — Deploy API to Render" -ForegroundColor Yellow
Write-Host "  1. Push repo to GitHub"
Write-Host "  2. https://dashboard.render.com → New → Blueprint"
Write-Host "  3. Set ConnectionStrings__OmsDb to your Supabase string"
Write-Host "  4. Set Smtp__* vars if you want real emails"
Write-Host ""

Write-Host "STEP 4 — Connect Vercel frontend" -ForegroundColor Yellow
Write-Host "  Vercel → Settings → Environment Variables"
Write-Host "    VITE_API_BASE_URL = https://YOUR-API.onrender.com"
Write-Host "  cd frontend && npx vercel deploy --prod"
Write-Host ""

Write-Host "STEP 5 — Test" -ForegroundColor Yellow
Write-Host "  https://YOUR-API.onrender.com/health"
Write-Host "  Login: customer@demo.local / DemoPass!123"
Write-Host ""

Write-Host "Local dev (optional — uses Docker Postgres, same schema):" -ForegroundColor Green
Write-Host "  docker compose up -d"
Write-Host "  Uses db/supabase_init.sql automatically"
Write-Host ""

$open = Read-Host "Open Supabase dashboard? (y/n)"
if ($open -eq "y") {
  Start-Process "https://supabase.com/dashboard"
}
