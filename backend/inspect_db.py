from database import engine
from sqlalchemy import inspect

inspector = inspect(engine)
columns = inspector.get_columns('departments')
for col in columns:
    print(f"{col['name']}: {col['type']} (nullable={col['nullable']})")
