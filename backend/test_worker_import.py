import asyncio
import sys

# Simulate main.py importing petition_service
from services.petition_service import PetitionService

print("PetitionService loaded")

def simulate_create_petition():
    try:
        from worker import process_petition_ai_analysis
        print("Worker imported successfully:", process_petition_ai_analysis)
    except Exception as e:
        import traceback
        traceback.print_exc()

simulate_create_petition()
