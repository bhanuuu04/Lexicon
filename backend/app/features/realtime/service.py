import asyncio
import json
import logging
from typing import Dict, Any, Set
from datetime import datetime, timezone

logger = logging.getLogger("LexiconRealtime")
logger.setLevel(logging.INFO)

class RealtimeBroadcaster:
    def __init__(self):
        self._subscribers: Set[asyncio.Queue] = set()

    async def subscribe(self) -> asyncio.Queue:
        q = asyncio.Queue(maxsize=100)
        self._subscribers.add(q)
        # Send initial ping
        await q.put({
            "type": "CONNECTED",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "message": "Lexicon Realtime Engine connected."
        })
        return q

    def unsubscribe(self, q: asyncio.Queue):
        if q in self._subscribers:
            self._subscribers.remove(q)

    def broadcast(self, event_type: str, data: Dict[str, Any]):
        """
        Synchronously broadcast event to all async subscribers.
        """
        event = {
            "type": event_type,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "data": data
        }
        dead_queues = set()
        for q in self._subscribers:
            try:
                q.put_nowait(event)
            except asyncio.QueueFull:
                dead_queues.add(q)
            except Exception as e:
                logger.warning(f"Failed to push realtime event: {e}")
                dead_queues.add(q)

        for dq in dead_queues:
            if dq in self._subscribers:
                self._subscribers.remove(dq)

realtime_broadcaster = RealtimeBroadcaster()
