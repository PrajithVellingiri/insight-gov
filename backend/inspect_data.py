from database import engine
from sqlalchemy import text

with engine.begin() as conn:
    res = conn.execute(text("SELECT id, name, department_code FROM departments ORDER BY created_at"))
    for row in res:
        print(row)
