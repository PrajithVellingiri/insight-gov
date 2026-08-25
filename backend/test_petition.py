import sys
import asyncio
from fastapi.testclient import TestClient

try:
    from main import app
    from middleware.auth import get_current_user
    from models.user import User
    
    async def mock_get_current_user():
        return User(id="8bd44c36-c5da-44b5-ba66-ab8153cd4ed3", email="citizen_54c96a5b@test.com", role="citizen", name="Test Citizen")
        
    app.dependency_overrides[get_current_user] = mock_get_current_user

    client = TestClient(app)
    
    files = {"files": ("test.jpg", b"dummy image data", "image/jpeg")}
    data = {
        "title": "Test Phase 2 Bug",
        "description": "This is a test petition to see the CMD error",
        "location": "Test Location",
        "location_source": "manual",
    }
    
    resp_pet = client.post("/petitions", data=data, files=files)
    print("Petition Response:", resp_pet.status_code)
    print("Body:", resp_pet.text)
    
except Exception as e:
    import traceback
    traceback.print_exc()
    sys.exit(1)
