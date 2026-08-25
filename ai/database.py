import asyncpg
import logging
from config import DATABASE_URL

logger = logging.getLogger(__name__)

async def fetch_departments() -> list[dict]:
    """
    Fetch all departments and their descriptions from the database.
    Returns a list of dicts: [{"name": "...", "description": "..."}, ...]
    """
    try:
        conn = await asyncpg.connect(DATABASE_URL)
        rows = await conn.fetch("SELECT name, description FROM departments")
        await conn.close()
        
        departments = []
        for row in rows:
            departments.append({
                "name": row["name"],
                "description": row["description"] or "No description provided."
            })
        return departments
    except Exception as exc:
        logger.error(f"Failed to fetch departments from DB: {exc}")
        return []
