import requests
import os
import sys

sys.path.append(os.getcwd())
from database import SessionLocal
from models.user import User
from services.auth_service import AuthService

db = SessionLocal()
c = db.query(User).filter(User.role == 'citizen').first()

token = AuthService.create_access_token(str(c.id), c.role)

headers = {"Authorization": f"Bearer {token}"}
data = {
    "title": "Test Phase 2 Bug",
    "description": "Test petition to see the CMD error",
    "location": "Test Location",
    "location_source": "manual",
}
files = {"files": ("test.jpg", b"dummy image data", "image/jpeg")}

print("Sending petition...")
try:
    resp = requests.post("http://127.0.0.1:8000/petitions", headers=headers, data=data, files=files, timeout=15)
    print("Status:", resp.status_code)
    print("Body:", resp.text)
except Exception as e:
    print("Exception:", e)
