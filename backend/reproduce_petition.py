import asyncio
import httpx
from database import SessionLocal
from models.user import User

async def main():
    db = SessionLocal()
    citizen = db.query(User).filter(User.role == 'citizen').first()
    db.close()
    
    if not citizen:
        print("No citizen found")
        return
        
    print(f"Using citizen: {citizen.email}")
    
    async with httpx.AsyncClient(base_url="http://localhost:8000") as client:
        # Login
        login_res = await client.post("/auth/login", json={"email": citizen.email, "password": "password123"})
        if login_res.status_code != 200:
            print("Login failed:", login_res.text)
            return
            
        token = login_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        # Submit petition
        files = {'files': ('test.jpg', b'fakeimage', 'image/jpeg')}
        data = {
            'title': 'Test bug petition',
            'description': 'Description',
            'location': 'Location',
            'location_source': 'manual'
        }
        
        print("Submitting petition...")
        res = await client.post("/petitions", data=data, files=files, headers=headers, timeout=10.0)
        print("Status:", res.status_code)
        print("Response:", res.text)

if __name__ == '__main__':
    asyncio.run(main())
