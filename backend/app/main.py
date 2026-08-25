from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.db.database import engine, Base
import app.db.base  # Ensures all ORM models are registered with Base metadata
from app.api.routes import auth, receipts


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Create tables in SQLite if they don't exist
    Base.metadata.create_all(bind=engine)
    yield
    # Shutdown: Clean up resources if needed


app = FastAPI(
    title="Receipt Processing API",
    description="Backend API for Clearclaim Receipt Processing Dashboard with JWT auth, RBAC, and receipt management.",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# Explicit CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Routers
app.include_router(auth.router)
app.include_router(receipts.router)


@app.get("/", tags=["Health"])
def root():
    return {
        "status": "healthy",
        "message": "Receipt Processing API is running",
        "version": "1.0.0"
    }


@app.get("/health", tags=["Health"])
def health_check():
    return {
        "status": "up",
        "database": "connected"
    }