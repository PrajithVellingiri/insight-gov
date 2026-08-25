from database import engine
from sqlalchemy import text

with engine.begin() as conn:
    conn.execute(text("UPDATE alembic_version SET version_num='24c4f0c75b03'"))
    print("Alembic version updated.")
