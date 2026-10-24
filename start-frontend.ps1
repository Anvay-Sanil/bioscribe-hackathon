# ============================================================================
# BioScribe AI - Start Frontend Development Server
# ============================================================================

Write-Host "🧬 Starting BioScribe AI Frontend..." -ForegroundColor Cyan

# Navigate to frontend
Set-Location -Path "bioscribe-ai"

# Start development server
Write-Host "Starting Next.js development server..." -ForegroundColor Green
Write-Host "Application will be available at: http://localhost:3000" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host ""

npm run dev
