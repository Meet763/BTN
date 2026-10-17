# Rebuild images from the current folder (no GitHub required).
$ErrorActionPreference = "Stop"
Set-Location (Join-Path $PSScriptRoot "..")

if (-not (Test-Path ".env")) {
  Write-Error "Copy .env.example to .env and set passwords first."
}

docker compose up -d --build
docker compose ps
Write-Host "App is on http://localhost:8080 (or WEB_PORT from .env)"
