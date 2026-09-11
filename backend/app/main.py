"""FastAPI application entry point."""
from fastapi import FastAPI
from .api import router
from .database import engine
from .models import Base

app = FastAPI(title="NM-HireX", version="1.0.0")
app.include_router(router)

@app.get("/health")
def health():
    """Input: none. Output: simple service health response."""
    return {"status": "ok"}

# Development convenience. For production use Alembic migrations instead.
# Base.metadata.create_all(bind=engine)
