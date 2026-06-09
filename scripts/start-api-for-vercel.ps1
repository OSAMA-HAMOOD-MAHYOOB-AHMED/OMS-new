# Starts the OMS API stack and exposes it via Cloudflare tunnel for a Vercel-hosted frontend.

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
docker compose -f docker-compose.yml -f docker-compose.vercel.yml up -d postgres mailpit backend

Write-Host "Waiting for API..." -ForegroundColor Cyan
Start-Sleep -Seconds 20

$cloudflared = "C:\Program Files (x86)\cloudflared\cloudflared.exe"
if (-not (Test-Path $cloudflared)) {
  Write-Host "cloudflared not found. Install with: winget install Cloudflare.cloudflared" -ForegroundColor Red
  exit 1
}

Write-Host ""
Write-Host "Set VITE_API_BASE_URL in Vercel to the tunnel URL below:" -ForegroundColor Yellow
Write-Host ""
& $cloudflared tunnel --url http://localhost:8080
