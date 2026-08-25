"""
scripts/ingest_faq.py

Reads markdown files from backend/docs/faq/ and ingests them into the 
'insightgov_faq' ChromaDB collection for the chatbot's RAG pipeline.

Run this script directly from the backend directory:
    python -m scripts.ingest_faq
"""

import glob
import os
import chromadb
import requests
import json
from config import settings

FAQ_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "docs", "faq")
FAQ_COLLECTION = "insightgov_faq"

def embed_text(text: str) -> list[float]:
    """Generates an embedding vector using Ollama."""
    ollama_url = f"{settings.ollama_base_url}/api/embeddings"
    payload = {
        "model": "nomic-embed-text",
        "prompt": text
    }
    response = requests.post(ollama_url, json=payload, timeout=30)
    response.raise_for_status()
    data = response.json()
    return data["embedding"]

def main():
    print(f"Loading ChromaDB from {settings.chroma_faq_path} ...")
    os.makedirs(settings.chroma_faq_path, exist_ok=True)
    
    # Initialize chroma client for FAQ
    client = chromadb.PersistentClient(path=str(settings.chroma_faq_path))
    
    # Recreate collection to avoid stale data
    try:
        client.delete_collection(FAQ_COLLECTION)
    except Exception:
        pass
        
    collection = client.create_collection(FAQ_COLLECTION)
    
    faq_files = glob.glob(os.path.join(FAQ_DIR, "*.md"))
    if not faq_files:
        print("No FAQ markdown files found.")
        return

    docs = []
    metadatas = []
    ids = []
    embeddings = []

    for idx, file_path in enumerate(faq_files):
        filename = os.path.basename(file_path)
        print(f"Processing {filename}...")
        
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read().strip()
            
        if not content:
            continue
            
        docs.append(content)
        metadatas.append({"source": filename, "type": "faq"})
        ids.append(f"faq_{idx}")
        
        # In a real app we'd chunk this, but for short FAQs we embed the whole file
        emb = embed_text(content)
        embeddings.append(emb)

    if docs:
        print(f"Adding {len(docs)} documents to {FAQ_COLLECTION} collection...")
        collection.add(
            documents=docs,
            embeddings=embeddings,
            metadatas=metadatas,
            ids=ids
        )
        print("Ingestion complete.")
    else:
        print("No content to ingest.")

if __name__ == "__main__":
    main()
