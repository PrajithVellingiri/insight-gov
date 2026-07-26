import os
import sys

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import engine, SessionLocal
from sqlalchemy import text

def delete_officers():
    db = SessionLocal()
    try:
        print("Deleting officers...")
        db.execute(text("DELETE FROM users WHERE role='officer';"))
        db.commit()
        print("Officers deleted successfully.")
    except Exception as e:
        print(f"Error deleting officers: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    delete_officers()
