# Starts the OMS stack and exposes the API for Firebase Hosting.
# Keep this window open while using https://alwakeel-alshamel.web.app

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $MyInvocation.MyCommand.Path | Split-Path -Parent

Write-Host "Starting Docker Desktop (if installed)..." -ForegroundColor Cyan
$dockerDesktop = "C:\Program Files\Docker\Docker\Docker Desktop.exe"
if (Test-Path $dockerDesktop) {
  Start-Process $dockerDesktop -ErrorAction SilentlyContinue
  Start-Sleep -Seconds 25
}

Set-Location $Root
Write-Host "Starting Postgres + Mailpit + API containers..." -ForegroundColor Cyan
docker compose -f docker-compose.yml -f docker-compose.firebase.yml up -d postgres mailpit backend

Write-Host "Waiting for API..." -ForegroundColor Cyan
Start-Sleep -Seconds 20

$cloudflared = "C:\Program Files (x86)\cloudflared\cloudflared.exe"
if (-not (Test-Path $cloudflared)) {
  Write-Host "cloudflared not found. Install with: winget install Cloudflare.cloudflared" -ForegroundColor Red
  exit 1
}

Write-Host "Opening public API tunnel on port 8080..." -ForegroundColor Cyan
Write-Host "Copy the https URL into Vercel/Firebase as VITE_API_BASE_URL" -ForegroundColor Yellow
& $cloudflared tunnel --url http://localhost:8080
