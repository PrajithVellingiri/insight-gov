import os
import sys

# Add current directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import SessionLocal
from sqlalchemy import text

def truncate_tables():
    db = SessionLocal()
    try:
        print("Truncating tables...")
        # Execute raw SQL to truncate tables and cascade deletions
        db.execute(text("TRUNCATE TABLE petitions, users, departments CASCADE;"))
        db.commit()
        print("Tables truncated successfully.")
    except Exception as e:
        print(f"Error truncating tables: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    truncate_tables()
