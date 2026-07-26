"""
utils/chroma_client.py – Singleton accessor for the ChromaDB petitions collection.

The collection uses cosine distance so that similarity = 1 - distance.
Call get_collection() anywhere in the service layer to obtain the shared collection.
"""

import chromadb
from config import CHROMA_PERSIST_DIR
from utils.logger import get_logger

logger = get_logger(__name__)

_collection: chromadb.Collection | None = None


def get_collection() -> chromadb.Collection:
    """
    Return the shared ChromaDB 'petitions' collection.

    Initialised once on first call using a persistent local client.
    Subsequent calls return the cached collection.
    """
    global _collection

    if _collection is None:
        client = chromadb.PersistentClient(path=CHROMA_PERSIST_DIR)
        _collection = client.get_or_create_collection(
            name="petitions",
            metadata={"hnsw:space": "cosine"},
        )
        logger.info(
            f"ChromaDB collection 'petitions' ready "
            f"(path={CHROMA_PERSIST_DIR}, count={_collection.count()})"
        )

    return _collection
