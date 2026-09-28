"""In-memory storage with an abstract interface.

Architecture:
    Route -> Service -> StorageService (ABC) -> MemoryStorageService

To add PostgreSQL later, create PostgresStorageService(StorageService)
and swap the object returned by get_store() -- routes/services stay unchanged.
Video frames are kept in RAM (latest frame per rover only) so memory stays flat.
"""
import threading
from abc import ABC, abstractmethod
from collections import defaultdict, deque
from datetime import datetime, timezone
from typing import Any, Deque, Dict, List, Optional, Tuple

MAX_HISTORY = 200
MAX_IMAGES = 50


class StorageService(ABC):
    """Abstract storage interface. Services depend only on this."""

    # gas
    @abstractmethod
    def save_gas(self, rover_id: str, record: Dict[str, Any]) -> Dict[str, Any]: ...
    @abstractmethod
    def get_gas_latest(self, rover_id: str) -> Optional[Dict[str, Any]]: ...
    @abstractmethod
    def get_gas_history(self, rover_id: str, limit: int = 50) -> List[Dict[str, Any]]: ...

    # temperature
    @abstractmethod
    def save_temperature(self, rover_id: str, record: Dict[str, Any]) -> Dict[str, Any]: ...
    @abstractmethod
    def get_temperature_latest(self, rover_id: str) -> Optional[Dict[str, Any]]: ...
    @abstractmethod
    def get_temperature_history(self, rover_id: str, limit: int = 50) -> List[Dict[str, Any]]: ...

    # model predictions
    @abstractmethod
    def save_prediction(self, rover_id: str, record: Dict[str, Any]) -> Dict[str, Any]: ...
    @abstractmethod
    def get_prediction_latest(self, rover_id: str) -> Optional[Dict[str, Any]]: ...
    @abstractmethod
    def get_prediction_history(self, rover_id: str, limit: int = 50) -> List[Dict[str, Any]]: ...

    # png images (metadata only; files live in uploads/images/)
    @abstractmethod
    def save_image(self, rover_id: str, meta: Dict[str, Any]) -> Dict[str, Any]: ...
    @abstractmethod
    def get_images(self, rover_id: str, limit: int = 20) -> List[Dict[str, Any]]: ...

    # live video (latest frame bytes per rover)
    @abstractmethod
    def save_frame(self, rover_id: str, data: bytes, meta: Dict[str, Any]) -> Dict[str, Any]: ...
    @abstractmethod
    def get_frame(self, rover_id: str) -> Optional[Tuple[Dict[str, Any], bytes]]: ...

    @abstractmethod
    def get_rover_ids(self) -> List[str]: ...
    @abstractmethod
    def counts(self) -> Dict[str, int]: ...
    @abstractmethod
    def reset(self) -> None: ...


