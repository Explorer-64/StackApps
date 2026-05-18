import logging
from datetime import datetime
from typing import Any

from firebase_admin import firestore
from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import PlainTextResponse

from .mcp_registry_seed import MCP_REGISTRY_STUB_DOCUMENTS, attach_created_at

CURRENT_STUB_IDS = {doc["server_id"] for doc in MCP_REGISTRY_STUB_DOCUMENTS}


def seed_mcp_registry():
    """Seed mcp_servers with stubs. Re-seeds any doc missing blueprint_text.
    Removes Firestore docs whose server_id is no longer in the stub list."""
    try:
        db = firestore.client()
        coll = db.collection("mcp_servers")
        ts = datetime.utcnow().isoformat()

        # Always refresh stub documents; skip only real registered servers (is_stub: False)
        seeded = 0
        for stub in MCP_REGISTRY_STUB_DOCUMENTS:
            sid = stub["server_id"]
            doc_ref = coll.document(sid)
            existing = doc_ref.get()
            if existing.exists and not (existing.to_dict() or {}).get("is_stub", True):
                continue
            doc_ref.set(attach_created_at(stub, ts))
            seeded += 1

        # Remove stale docs no longer in the stub list
        removed = 0
        for snap in coll.stream():
            if snap.id not in CURRENT_STUB_IDS:
                coll.document(snap.id).delete()
                removed += 1

        if seeded or removed:
            logging.info(f"MCP registry: seeded/updated {seeded}, removed {removed} stale stubs")
        else:
            logging.info("MCP registry stubs are up to date")
    except Exception as e:
        logging.error(f"Error seeding MCP registry: {e}")


mcp_registry_router = APIRouter(prefix="/api")


def _doc_matches(data: dict, q_lower: str) -> bool:
    if q_lower in (data.get("server_id") or "").lower():
        return True
    if q_lower in (data.get("app_name") or "").lower():
        return True
    if q_lower in (data.get("description") or "").lower():
        return True
    for t in data.get("tools") or []:
        if q_lower in (t.get("name") or "").lower():
            return True
        if q_lower in (t.get("description") or "").lower():
            return True
    return False


@mcp_registry_router.get("/mcp-registry/search")
async def search_mcp_registry(q: str = Query(..., min_length=1)):
    q_lower = q.lower()
    db = firestore.client()
    servers: list[dict[str, Any]] = []
    for snap in db.collection("mcp_servers").stream():
        data = snap.to_dict() or {}
        if _doc_matches(data, q_lower):
            tools = data.get("tools") or []
            servers.append({
                "server_id": data.get("server_id", snap.id),
                "app_name": data.get("app_name"),
                "description": data.get("description"),
                "blueprint_url": data.get("blueprint_url"),
                "app_url": data.get("app_url"),
                "tool_count": len(tools),
            })
        if len(servers) >= 10:
            break
    return {"servers": servers[:10]}


TEST_CANDIDATE_IDS = ["imagcon", "brand-kit", "image-gen-tools", "vector-icon-pack", "pwa-toolkit"]


@mcp_registry_router.get("/mcp-registry/test-candidates")
async def get_test_candidates():
    db = firestore.client()
    candidates = []
    for sid in TEST_CANDIDATE_IDS:
        doc = db.collection("mcp_servers").document(sid).get()
        if not doc.exists:
            continue
        data = doc.to_dict() or {}
        base = (data.get("app_url") or "").rstrip("/") + "/"
        candidates.append({
            "server_id": data.get("server_id", sid),
            "app_name": data.get("app_name"),
            "description": data.get("description"),
            "app_url": base,
            "app_url_bp": base.replace("/stubs/", "/stubs-bp/"),
            "tool_count": len(data.get("tools") or []),
        })
    return {"candidates": candidates}


@mcp_registry_router.get("/mcp-registry/servers/{server_id}/tools")
async def get_mcp_server_tools(server_id: str):
    db = firestore.client()
    doc = db.collection("mcp_servers").document(server_id).get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="MCP server not found")
    data = doc.to_dict() or {}
    return {
        "server_id": data.get("server_id", server_id),
        "app_name": data.get("app_name"),
        "description": data.get("description"),
        "blueprint_url": data.get("blueprint_url"),
        "tools": data.get("tools") or [],
    }


@mcp_registry_router.get("/mcp-registry/servers/{server_id}/blueprint")
async def get_mcp_server_blueprint(server_id: str):
    db = firestore.client()
    doc = db.collection("mcp_servers").document(server_id).get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="MCP server not found")
    blueprint_text = (doc.to_dict() or {}).get("blueprint_text", "")
    if not blueprint_text:
        raise HTTPException(status_code=404, detail="Blueprint not available for this server")
    return PlainTextResponse(content=blueprint_text, media_type="text/plain; charset=utf-8")
