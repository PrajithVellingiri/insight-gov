from fastapi import FastAPI
import uvicorn

app = FastAPI()

@app.post("/ai/analyze")
async def analyze(payload: dict):
    return {
        "category": "Test",
        "department": "Test",
        "priority": "low",
        "summary": "test",
        "confidence": 0.99,
        "analyzed_at": "2026-08-25T00:00:00Z",
        "is_duplicate": False,
        "duplicate_count": 0,
        "department_match": True
    }

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8001)
