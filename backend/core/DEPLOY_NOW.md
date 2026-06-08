# Deploy Core API to Hugging Face - Quick Guide

## Prerequisites
- Git installed
- Hugging Face account: sujay-potnuru
- Token: `YOUR_HF_WRITE_TOKEN`

## Option 1: PowerShell Script (Windows - RECOMMENDED)

```powershell
cd "C:\Netra Ai\Netra-Ai\backend\core"
.\deploy-to-huggingface.ps1
```

## Option 2: Manual Deployment (If script fails)

### Step 1: Navigate to Core API
```powershell
cd "C:\Netra Ai\Netra-Ai\backend\core"
```

### Step 2: Initialize Git (if needed)
```powershell
git init
git branch -M main
```

### Step 3: Configure Git
```powershell
git config user.name "Netra AI Deploy"
git config user.email "deploy@netra-ai.com"
```

### Step 4: Add Hugging Face Remote
```powershell
git remote remove hf 2>$null
git remote add hf https://sujay-potnuru:YOUR_HF_WRITE_TOKEN@huggingface.co/spaces/sujay-potnuru/netra-core-api
```

### Step 5: Stage and Commit
```powershell
git add .
git commit -m "Deploy Netra AI Core API - $(Get-Date -Format 'yyyy-MM-dd HH:mm')"
```

### Step 6: Push to Hugging Face
```powershell
git push hf main --force
```

## After Deployment

### 1. Wait for Build (5-7 minutes)
Visit: https://huggingface.co/spaces/sujay-potnuru/netra-core-api

### 2. Check Health Endpoint
```powershell
curl https://sujay-potnuru-netra-core-api.hf.space/health
```

Expected response:
```json
{"status": "healthy", "service": "netra-ai-core-api"}
```

### 3. Update Frontend .env
Edit: `C:\Netra Ai\Netra-Ai\frontend\.env`

Change:
```env
VITE_API_URL=https://sujay-potnuru-netra-core-api.hf.space
```

### 4. Restart Frontend
```powershell
cd "C:\Netra Ai\Netra-Ai\frontend"
npm run dev
```

## Troubleshooting

### Issue: Git not found
**Solution:** Install Git from https://git-scm.com/download/win

### Issue: Push rejected
**Solution:** Use `--force` flag:
```powershell
git push hf main --force
```

### Issue: Authentication failed
**Solution:** Check token is correct in the remote URL

### Issue: Build fails on Hugging Face
**Solution:** 
1. Check Dockerfile exists
2. Check requirements.txt exists
3. Review build logs on Hugging Face

## Quick Verification

After deployment, test these endpoints:

1. **Health Check**
   ```
   https://sujay-potnuru-netra-core-api.hf.space/health
   ```

2. **API Docs**
   ```
   https://sujay-potnuru-netra-core-api.hf.space/docs
   ```

3. **Admin Stats** (requires auth)
   ```
   https://sujay-potnuru-netra-core-api.hf.space/api/v1/admin/stats
   ```

## Success Criteria

- ✅ Build completes on Hugging Face
- ✅ Health endpoint returns 200 OK
- ✅ API docs page loads
- ✅ Frontend can connect to new API URL
- ✅ Admin portal loads without errors

---

**Estimated Time:** 10-15 minutes (including build time)
