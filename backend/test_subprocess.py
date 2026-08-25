import subprocess
import time
import requests
from uuid import uuid4
from database import SessionLocal
from models.user import User
from services.auth_service import AuthService

p = subprocess.Popen([r".venv\Scripts\python.exe", "-m", "uvicorn", "main:app", "--port", "8008"], stderr=subprocess.PIPE, stdout=subprocess.PIPE, text=True)

time.sleep(4)

db = SessionLocal()
c = db.query(User).filter(User.role == "citizen").first()
token = AuthService.create_access_token(str(c.id), c.role)

headers = {"Authorization": f"Bearer {token}"}
data = {
    "title": "Test Bug",
    "description": "Test petition to see the CMD error",
    "location": "Test Location",
    "location_source": "manual",
}
files = {"files": ("test.jpg", b"dummy image data", "image/jpeg")}

try:
    resp = requests.post("http://127.0.0.1:8008/petitions", headers=headers, data=data, files=files, timeout=5)
    print("Response:", resp.status_code)
except Exception as e:
    print("Request failed:", e)

p.terminate()
stdout, stderr = p.communicate()
print("STDOUT:")
print(stdout)
print("STDERR:")
print(stderr)
