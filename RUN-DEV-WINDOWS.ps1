$ErrorActionPreference = 'Stop'
Write-Host '=== ETERNAL CLIENT DEV ===' -ForegroundColor Red
if (!(Get-Command node -ErrorAction SilentlyContinue)) { throw 'Node.js 20+ is required.' }
if (!(Test-Path node_modules)) { npm install }
npm run doctor
npm run dev
