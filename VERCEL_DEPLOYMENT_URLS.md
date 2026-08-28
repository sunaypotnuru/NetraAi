# Netra AI - Vercel Frontend Deployment URLs

## 📋 Environment Variables for Vercel

Configure these in your Vercel project settings: **Settings → Environment Variables**

### 🔐 Supabase (Database + Auth)
```
VITE_SUPABASE_URL=https://erdjbpgiinohyhvtxjpq.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVyZGpicGdpaW5vaHlodnR4anBxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc3NTYwNjEsImV4cCI6MjA5MzMzMjA2MX0.wWtQcnoAlHXhwinEPw75NzO3AV9u9lbYkyVDGdRMDy0
```

### 🖥️ Backend API URL
**⚠️ IMPORTANT: Replace with your actual backend URL**
```
VITE_API_URL=https://your-backend-url.onrender.com
```
or
```
VITE_API_URL=https://your-backend-url.hf.space
```

### 📹 LiveKit (Video Consultations)
```
VITE_LIVEKIT_URL=wss://hialix-8dy6gb6m.livekit.cloud
```

### 🤖 AI Model Services (Hugging Face Spaces)

#### Anemia Detection Model
```
VITE_ANEMIA_API_URL=https://sunay-potnuru-netra-anemia-detection.hf.space
```

#### Cataract Detection Model
```
VITE_CATARACT_API_URL=https://sunay-potnuru-netra-cataract-detection.hf.space
```

#### Diabetic Retinopathy Detection Model
```
VITE_DR_API_URL=https://sunay-potnuru-netra-dr-detection.hf.space
```

#### Parkinson's Voice Analysis Model
```
VITE_PARKINSONS_API_URL=https://sunay-potnuru-netra-parkinsons-voice.hf.space
```

#### Mental Health Voice Triage Model
```
VITE_MENTAL_HEALTH_API_URL=https://sunay-potnuru-netra-mental-health.hf.space
```

#### Chatbot API (AI Assistant)
```
VITE_CHATBOT_API_URL=https://sunay-potnuru-netra-chatbot.hf.space
```

#### Emergency Services API
```
VITE_EMERGENCY_API_URL=https://sunay-potnuru-netra-emergency.hf.space
```

#### MCP (Model Control Protocol) API
```
VITE_MCP_API_URL=https://sunay-potnuru-netra-mcp-server.hf.space
```

### 🗺️ Google Services
```
VITE_GOOGLE_MAPS_API_KEY=AIzaSyCf_2VDz6ilL4UxmFuCQJbEJFbbjYJmirA
VITE_GOOGLE_CLIENT_ID=150007234181-836drtolqridvcs2ammd7k9gk9022dk4.apps.googleusercontent.com
```

### 💳 Razorpay (Payments) - Optional
```
VITE_RAZORPAY_KEY_ID=
```
*(Leave empty if payments are disabled)*

### ⚙️ Feature Toggles
```
VITE_BYPASS_AUTH=false
```
**⚠️ CRITICAL: Must be `false` in production for security**

---

## 🚀 Deployment Steps

### 1. Configure Vercel Environment Variables
1. Go to your Vercel project: https://vercel.com/dashboard
2. Navigate to: **Settings → Environment Variables**
3. Add all the variables above
4. Apply to: **Production, Preview, and Development**

### 2. Update Backend URL
Replace `VITE_API_URL` with your actual backend deployment URL:
- **Render**: `https://netra-ai-backend.onrender.com`
- **Hugging Face**: `https://sunay-potnuru-netra-backend.hf.space`
- **Railway**: `https://netra-ai-backend.up.railway.app`

### 3. Verify Hugging Face Spaces
Ensure all HF Spaces are deployed and accessible:
- ✅ Anemia Detection: `https://sunay-potnuru-netra-anemia-detection.hf.space`
- ✅ Cataract Detection: `https://sunay-potnuru-netra-cataract-detection.hf.space`
- ✅ DR Detection: `https://sunay-potnuru-netra-dr-detection.hf.space`
- ✅ Parkinson's Voice: `https://sunay-potnuru-netra-parkinsons-voice.hf.space`
- ✅ Mental Health: `https://sunay-potnuru-netra-mental-health.hf.space`
- ✅ Chatbot: `https://sunay-potnuru-netra-chatbot.hf.space`
- ✅ Emergency: `https://sunay-potnuru-netra-emergency.hf.space`
- ✅ MCP Server: `https://sunay-potnuru-netra-mcp-server.hf.space`

### 4. Deploy Frontend
```bash
cd C:\PROJECTS\Netra\ Ai\NetraAi-frontend-deployment
git push origin main
```

Vercel will automatically:
1. Detect the push
2. Install dependencies (`npm install`)
3. Build the project (`npm run build`)
4. Deploy to production

---

## 🔍 Troubleshooting

### Frontend Not Visible
1. Check Vercel deployment logs: **Deployments → [Latest] → View Function Logs**
2. Verify all environment variables are set
3. Ensure `VITE_API_URL` points to a live backend
4. Check browser console for errors (F12 → Console)

### API Connection Issues
1. Verify backend is running: `curl https://your-backend-url/health`
2. Check CORS settings in backend allow Vercel domain
3. Verify Supabase credentials are correct

### Video Call Issues
1. Verify LiveKit URL is correct: `wss://hialix-8dy6gb6m.livekit.cloud`
2. Check LiveKit API keys in backend are valid

---

## 📝 HF Tokens (for backend deployment)
```
# Store these securely in your backend environment variables
# Don't commit these to Git!
HF_TOKEN_SUNAY=<your-token-here>
HF_TOKEN_SUJAY=<your-token-here>
HF_TOKEN_Rohith=<your-token-here>
```
*(Use these in backend deployment for accessing HF models)*

---

## ✅ Deployment Checklist
- [ ] All Vercel environment variables configured
- [ ] Backend URL updated in `VITE_API_URL`
- [ ] All HF Spaces are running
- [ ] `VITE_BYPASS_AUTH=false` in production
- [ ] Frontend pushed to GitHub
- [ ] Vercel deployment completed successfully
- [ ] Test login on production URL
- [ ] Test video call functionality
- [ ] Test AI model endpoints

---

## 📚 Useful Links
- **Vercel Dashboard**: https://vercel.com/dashboard
- **Supabase Dashboard**: https://supabase.com/dashboard
- **LiveKit Dashboard**: https://cloud.livekit.io
- **Hugging Face Spaces**: https://huggingface.co/spaces
- **Frontend Repo**: https://github.com/sunaypotnuru/NetraAi-frontend-deployment
- **Main Repo**: https://github.com/sunaypotnuru/NetraAi
