"""Re-export storage access so services/routes depend on the abstraction."""
from data.memory_store import StorageService, get_store, store

__all__ = ["StorageService", "get_store", "store"]
