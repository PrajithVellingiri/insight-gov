import asyncio
from uuid import uuid4
from fastapi import Request

async def main():
    try:
        from routers.petitions import submit_petition
        print("Import successful")
    except Exception as e:
        print("Import error:", e)

asyncio.run(main())
