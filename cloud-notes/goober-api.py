# main.py
import os
import json
from typing import Dict, Any

# Cloud Functions (2nd gen) HTTP
import functions_framework
from flask import Request, make_response

# ================= Feature toggles =================
USE_FIRESTORE = os.getenv("USE_FIRESTORE", "1") == "1"   # read node labels/metadata from Firestore
USE_BIGQUERY = os.getenv("USE_BIGQUERY", "1") == "1"     # read edges (src,dst) from BigQuery
# ===================================================

# ==== BigQuery config (EDIT THESE OR SET AS ENV VARS) =========================
BQ_PROJECT_ID = os.getenv("BQ_PROJECT_ID", "graduation-goober")      # EDIT ME
BQ_DATASET = os.getenv("BQ_DATASET", "catalog")                      # EDIT ME
BQ_EDGES_TABLE = os.getenv("BQ_EDGES_TABLE", "course-edges")         # EDIT ME
# Edge column names (IDs required; labels optional)
EDGE_SRC_COL = os.getenv("EDGE_SRC_COL", "src")
EDGE_DST_COL = os.getenv("EDGE_DST_COL", "dst")
EDGE_SRC_LABEL_COL = os.getenv("EDGE_SRC_LABEL_COL", "")   # leave blank if none
EDGE_DST_LABEL_COL = os.getenv("EDGE_DST_LABEL_COL", "")   # leave blank if none
BQ_LOCATION = os.getenv("BQ_LOCATION", "")  # e.g., "US", "EU"; leave blank to default
# ============================================================================

# ==== Storage config (NEW) ============================================
BUCKET_NAME = os.getenv("BUCKET_NAME", "goober-example")   # EDIT/SET in Cloud Run/Functions env
# =====================================================================

FALLBACK_GRAPH = {
    "nodes":[
        {"id":"CS101","label":"CS101 Intro"},
        {"id":"CS102","label":"CS102 Data Structures"},
        {"id":"CS201","label":"CS201 Algorithms"}
    ],
    "edges":[
        {"from":"CS101","to":"CS102"},
        {"from":"CS102","to":"CS201"}
    ]
}

# ---------------- Data loaders ----------------

def _load_edges_from_bigquery() -> Dict[str, Any]:
    """Return (nodes_map, edges) inferred from BQ edges table."""
    from google.cloud import bigquery  # lazy import
    client = bigquery.Client(project=BQ_PROJECT_ID, location=BQ_LOCATION or None)

    edges = []
    nodes_map: Dict[str, str] = {}

    table_fqn = f"`{BQ_PROJECT_ID}.{BQ_DATASET}.{BQ_EDGES_TABLE}`"
    select_bits = [
        f"CAST({EDGE_SRC_COL} AS STRING) AS src",
        f"CAST({EDGE_DST_COL} AS STRING) AS dst",
    ]
    if EDGE_SRC_LABEL_COL:
        select_bits.append(f"CAST({EDGE_SRC_LABEL_COL} AS STRING) AS src_label")
    if EDGE_DST_LABEL_COL:
        select_bits.append(f"CAST({EDGE_DST_LABEL_COL} AS STRING) AS dst_label")
    query = f"SELECT {', '.join(select_bits)} FROM {table_fqn}"

    for row in client.query(query, location=BQ_LOCATION or None):
        s = row["src"]; d = row["dst"]
        s_label = (row.get("src_label") if hasattr(row, 'get') else None) or s
        d_label = (row.get("dst_label") if hasattr(row, 'get') else None) or d
        edges.append({"from": s, "to": d})
        if s not in nodes_map:
            nodes_map[s] = s_label
        if d not in nodes_map:
            nodes_map[d] = d_label

    return {"nodes_map": nodes_map, "edges": edges}


def _load_node_labels_from_firestore(existing_nodes: Dict[str, str]) -> Dict[str, str]:
    """Merge Firestore course titles into nodes map (id -> label)."""
    from google.cloud import firestore  # lazy import
    db = firestore.Client()
    nodes = dict(existing_nodes)
    for doc in db.collection("courses").stream():
        cid = doc.id
        title = (doc.to_dict() or {}).get("title")
        if title:
            nodes[cid] = title
    return nodes


