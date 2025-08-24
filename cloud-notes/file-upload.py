import json
import logging
import os
import tempfile
from typing import Any, List, Optional

import functions_framework

from google.cloud import storage
from google.cloud import firestore
from google.cloud import bigquery
from pypdf import PdfReader

# 👉 Gen AI SDK (class-based schema support)
from google import genai
from pydantic import BaseModel, Field


# =======================
# Config / Clients
# =======================
PROJECT_ID = "graduation-goober"
LOCATION = os.environ.get("LOCATION", "us-central1")  # Vertex region (e.g., us-central1)
MODEL_NAME = os.environ.get("MODEL_NAME", "gemini-2.5-flash-lite")  # or gemini-2.0-flash if enabled

# Optional: BigQuery table to stream edges ("project.dataset.table")
BQ_TABLE = PROJECT_ID + ".catalog.course-edges"
# TODO
logging.basicConfig(level=logging.INFO)
logging.info(f"BQ_DEBUG: PROJECT_ID={PROJECT_ID}, BQ_TABLE={BQ_TABLE}")

# Firestore (Native mode)
FS = firestore.Client(project=PROJECT_ID)

# Storage
STORAGE = storage.Client(project=PROJECT_ID)

# BigQuery (lazy init)
BQ = None

# Vertex-backed GenAI client (uses service account auth inside Cloud Functions)
GENAI = genai.Client(vertexai=True, project=PROJECT_ID, location=LOCATION)


# =======================
# Pydantic response classes
# =======================
class Course(BaseModel):
    course_id: str = Field(..., description="Dept code + number as shown in catalog, e.g., 'CS 101'")
    title: str
    units: int
    prereqs: List[str]
    coreqs: List[str]


class Catalog(BaseModel):
    courses: List[Course]


# =======================
# Helpers
# =======================
def _download_blob_to_tmp(bucket_name: str, blob_name: str) -> str:
    bucket = STORAGE.bucket(bucket_name)
    blob = bucket.blob(blob_name)
    fd, tmp_path = tempfile.mkstemp(suffix=os.path.splitext(blob_name)[-1] or ".pdf")
    os.close(fd)
    blob.download_to_filename(tmp_path)
    logging.info(f"Downloaded gs://{bucket_name}/{blob_name} -> {tmp_path}")
    return tmp_path


def _extract_text_from_pdf(path: str, max_chars: int = 500_000) -> str:
    """Extract text; cap length to avoid oversized prompts."""
    reader = PdfReader(path)
    buf = []
    for page in reader.pages:
        try:
            t = page.extract_text() or ""
            buf.append(t)
            if sum(len(x) for x in buf) >= max_chars:
                break
        except Exception as e:
            logging.warning(f"PDF text extract error: {e}")
    text = "\n".join(buf)
    logging.info(f"Extracted ~{len(text)} chars from PDF.")
    return text


def _chunk(s: str, size: int = 180_000, overlap: int = 2_000) -> List[str]:
    """Simple conservative chunking for very long texts (keeps context overlap)."""
    if len(s) <= size:
        return [s]
    chunks = []
    i = 0
    while i < len(s):
        chunks.append(s[i:i + size])
        i += size - overlap
    return chunks


def _gen_prompt(chunk_text: str) -> str:
    return (
        "Extract course data from the catalog text into the provided schema.\n"
        "Rules:\n"
        " - Only fields defined in the schema (no extras)\n"
        " - 'units' must be an integer\n"
        " - Use [] for empty prereqs/coreqs\n\n"
        "Catalog text:\n" + chunk_text
    )


def _call_gemini_with_class(text: str) -> Catalog:
    """
    Call Gemini with a class-based response schema.
    Returns a Catalog; if parsing fails, falls back to empty Catalog.
    """
    # For very long catalogs, process the first chunk that yields a non-empty result.
    for chunk in _chunk(text):
        resp = GENAI.models.generate_content(
            model=MODEL_NAME,
            contents=_gen_prompt(chunk),
            config={
                "temperature": 0.2,
                "response_mime_type": "application/json",
                "response_schema": Catalog,  # 👈 pass the class!
            },
        )

        # Prefer typed objects; if validators aren’t enforced, .parsed may be None.
        catalog: Optional[Catalog] = getattr(resp, "parsed", None)
        if catalog and catalog.courses:
            return catalog

        # Fallback: try to parse JSON text into Catalog manually
        try:
            data = json.loads(resp.text or "{}")
            catalog = Catalog.model_validate(data)
            if catalog.courses:
                return catalog
        except Exception as e:
            logging.warning(f"Fallback JSON parse failed on this chunk: {e}")

    logging.info("No courses extracted by model; returning empty Catalog.")
    return Catalog(courses=[])


def _write_to_firestore(courses: List[Course]) -> None:
    batch = FS.batch()
    count = 0
    for c in courses:
        cid = c.course_id.strip()
        if not cid:
            continue
        doc = {
            "course_id": cid,
            "title": c.title.strip(),
            "units": int(c.units or 0),
            "prereqs": [str(x).strip() for x in (c.prereqs or [])],
            "coreqs": [str(x).strip() for x in (c.coreqs or [])],
        }
        doc_ref = FS.collection("courses").document(cid)
        batch.set(doc_ref, doc, merge=True)
        count += 1
    batch.commit()
    logging.info(f"Wrote {count} course docs to Firestore.")


def _write_edges_to_bigquery(courses: List[Course]) -> None:
    global BQ
    if not BQ_TABLE:
        return
    if BQ is None:
        BQ = bigquery.Client(project=PROJECT_ID)

    rows = []
    for c in courses:
        dst = c.course_id
        for p in c.prereqs or []:
            rows.append({"src": str(p), "dst": str(dst), "kind": "prereq"})
        for q in c.coreqs or []:
            rows.append({"src": str(q), "dst": str(dst), "kind": "coreq"})

    if not rows:
        logging.info("No edges to write to BigQuery.")
        return

    errors = BQ.insert_rows_json(BQ_TABLE, rows)
    if errors:
        logging.error(f"BigQuery insert errors: {errors}")
    else:
        logging.info(f"Wrote {len(rows)} edges to {BQ_TABLE}.")


# =======================
# CloudEvent entrypoint
# =======================
@functions_framework.cloud_event
def gcs_file_to_courses(event):
    """
    Trigger: Cloud Storage (finalize)
    Env:
      - LOCATION (default: us-central1)
      - MODEL_NAME (default: gemini-1.5-pro)
      - BQ_TABLE (optional, project.dataset.table)
    IAM (service account):
      - Vertex AI User (for genai Vertex backend)
      - Storage Object Viewer
      - Firestore User
      - BigQuery Data Editor (if BQ is used)
    """
    data = event.data
    bucket = data.get("bucket")
    name = data.get("name")
    if not bucket or not name:
        logging.warning("Missing bucket or object name in event.")
        return
    if not name.lower().endswith(".pdf"):
        logging.info(f"Skipping non-PDF object: {name}")
        return

    try:
        local_path = _download_blob_to_tmp(bucket, name)
        text = _extract_text_from_pdf(local_path)

        catalog = _call_gemini_with_class(text)
        if not catalog.courses:
            logging.info("No courses extracted; nothing to write.")
            return

        _write_to_firestore(catalog.courses)
        _write_edges_to_bigquery(catalog.courses)

        logging.info(f"Done: gs://{bucket}/{name}")
    except Exception as e:
        logging.exception(f"Unhandled error processing {name}: {e}")
        # Re-raise if you prefer retries:
        # raise
