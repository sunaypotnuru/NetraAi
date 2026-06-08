#!/bin/bash
# Deployment script for Netra AI Core API to Hugging Face Spaces
# Target: sujay-potnuru/netra-core-api

set -e  # Exit on error

echo "🚀 Starting deployment to Hugging Face Spaces..."

# Configuration
HF_USERNAME="sujay-potnuru"
HF_SPACE_NAME="netra-core-api"
HF_SPACE_URL="https://huggingface.co/spaces/${HF_USERNAME}/${HF_SPACE_NAME}"
HF_TOKEN="${HF_TOKEN_SUJAY:-YOUR_HF_WRITE_TOKEN}"

# Check if we're in the right directory
if [ ! -f "Dockerfile" ]; then
    echo "❌ Error: Dockerfile not found. Please run this script from backend/core/"
    exit 1
fi

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "📦 Initializing git repository..."
    git init
    git config user.name "Netra AI Deployment"
    git config user.email "deployment@netra-ai.com"
else
    echo "✅ Git repository already initialized"
fi

# Add Hugging Face remote
echo "🔗 Configuring Hugging Face remote..."
if git remote | grep -q "^huggingface$"; then
    echo "   Removing existing huggingface remote..."
    git remote remove huggingface
fi

git remote add huggingface "https://${HF_USERNAME}:${HF_TOKEN}@huggingface.co/spaces/${HF_USERNAME}/${HF_SPACE_NAME}"
echo "✅ Hugging Face remote configured"

# Stage all files (excluding .git and cache directories)
echo "📝 Staging files for deployment..."
git add -A

# Check if there are changes to commit
if git diff --cached --quiet; then
    echo "ℹ️  No changes to commit, checking if we need to push..."
else
    # Commit changes
    echo "💾 Committing changes..."
    git commit -m "Deploy Netra AI Core API to Hugging Face Spaces

- FastAPI backend with health monitoring
- Configured for port 7860 (HF Spaces default)
- Includes all dependencies and migrations
- Deployment timestamp: $(date -u +"%Y-%m-%d %H:%M:%S UTC")"
fi

# Push to Hugging Face
echo "⬆️  Pushing to Hugging Face Spaces..."
echo "   Target: ${HF_SPACE_URL}"

# Force push to main branch (HF Spaces uses 'main')
git push huggingface main --force

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📍 Your space is available at:"
echo "   ${HF_SPACE_URL}"
echo ""
echo "🔗 API endpoint:"
echo "   https://${HF_USERNAME}-${HF_SPACE_NAME}.hf.space"
echo ""
echo "⏳ Note: It may take 2-3 minutes for the space to build and start."
echo "   Check the build logs at: ${HF_SPACE_URL}/logs"
echo ""
