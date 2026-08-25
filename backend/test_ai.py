import asyncio
import httpx

async def main():
    payload = {
        "id": "123e4567-e89b-12d3-a456-426614174000",
        "title": "Test Title",
        "description": "Test Description",
        "location": "Test Location",
        "submitted_by": "Test User"
    }
    async with httpx.AsyncClient(timeout=10.0) as client:
        res = await client.post("http://localhost:8001/ai/analyze", json=payload)
        print("Status:", res.status_code)
        print("Response:", res.text)

asyncio.run(main())
