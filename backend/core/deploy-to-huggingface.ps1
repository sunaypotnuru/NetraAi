# Netra AI Core API - Hugging Face Deployment Script (PowerShell)
# This script deploys the Core API to Hugging Face Spaces

$ErrorActionPreference = "Stop"

Write-Host "🚀 Netra AI Core API - Hugging Face Deployment" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Configuration
$HF_SPACE = "sujay-potnuru/netra-core-api"
$HF_TOKEN = if ($env:HF_TOKEN_SUJAY) { $env:HF_TOKEN_SUJAY } else { "YOUR_HF_WRITE_TOKEN" }
$HF_URL = "https://huggingface.co/spaces/$HF_SPACE"

Write-Host "📋 Deployment Configuration:" -ForegroundColor Yellow
Write-Host "   Space: $HF_SPACE"
Write-Host "   URL: $HF_URL"
Write-Host ""

# Check if we're in the correct directory
if (-not (Test-Path "Dockerfile")) {
    Write-Host "❌ Error: Dockerfile not found!" -ForegroundColor Red
    Write-Host "   Please run this script from the backend/core directory" -ForegroundColor Red
    exit 1
}

if (-not (Test-Path "app/main.py")) {
    Write-Host "❌ Error: app/main.py not found!" -ForegroundColor Red
    Write-Host "   Please run this script from the backend/core directory" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Found Dockerfile and app/main.py" -ForegroundColor Green
Write-Host ""

# Initialize git if needed
if (-not (Test-Path ".git")) {
    Write-Host "📦 Initializing git repository..." -ForegroundColor Yellow
    git init
    git branch -M main
} else {
    Write-Host "✅ Git repository already initialized" -ForegroundColor Green
}

# Configure git
Write-Host "⚙️  Configuring git..." -ForegroundColor Yellow
git config user.name "Netra AI Deploy Bot"
git config user.email "deploy@netra-ai.com"

# Add Hugging Face remote
Write-Host "🔗 Adding Hugging Face remote..." -ForegroundColor Yellow
$remotes = git remote
if ($remotes -contains "hf") {
    Write-Host "   Removing existing 'hf' remote..." -ForegroundColor Gray
    git remote remove hf
}
git remote add hf "https://sujay-potnuru:$HF_TOKEN@huggingface.co/spaces/$HF_SPACE"

Write-Host "✅ Remote added successfully" -ForegroundColor Green
Write-Host ""

# Create .gitignore if it doesn't exist
if (-not (Test-Path ".gitignore")) {
    Write-Host "📝 Creating .gitignore..." -ForegroundColor Yellow
    @"
__pycache__/
*.py[cod]
*`$py.class
*.so
.Python
.env
.env.local
.venv
env/
venv/
.pytest_cache/
.coverage
htmlcov/
.ruff_cache/
*.log
.DS_Store
scratch/
tests/
*.db
*.sqlite
"@ | Out-File -FilePath ".gitignore" -Encoding UTF8
}

# Stage all files
Write-Host "📦 Staging files for deployment..." -ForegroundColor Yellow
git add .

# Check if there are changes to commit
$status = git status --porcelain
if ($status) {
    Write-Host "💾 Committing changes..." -ForegroundColor Yellow
    $commitMessage = @"
Deploy Netra AI Core API to Hugging Face

- FastAPI backend with all routes
- Supabase integration
- Admin dashboard APIs
- ML diagnostic endpoints
- Authentication & authorization
- Database views and analytics

Deployed: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')
"@
    git commit -m $commitMessage
} else {
    Write-Host "ℹ️  No changes to commit" -ForegroundColor Gray
}

# Push to Hugging Face
Write-Host ""
Write-Host "🚀 Pushing to Hugging Face Spaces..." -ForegroundColor Cyan
Write-Host "   This may take a few minutes..." -ForegroundColor Gray
Write-Host ""

try {
    git push hf main --force
    
    Write-Host ""
    Write-Host "✅ Deployment initiated successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📊 Next Steps:" -ForegroundColor Yellow
    Write-Host "   1. Visit: $HF_URL"
    Write-Host "   2. Wait for build to complete (5-7 minutes)"
    Write-Host "   3. Check health endpoint: $HF_URL/health"
    Write-Host "   4. Update frontend .env with: VITE_API_URL=$HF_URL"
    Write-Host ""
    Write-Host "🔍 Monitor build progress at:" -ForegroundColor Yellow
    Write-Host "   $HF_URL/settings"
    Write-Host ""
    Write-Host "✨ Deployment script completed!" -ForegroundColor Green
} catch {
    Write-Host ""
    Write-Host "❌ Deployment failed!" -ForegroundColor Red
    Write-Host "Error: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "Troubleshooting:" -ForegroundColor Yellow
    Write-Host "   1. Check if the Hugging Face space exists"
    Write-Host "   2. Verify the token is correct"
    Write-Host "   3. Ensure you have write access to the space"
    Write-Host "   4. Try running: git push hf main --force --verbose"
    exit 1
}
