# 🚀 QUICK START - DOCKER REBUILD

**Last Updated:** May 21, 2026  
**Status:** ✅ Ready to rebuild

---

## ⚡ FASTEST WAY (1 Command)

```powershell
.\rebuild-docker.ps1
```

**Time:** 15-30 minutes  
**What it does:** Stops, removes, rebuilds, and starts all 13 Docker services

---

## 🎯 MANUAL WAY (Step-by-Step)

### 1. Stop & Remove

```powershell
cd "C:\PROJECTS\Netra Ai\Netra-Ai\infrastructure\docker"
docker-compose down
docker system prune -f
```

### 2. Rebuild

```powershell
docker-compose build --no-cache
```

### 3. Start

```powershell
docker-compose up -d
```

### 4. Verify

```powershell
docker ps | Select-String "netra-"
```

---

## 🧪 TEST EVERYTHING

```powershell
# Frontend
Start-Process "http://localhost:3000"

# Backend
Invoke-WebRequest -Uri "http://localhost:8000/health" -UseBasicParsing

# SHARP Compliance
.\scripts\tests\test_sharp_compliance.ps1
```

---

## 📊 SERVICES & PORTS

| Service | Port | URL |
|---------|------|-----|
| Frontend | 3000 | http://localhost:3000 |
| Backend | 8000 | http://localhost:8000 |
| MCP Server | 8080 | http://localhost:8080 |
| A2A Agent | 8081 | http://localhost:8081 |
| Anemia | 8001 | http://localhost:8001 |
| DR | 8002 | http://localhost:8002 |
| Mental Health | 8003 | http://localhost:8003 |
| Parkinson's | 8004 | http://localhost:8004 |
| Cataract | 8005 | http://localhost:8005 |
| Chatbot | 8006 | http://localhost:8006 |
| Emergency | 8007 | http://localhost:8007 |
| Translation | 5000 | http://localhost:5000 |
| Redis | 6379 | redis://localhost:6379 |

---

## 🔧 TROUBLESHOOTING

### Containers won't start?

```powershell
docker-compose logs
```

### Port already in use?

```powershell
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### Need to restart one service?

```powershell
docker-compose restart backend
```

---

## 📚 MORE INFO

- **Full guide:** `FINAL_VERIFICATION_AND_DOCKER_COMMANDS.md`
- **Complete status:** `ALL_TASKS_COMPLETE_FINAL.md`
- **Cleanup summary:** `FINAL_CLEANUP_COMPLETE.md`

---

## ⚠️ IMPORTANT

- ✅ DO NOT PUSH TO GITHUB (as instructed)
- ✅ Rebuild will take 15-30 minutes
- ✅ Requires ~20 GB disk space
- ✅ Other projects (Brandlytic, Nexus, Luna) NOT affected

---

**Ready?** Run `.\rebuild-docker.ps1` now! 🚀

