# PowerShell script to test CI pipeline locally
# Run with: .\test-ci.ps1

Write-Host "🧹 Linting..." -ForegroundColor Cyan
npm run lint
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Linting failed!" -ForegroundColor Red
    exit 1
}

npm run type-check
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Type check failed!" -ForegroundColor Red
    exit 1
}

Write-Host "🧪 Testing..." -ForegroundColor Cyan
npm test -- --run
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Tests failed!" -ForegroundColor Red
    exit 1
}

Write-Host "🏗️ Building..." -ForegroundColor Cyan
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Local CI test complete!" -ForegroundColor Green

