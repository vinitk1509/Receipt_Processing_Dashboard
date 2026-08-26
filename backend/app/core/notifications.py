import asyncio
import json
from typing import Dict, Set, Any
from fastapi import WebSocket


class NotificationManager:
    """
    WebSocket Connection & Real-Time Notification Manager.
    Maps user_id -> Set of active WebSocket connections.
    """

    def __init__(self):
        self.active_connections: Dict[str, Set[WebSocket]] = {}

    async def connect(self, user_id: str, websocket: WebSocket):
        await websocket.accept()
        if user_id not in self.active_connections:
            self.active_connections[user_id] = set()
        self.active_connections[user_id].add(websocket)

    def disconnect(self, user_id: str, websocket: WebSocket):
        if user_id in self.active_connections:
            self.active_connections[user_id].discard(websocket)
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]

    async def send_to_user(self, user_id: str, message: Dict[str, Any]):
        """Send notification payload to all active sockets of a specific user."""
        if user_id in self.active_connections:
            dead_sockets = set()
            for ws in self.active_connections[user_id]:
                try:
                    await ws.send_text(json.dumps(message))
                except Exception:
                    dead_sockets.add(ws)

            for ws in dead_sockets:
                self.active_connections[user_id].discard(ws)

    async def broadcast_all(self, message: Dict[str, Any]):
        """Broadcast notification payload to all currently connected clients across the system."""
        dead_map = {}
        for uid, sockets in self.active_connections.items():
            for ws in sockets:
                try:
                    await ws.send_text(json.dumps(message))
                except Exception:
                    if uid not in dead_map:
                        dead_map[uid] = set()
                    dead_map[uid].add(ws)

        for uid, dead_set in dead_map.items():
            if uid in self.active_connections:
                for ws in dead_set:
                    self.active_connections[uid].discard(ws)

    def send_to_user_sync(self, user_id: str, message: Dict[str, Any]):
        """Thread-safe synchronous helper to schedule notification broadcast to a user."""
        try:
            loop = asyncio.get_event_loop()
            if loop.is_running():
                asyncio.create_task(self.send_to_user(user_id, message))
            else:
                loop.run_until_complete(self.send_to_user(user_id, message))
        except Exception:
            try:
                new_loop = asyncio.new_event_loop()
                new_loop.run_until_complete(self.send_to_user(user_id, message))
                new_loop.close()
            except Exception:
                pass

    def broadcast_all_sync(self, message: Dict[str, Any]):
        """Thread-safe synchronous helper to schedule system-wide broadcast."""
        try:
            loop = asyncio.get_event_loop()
            if loop.is_running():
                asyncio.create_task(self.broadcast_all(message))
            else:
                loop.run_until_complete(self.broadcast_all(message))
        except Exception:
            try:
                new_loop = asyncio.new_event_loop()
                new_loop.run_until_complete(self.broadcast_all(message))
                new_loop.close()
            except Exception:
                pass


notification_manager = NotificationManager()
