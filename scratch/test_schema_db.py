import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), "..", "backend"))

from database import SessionLocal
from models.petition import Petition
from schemas.petition import PetitionWithAnalysis

db = SessionLocal()
petition = db.query(Petition).first()
if not petition:
    print("No petition found in DB.")
    sys.exit(0)

try:
    schema = PetitionWithAnalysis.model_validate(petition)
    print("Schema validated successfully!")
    print(schema.model_dump_json(indent=2))
except Exception as e:
    print(f"Validation failed: {e}")
