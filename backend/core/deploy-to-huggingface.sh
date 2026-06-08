#!/bin/bash

# Netra AI Core API - Hugging Face Deployment Script
# This script deploys the Core API to Hugging Face Spaces

set -e  # Exit on error

echo "🚀 Netra AI Core API - Hugging Face Deployment"
echo "================================================"
echo ""

# Configuration
HF_SPACE="sujay-potnuru/netra-core-api"
HF_TOKEN="${HF_TOKEN_SUJAY:-YOUR_HF_WRITE_TOKEN}"
HF_URL="https://huggingface.co/spaces/$HF_SPACE"

echo "📋 Deployment Configuration:"
echo "   Space: $HF_SPACE"
echo "   URL: $HF_URL"
echo ""

# Check if we're in the correct directory
if [ ! -f "Dockerfile" ]; then
    echo "❌ Error: Dockerfile not found!"
    echo "   Please run this script from the backend/core directory"
    exit 1
fi

if [ ! -f "app/main.py" ]; then
    echo "❌ Error: app/main.py not found!"
    echo "   Please run this script from the backend/core directory"
    exit 1
fi

echo "✅ Found Dockerfile and app/main.py"
echo ""

# Initialize git if needed
if [ ! -d ".git" ]; then
    echo "📦 Initializing git repository..."
    git init
    git branch -M main
else
    echo "✅ Git repository already initialized"
fi

# Configure git
echo "⚙️  Configuring git..."
git config user.name "Netra AI Deploy Bot"
git config user.email "deploy@netra-ai.com"

# Add Hugging Face remote
echo "🔗 Adding Hugging Face remote..."
if git remote | grep -q "^hf$"; then
    echo "   Removing existing 'hf' remote..."
    git remote remove hf
fi
git remote add hf "https://sujay-potnuru:$HF_TOKEN@huggingface.co/spaces/$HF_SPACE"

echo "✅ Remote added successfully"
echo ""

# Create .gitignore if it doesn't exist
if [ ! -f ".gitignore" ]; then
    echo "📝 Creating .gitignore..."
    cat > .gitignore << 'EOF'
__pycache__/
*.py[cod]
*$py.class
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
EOF
fi

# Stage all files
echo "📦 Staging files for deployment..."
git add .

# Check if there are changes to commit
if git diff --staged --quiet; then
    echo "ℹ️  No changes to commit"
else
    echo "💾 Committing changes..."
    git commit -m "Deploy Netra AI Core API to Hugging Face

- FastAPI backend with all routes
- Supabase integration
- Admin dashboard APIs
- ML diagnostic endpoints
- Authentication & authorization
- Database views and analytics

Deployed: $(date '+%Y-%m-%d %H:%M:%S')"
fi

# Push to Hugging Face
echo ""
echo "🚀 Pushing to Hugging Face Spaces..."
echo "   This may take a few minutes..."
echo ""

git push hf main --force

echo ""
echo "✅ Deployment initiated successfully!"
echo ""
echo "📊 Next Steps:"
echo "   1. Visit: $HF_URL"
echo "   2. Wait for build to complete (5-7 minutes)"
echo "   3. Check health endpoint: $HF_URL/health"
echo "   4. Update frontend .env with: VITE_API_URL=$HF_URL"
echo ""
echo "🔍 Monitor build progress at:"
echo "   $HF_URL/settings"
echo ""
echo "✨ Deployment script completed!"
