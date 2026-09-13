$ErrorActionPreference = 'Stop'
Write-Host '=== ETERNAL CLIENT VERIFIED WINDOWS BUILD ===' -ForegroundColor Red
if (!(Get-Command node -ErrorAction SilentlyContinue)) { throw 'Node.js 20+ is required.' }
if (!(Test-Path node_modules)) { npm install }
npm run doctor
npm run test
npm run build
npm run dist
