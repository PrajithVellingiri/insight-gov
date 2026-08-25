import logging
import sys

# Configure root logger to output to stdout
logging.basicConfig(level=logging.WARNING, stream=sys.stdout)

import asyncio
from fastapi import FastAPI, Request
from fastapi.testclient import TestClient
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from limiter import limiter

app = FastAPI()
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

@app.get("/test")
@limiter.limit("2/minute")
async def test_endpoint(request: Request):
    return {"status": "ok"}

client = TestClient(app)

for i in range(3):
    resp = client.get("/test")
    print(f"Request {i+1}: Status {resp.status_code}")