def load_graph() -> Dict[str, Any]:
    """Combine **BigQuery edges** with **Firestore node labels** when available."""
    # 1) Preferred path: BigQuery edges
    if USE_BIGQUERY:
        try:
            bq = _load_edges_from_bigquery()
            nodes_map = bq["nodes_map"]
            edges = bq["edges"]
            # 1a) Enrich labels from Firestore if enabled
            if USE_FIRESTORE:
                try:
                    nodes_map = _load_node_labels_from_firestore(nodes_map)
                except Exception:
                    pass
            nodes = [{"id": nid, "label": nodes_map.get(nid, nid)} for nid in sorted(nodes_map.keys())]
            return {"nodes": nodes, "edges": edges}
        except Exception:
            pass

    # 2) Firestore-only fallback (derive edges from each course.prereqs)
    if USE_FIRESTORE:
        try:
            from google.cloud import firestore
            db = firestore.Client()
            courses = list(db.collection("courses").stream())
            nodes = [{"id": c.id, "label": (c.to_dict() or {}).get("title", c.id)} for c in courses]
            edges = []
            for c in courses:
                data = c.to_dict() or {}
                for p in data.get("prereqs", []):
                    edges.append({"from": p, "to": c.id})
            return {"nodes": nodes, "edges": edges}
        except Exception:
            pass

    # 3) Final fallback
    return FALLBACK_GRAPH

# ---------------- Upload helper (NEW) ----------------

def _upload_to_gcs(file_storage, dest_name: str) -> str:
    """Stream the uploaded file to GCS. Returns object path."""
    if not BUCKET_NAME:
        raise RuntimeError("BUCKET_NAME env var is not set")
    from google.cloud import storage  # lazy import
    client = storage.Client()
    bucket = client.bucket(BUCKET_NAME)
    blob = bucket.blob(dest_name)
    # werkzeug FileStorage supports .stream or .read via .stream
    blob.upload_from_file(
        file_storage.stream,
        rewind=True,
        content_type=file_storage.mimetype or "application/octet-stream",
    )
    return f"gs://{BUCKET_NAME}/{dest_name}"

# ---------------- HTTP responses ----------------

HTML = """<!doctype html><html><head><meta charset=\"utf-8\">
<title>Course Graph</title>
<script src=\"https://unpkg.com/vis-network/standalone/umd/vis-network.min.js\"></script>
<style>html,body{margin:0;height:100%} #m{width:100vw;height:100vh}</style>
</head><body><div id=\"m\"></div>
<script>
async function run(){
  const r = await fetch(window.location.pathname.replace(/\\/$/, '') + '/graph', {mode:'cors'});
  const data = await r.json();
  const nodes = new vis.DataSet(data.nodes);
  const edges = new vis.DataSet(data.edges);
  new vis.Network(document.getElementById('m'), {nodes, edges}, {interaction:{hover:true}});
}
run();
</script></body></html>"""

FRONTEND_ORIGIN = "https://graduation-goober.web.app"

def json_response(obj, status=200):
    body = json.dumps(obj)
    resp = make_response(body, status)
    resp.headers["Content-Type"] = "application/json"
    resp.headers["Access-Control-Allow-Origin"] = FRONTEND_ORIGIN
    resp.headers["Vary"] = "Origin"
    return resp

def html_response(body, status=200):
    resp = make_response(body, status)
    resp.headers["Content-Type"] = "text/html; charset=utf-8"
    resp.headers["Access-Control-Allow-Origin"] = FRONTEND_ORIGIN
    resp.headers["Vary"] = "Origin"
    return resp

def cors_preflight():
    resp = make_response("", 204)
    resp.headers["Access-Control-Allow-Origin"] = FRONTEND_ORIGIN
    resp.headers["Vary"] = "Origin"
    resp.headers["Access-Control-Allow-Methods"] = "GET,POST,OPTIONS"
    # include any custom headers you send (e.g., x-upload-token)
    resp.headers["Access-Control-Allow-Headers"] = "Content-Type,Authorization,x-upload-token"
    resp.headers["Access-Control-Max-Age"] = "3600"
    return resp

# ---------------- HTTP handler ----------------

@functions_framework.http
def api(request: Request):
    """Single entry point with simple routing."""
    path = (request.path or "/").rstrip("/")

    # --- CORS preflight for upload (NEW) ---
    if request.method == "OPTIONS":
        return cors_preflight()

    # graph JSON
    if path.endswith("/graph"):
        return json_response(load_graph())

    # --- Upload endpoint (NEW) ---
    if path.endswith("/upload") and request.method == "POST":
        # expecting multipart/form-data with a field named "file"
        if not request.files or "file" not in request.files:
            return json_response({"ok": False, "error": "missing file field"}, 400)

        file_storage = request.files["file"]
        dest_name = file_storage.filename or "upload.bin"

        try:
            gcs_uri = _upload_to_gcs(file_storage, dest_name)
            return json_response({"ok": True, "gcs_uri": gcs_uri, "object": dest_name})
        except Exception as e:
            return json_response({"ok": False, "error": str(e)}, 500)


    # default to the HTML viewer
    return html_response(HTML)
