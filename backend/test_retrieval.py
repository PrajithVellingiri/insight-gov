import asyncio
from fastapi.testclient import TestClient
from main import app
from database import SessionLocal
from models.user import User

db = SessionLocal()
citizen = db.query(User).filter(User.role == 'citizen').first()
db.close()

client = TestClient(app)
login_res = client.post("/auth/login", json={"email": citizen.email, "password": "password123"})
token = login_res.json()["access_token"]
headers = {"Authorization": f"Bearer {token}"}

print("Testing retrieval...")
res = client.get("/petitions", headers=headers)
print("Status:", res.status_code)
if res.status_code == 200:
    print("Retrieved", len(res.json()), "petitions")
else:
    print("Error:", res.text)
