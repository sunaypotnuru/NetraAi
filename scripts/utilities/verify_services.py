import requests
import time

services = {
    "Vite Frontend": "http://localhost:3000",
    "LibreTranslate": "http://localhost:5000/",
    "FastAPI Core API": "http://localhost:8000/health",
    "Anemia CNN Service": "http://localhost:8001/health",
    "Diabetic Retinopathy": "http://localhost:8002/health",
    "Mental Health Service": "http://localhost:8003/health",
    "Parkinson's Voice": "http://localhost:8004/health",
    "Cataract Service": "http://localhost:8005/health",
    "Mental Health Chatbot": "http://localhost:8006/health",
    "Emergency Services": "http://localhost:8007/health",
    "MCP Server Engine": "http://localhost:8080/health"
}

print("=== STARTING NETRAAI SERVICES HEALTH CHECK ===")
for name, url in services.items():
    start = time.time()
    try:
        res = requests.get(url, timeout=5)
        latency = (time.time() - start) * 1000
        if res.status_code in [200, 201, 301, 302, 304]:
            print(f"[HEALTHY] {name:25} | Status: {res.status_code} | Latency: {latency:.2f}ms")
        else:
            print(f"[UNHEALTHY] {name:24} | Status: {res.status_code} | Response: {res.text[:100]}")
    except Exception as e:
        print(f"[OFFLINE] {name:27} | Error: {e}")
print("===============================================")