class MemoryStorageService(StorageService):
    def __init__(self) -> None:
        self._lock = threading.Lock()
        self.start_time: datetime = datetime.now(timezone.utc)
        self.last_data_received: Optional[datetime] = None
        self._gas: Dict[str, Deque[Dict[str, Any]]] = defaultdict(lambda: deque(maxlen=MAX_HISTORY))
        self._temp: Dict[str, Deque[Dict[str, Any]]] = defaultdict(lambda: deque(maxlen=MAX_HISTORY))
        self._pred: Dict[str, Deque[Dict[str, Any]]] = defaultdict(lambda: deque(maxlen=MAX_HISTORY))
        self._images: Dict[str, Deque[Dict[str, Any]]] = defaultdict(lambda: deque(maxlen=MAX_IMAGES))
        self._frames: Dict[str, Dict[str, Any]] = {}  # rover_id -> {"meta": ..., "data": bytes}
        self._frame_count: Dict[str, int] = defaultdict(int)

    def _touch(self) -> None:
        self.last_data_received = datetime.now(timezone.utc)

    def _save(self, store: Dict[str, Deque], rover_id: str, record: Dict[str, Any]) -> Dict[str, Any]:
        with self._lock:
            store[rover_id].append(record)
            self._touch()
            return record

    def _latest(self, store: Dict[str, Deque], rover_id: str) -> Optional[Dict[str, Any]]:
        with self._lock:
            items = store.get(rover_id, [])
            return items[-1] if items else None

    def _history(self, store: Dict[str, Deque], rover_id: str, limit: int) -> List[Dict[str, Any]]:
        with self._lock:
            items = list(store.get(rover_id, []))
            return items[-limit:] if limit > 0 else items

    # gas
    def save_gas(self, rover_id: str, record: Dict[str, Any]) -> Dict[str, Any]:
        return self._save(self._gas, rover_id, record)

    def get_gas_latest(self, rover_id: str) -> Optional[Dict[str, Any]]:
        return self._latest(self._gas, rover_id)

    def get_gas_history(self, rover_id: str, limit: int = 50) -> List[Dict[str, Any]]:
        return self._history(self._gas, rover_id, limit)

    # temperature
    def save_temperature(self, rover_id: str, record: Dict[str, Any]) -> Dict[str, Any]:
        return self._save(self._temp, rover_id, record)

    def get_temperature_latest(self, rover_id: str) -> Optional[Dict[str, Any]]:
        return self._latest(self._temp, rover_id)

    def get_temperature_history(self, rover_id: str, limit: int = 50) -> List[Dict[str, Any]]:
        return self._history(self._temp, rover_id, limit)

    # predictions
    def save_prediction(self, rover_id: str, record: Dict[str, Any]) -> Dict[str, Any]:
        return self._save(self._pred, rover_id, record)

    def get_prediction_latest(self, rover_id: str) -> Optional[Dict[str, Any]]:
        return self._latest(self._pred, rover_id)

    def get_prediction_history(self, rover_id: str, limit: int = 50) -> List[Dict[str, Any]]:
        return self._history(self._pred, rover_id, limit)

    # images
    def save_image(self, rover_id: str, meta: Dict[str, Any]) -> Dict[str, Any]:
        return self._save(self._images, rover_id, meta)

    def get_images(self, rover_id: str, limit: int = 20) -> List[Dict[str, Any]]:
        return self._history(self._images, rover_id, limit)

    # video frames (latest only)
    def save_frame(self, rover_id: str, data: bytes, meta: Dict[str, Any]) -> Dict[str, Any]:
        with self._lock:
            self._frame_count[rover_id] += 1
            meta = {**meta, "frame_count": self._frame_count[rover_id]}
            self._frames[rover_id] = {"meta": meta, "data": data}
            self._touch()
            return meta

    def get_frame(self, rover_id: str) -> Optional[Tuple[Dict[str, Any], bytes]]:
        with self._lock:
            entry = self._frames.get(rover_id)
            if not entry:
                return None
            return entry["meta"], entry["data"]

    def get_rover_ids(self) -> List[str]:
        with self._lock:
            ids = set(self._gas) | set(self._temp) | set(self._pred) | set(self._images) | set(self._frames)
            return sorted(ids)

    def counts(self) -> Dict[str, int]:
        with self._lock:
            return {
                "rovers": len(set(self._gas) | set(self._temp) | set(self._pred) | set(self._images) | set(self._frames)),
                "gas_readings": sum(len(v) for v in self._gas.values()),
                "temperature_readings": sum(len(v) for v in self._temp.values()),
                "predictions": sum(len(v) for v in self._pred.values()),
                "images": sum(len(v) for v in self._images.values()),
                "video_rovers": len(self._frames),
            }

    def reset(self) -> None:
        with self._lock:
            self._gas.clear()
            self._temp.clear()
            self._pred.clear()
            self._images.clear()
            self._frames.clear()
            self._frame_count.clear()
            self.start_time = datetime.now(timezone.utc)
            self.last_data_received = None


# Singleton used by services. Swap for PostgresStorageService later.
store: MemoryStorageService = MemoryStorageService()


def get_store() -> StorageService:
    return store
