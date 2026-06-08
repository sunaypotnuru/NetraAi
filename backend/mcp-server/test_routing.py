import httpx
import asyncio
from fastapi.testclient import TestClient
from main import app

def test():
    # MUST use with block to trigger lifespan events
    with TestClient(app, base_url="http://localhost:8080") as client:
        headers = {"Host": "localhost"}
        
        # Test /mcp/sse
        r1 = client.get("/mcp/sse", follow_redirects=False, headers=headers)
        print(f"GET /mcp/sse -> {r1.status_code}")
        if r1.status_code in [301, 302, 307]:
            print(f"Redirects to: {r1.headers.get('location')}")
            
        # Test /mcp/sse/
        r2 = client.get("/mcp/sse/", follow_redirects=False, headers=headers)
        print(f"GET /mcp/sse/ -> {r2.status_code}")
        if r2.status_code != 200:
            print(r2.text[:100])
        else:
            print("Success")
            
if __name__ == "__main__":
    test()
