import requests
import time
import threading
import uvicorn
from database import SessionLocal
from models.user import User
from services.auth_service import AuthService
import logging

def run_server():
    from main import app
    uvicorn.run(app, host="127.0.0.1", port=8010, log_level="warning")

t = threading.Thread(target=run_server, daemon=True)
t.start()
time.sleep(3)

db = SessionLocal()
c = db.query(User).filter(User.role == "citizen").first()
token = AuthService.create_access_token(str(c.id), c.role)
headers = {"Authorization": f"Bearer {token}"}

print("1. Without image")
data1 = {"title": "No Image", "description": "test", "location": "test"}
# Emulate frontend's empty file array or no files parameter
try:
    resp1 = requests.post("http://127.0.0.1:8010/petitions", headers=headers, data=data1, files={"files": ("empty", b"")})
    print("PASS" if resp1.status_code == 201 else f"FAIL: {resp1.status_code} {resp1.text}")
except Exception as e:
    print("FAIL:", e)

print("2. With image")
data2 = {"title": "With Image", "description": "test", "location": "test"}
try:
    resp2 = requests.post("http://127.0.0.1:8010/petitions", headers=headers, data=data2, files={"files": ("test.jpg", b"dummy image", "image/jpeg")})
    print("PASS" if resp2.status_code == 201 else f"FAIL: {resp2.status_code} {resp2.text}")
except Exception as e:
    print("FAIL:", e)

print("3. With location")
data3 = {"title": "With Location", "description": "test", "location": "test", "latitude": "12.34", "longitude": "56.78", "device_latitude": "12.34", "device_longitude": "56.78"}
try:
    resp3 = requests.post("http://127.0.0.1:8010/petitions", headers=headers, data=data3, files={"files": ("test.jpg", b"dummy image", "image/jpeg")})
    print("PASS" if resp3.status_code == 201 else f"FAIL: {resp3.status_code} {resp3.text}")
except Exception as e:
    print("FAIL:", e)
