from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.notifications import notification_manager
from app.db.database import engine, Base
import app.db.base  # Ensures all ORM models are registered with Base metadata
from app.api.routes import auth, receipts, admin


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Create tables in SQLite if they don't exist
    Base.metadata.create_all(bind=engine)
    yield
    # Shutdown: Clean up resources if needed


app = FastAPI(
    title="Receipt Processing API",
    description="Backend API for Clearclaim Receipt Processing Dashboard with JWT auth, RBAC, receipt management, and real-time WebSocket notifications.",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# Robust CORS configuration supporting any localhost / 127.0.0.1 development port
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:[0-9]+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Routers
app.include_router(auth.router)
app.include_router(receipts.router)
app.include_router(admin.router)


@app.websocket("/ws/notifications/{user_id}")
async def websocket_notifications(websocket: WebSocket, user_id: str):
    """
    WebSocket endpoint for real-time status update notifications.
    Clients connect to receive live review notifications.
    """
    await notification_manager.connect(user_id, websocket)
    try:
        while True:
            # Keep socket alive and receive client pings
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        notification_manager.disconnect(user_id, websocket)


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