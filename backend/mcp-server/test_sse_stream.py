from fastapi.testclient import TestClient
from main import app

def test():
    with TestClient(app, base_url="http://localhost:8080") as client:
        # Start a request to the SSE endpoint and read the first event
        with client.stream("GET", "/mcp/sse") as response:
            print(f"Status: {response.status_code}")
            for line in response.iter_lines():
                print(f"Event: {line}")
                if "data: " in line:
                    break

if __name__ == "__main__":
    test()
