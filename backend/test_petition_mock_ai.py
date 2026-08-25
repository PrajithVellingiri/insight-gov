import asyncio
from fastapi.testclient import TestClient
from main import app
from database import SessionLocal
from models.user import User

# Mock the AI Client to return instantly
from services.ai_client import AIClient
async def mock_analyze(*args, **kwargs):
    return {"category": "test", "priority": "low", "department": "test"}
AIClient.analyze = mock_analyze

# Mock Celery delay to raise an exception so it falls back to synchronous
from worker import process_petition_ai_analysis
def mock_delay(*args, **kwargs):
    raise Exception("Simulate Redis down")
process_petition_ai_analysis.delay = mock_delay

db = SessionLocal()
citizen = db.query(User).filter(User.role == 'citizen').first()
db.close()

client = TestClient(app)

print(f"Using citizen: {citizen.email}")

login_res = client.post("/auth/login", json={"email": citizen.email, "password": "password123"})
if login_res.status_code != 200:
    print("Login failed:", login_res.text)
    exit(1)

token = login_res.json()["access_token"]
headers = {"Authorization": f"Bearer {token}"}

files = [('files', ('test.jpg', b'fakeimage', 'image/jpeg'))]
data = {
    'title': 'Test bug petition',
    'description': 'Description',
    'location': 'Location',
    'location_source': 'manual'
}

print("Submitting petition...")
res = client.post("/petitions", data=data, files=files, headers=headers)
print("Status:", res.status_code)
print("Response:", res.text)
