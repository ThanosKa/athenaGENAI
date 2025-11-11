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

Write-Host "🧹 Cleaning build folder..." -ForegroundColor Cyan
try {
    npm run clean
    if ($LASTEXITCODE -ne 0) {
        Write-Host "⚠️ Clean failed, retrying after 2 seconds..." -ForegroundColor Yellow
        Start-Sleep -Seconds 2
        npm run clean
        if ($LASTEXITCODE -ne 0) {
            Write-Host "⚠️ Clean failed again, continuing anyway..." -ForegroundColor Yellow
            Write-Host "💡 Tip: If build fails, try:" -ForegroundColor Cyan
            Write-Host "   - Stop any running 'next dev' processes" -ForegroundColor Cyan
            Write-Host "   - Close editors/terminals accessing the project" -ForegroundColor Cyan
            Write-Host "   - Pause OneDrive sync temporarily" -ForegroundColor Cyan
            Write-Host "   - Run PowerShell as Administrator" -ForegroundColor Cyan
        }
    }
} catch {
    Write-Host "⚠️ Exception during cleaning: $_" -ForegroundColor Yellow
    Write-Host "Continuing with build anyway..." -ForegroundColor Yellow
}

Write-Host "🏗️ Building..." -ForegroundColor Cyan
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Local CI test complete!" -ForegroundColor Green

