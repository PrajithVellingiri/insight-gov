import sys
from fastapi.testclient import TestClient

try:
    from main import app
    client = TestClient(app)
    # The health endpoint is actually not protected by limiter, but creating TestClient triggers app startup
    print("App started successfully")
except Exception as e:
    print("App failed to start:", e)
    sys.exit(1)
