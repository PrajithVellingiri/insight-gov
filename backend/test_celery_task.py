import asyncio
from worker import process_petition_ai_analysis
from uuid import uuid4

# We need a real petition ID in the DB to avoid errors, or just let it fail gracefully
from database import SessionLocal
from models.petition import Petition
db = SessionLocal()
p = db.query(Petition).first()
if not p:
    print("No petition found")
else:
    print("Executing task for petition", p.id)
    # mock AI client so it doesn't hang
    from services.ai_client import AIClient
    async def mock_analyze(*args, **kwargs):
        print("Mock analyze called")
        return None
    AIClient.analyze = mock_analyze
    
    # We call the inner python function of the celery task directly
    process_petition_ai_analysis(str(p.id), "Test Citizen")
    print("Task executed successfully!")
