import threading
import uvicorn
import requests
import time
from uuid import uuid4
from database import SessionLocal
from models.user import User
from services.auth_service import AuthService
import logging

logging.basicConfig(level=logging.INFO)

def run_server():
    from main import app
    uvicorn.run(app, host="127.0.0.1", port=8009)

t = threading.Thread(target=run_server, daemon=True)
t.start()
time.sleep(3)

db = SessionLocal()
c = db.query(User).filter(User.role == "citizen").first()
token = AuthService.create_access_token(str(c.id), c.role)

headers = {"Authorization": f"Bearer {token}", "Content-Type": "multipart/form-data"}
data = {"title": "Test Bug", "description": "Test petition to see the CMD error", "location": "Test Location", "location_source": "manual"}

print("Sending petition...")
try:
    resp = requests.post("http://127.0.0.1:8009/petitions", headers=headers, data=data)
    print("Response:", resp.status_code)
    print("Body:", resp.text)
except Exception as e:
    print(e)
