"""
scripts/ingest_faq.py

Reads markdown files from backend/docs/faq/ and ingests them into the 
'insightgov_faq' ChromaDB collection for the chatbot's RAG pipeline
using the hosted embedding provider abstraction.

Run directly from the backend directory:
    python -m scripts.ingest_faq
or from the workspace root:
    python -m backend.scripts.ingest_faq
"""
from __future__ import annotations

import asyncio
import glob
import os
import re
import sys

# Ensure backend root is on sys.path
_current_dir = os.path.dirname(os.path.abspath(__file__))
_backend_dir = os.path.dirname(_current_dir)
if _backend_dir not in sys.path:
    sys.path.insert(0, _backend_dir)

import chromadb
from config import settings
from services.embedding_providers import get_embedding_provider

FAQ_DIR = os.path.join(_backend_dir, "docs", "faq")
FAQ_COLLECTION = "insightgov_faq"


def extract_title_and_sections(content: str, filename: str) -> list[dict[str, str]]:
    """
    Split markdown document into logical chunks by H2/H3 headers or return single document.
    Ensures chunks have clear titles and context.
    """
    lines = content.strip().split("\n")
    main_title = filename.replace(".md", "").replace("_", " ").title()
    for line in lines:
        if line.startswith("# "):
            main_title = line[2:].strip()
            break

    # If document is short (< 1500 chars), treat as one chunk
    if len(content) < 1500:
        return [{
            "title": main_title,
            "section": "General",
            "content": content,
        }]

    # Otherwise split by headers (## or ###)
    sections = []
    current_section = "Overview"
    current_lines: list[str] = []

    for line in lines:
        if line.startswith("## ") or line.startswith("### "):
            if current_lines:
                chunk_text = "\n".join(current_lines).strip()
                if chunk_text:
                    sections.append({
                        "title": main_title,
                        "section": current_section,
                        "content": f"# {main_title} — {current_section}\n\n{chunk_text}",
                    })
                current_lines = []
            current_section = line.lstrip("#").strip()
        else:
            current_lines.append(line)

    if current_lines:
        chunk_text = "\n".join(current_lines).strip()
        if chunk_text:
            sections.append({
                "title": main_title,
                "section": current_section,
                "content": f"# {main_title} — {current_section}\n\n{chunk_text}",
            })

    return sections if sections else [{
        "title": main_title,
        "section": "General",
        "content": content,
    }]


async def run_ingestion():
    print(f"Loading ChromaDB for FAQ from {settings.chroma_faq_path} ...")
    os.makedirs(settings.chroma_faq_path, exist_ok=True)

    client = chromadb.PersistentClient(path=str(settings.chroma_faq_path))

    # Recreate collection to ensure clean state with latest embeddings
    try:
        client.delete_collection(FAQ_COLLECTION)
    except Exception:
        pass

    collection = client.create_collection(
        name=FAQ_COLLECTION,
        metadata={"hnsw:space": "cosine"}
    )

    faq_files = sorted(glob.glob(os.path.join(FAQ_DIR, "*.md")))
    if not faq_files:
        print(f"No FAQ markdown files found in {FAQ_DIR}.")
        return

    provider = get_embedding_provider()
    print(f"Using embedding provider: {type(provider).__name__}")

    all_chunks: list[dict[str, str]] = []
    docs: list[str] = []
    metadatas: list[dict] = []
    ids: list[str] = []

    chunk_counter = 0
    for file_path in faq_files:
        filename = os.path.basename(file_path)
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read().strip()

        if not content:
            continue

        chunks = extract_title_and_sections(content, filename)
        for chunk in chunks:
            chunk_id = f"faq_{chunk_counter:04d}"
            chunk_counter += 1
            docs.append(chunk["content"])
            metadatas.append({
                "source": filename,
                "title": chunk["title"],
                "section": chunk["section"],
                "type": "official_guidance",
            })
            ids.append(chunk_id)

    print(f"Extracted {len(docs)} knowledge chunks across {len(faq_files)} documents.")
    print("Generating embeddings via hosted provider...")

    embeddings = await provider.embed_documents(docs)

    if len(embeddings) != len(docs):
        raise ValueError(f"Embedding count mismatch: {len(embeddings)} vs {len(docs)}")

    print(f"Adding {len(docs)} documents to ChromaDB collection '{FAQ_COLLECTION}'...")
    collection.add(
        documents=docs,
        embeddings=embeddings,
        metadatas=metadatas,
        ids=ids,
    )
    print(f"Knowledge ingestion complete! Total vectors indexed: {collection.count()}")


def main():
    asyncio.run(run_ingestion())


if __name__ == "__main__":
    main()
