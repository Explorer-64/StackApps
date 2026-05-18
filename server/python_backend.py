import asyncio
import os
import json
import logging
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Optional

import firebase_admin
from firebase_admin import credentials, firestore
from fastapi import FastAPI, APIRouter, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# NOTE: This file is intentionally "shared setup + small endpoints only".
# The larger endpoint groups live in: ratings.py, moderation.py, uploads.py.


def initialize_firebase():
    if firebase_admin._apps:
        return

    service_account_key = os.environ.get("FIREBASE_SERVICE_ACCOUNT_KEY")
    if service_account_key:
        try:
            cred_dict = json.loads(service_account_key)
            cred = credentials.Certificate(cred_dict)
            firebase_admin.initialize_app(cred, {
                'storageBucket': os.environ.get("FIREBASE_STORAGE_BUCKET", "")
            })
            logging.info("Firebase initialized successfully with service account")
        except Exception as e:
            logging.error(f"Error initializing Firebase: {e}")
            raise
    else:
        logging.info("Warning: FIREBASE_SERVICE_ACCOUNT_KEY not found")


initialize_firebase()


app = FastAPI()
router = APIRouter(prefix="/api")


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def verify_firebase_token(authorization: Optional[str] = None):
    if not authorization or not authorization.startswith("Bearer "):
        return None

    token = authorization.replace("Bearer ", "")
    try:
        from firebase_admin import auth
        decoded_token = auth.verify_id_token(token)
        return decoded_token
    except Exception as e:
        logging.error(f"Token verification failed: {e}")
        return None

class RateAppRequest(BaseModel):
    appId: str
    rating: int
    comment: str
    userName: Optional[str] = None
    userAvatarUrl: Optional[str] = None

class RateAppResponse(BaseModel):
    success: bool
    newAverageRating: float
    newRatingCount: int

class VerifyRequest(BaseModel):
    url: str
    description: str

class VerifyResponse(BaseModel):
    is_reachable: bool
    status_code: int
    title: Optional[str] = None
    ai_summary: Optional[str] = None
    relevance_score: Optional[int] = None
    issues: list = []
    broken_links: int = 0
    broken_images: int = 0
    total_links_checked: int = 0
    total_images_checked: int = 0

class UploadImageResponse(BaseModel):
    url: str
    filename: str

class ModerateAppRequest(BaseModel):
    appId: str
    name: str
    description: str
    appUrl: str
    category: Optional[str] = None
    tags: Optional[list] = None

class ReportAppRequest(BaseModel):
    appId: str
    appName: str
    appUrl: str
    reason: str
    details: Optional[str] = None

@router.post("/report-app")
async def report_app(request: ReportAppRequest, authorization: Optional[str] = Header(None)):
    user = verify_firebase_token(authorization)
    if not user:
        raise HTTPException(status_code=401, detail="Unauthorized")

    db = firestore.client()
    db.collection("feedback").add({
        "type": "app_report",
        "appId": request.appId,
        "appName": request.appName,
        "appUrl": request.appUrl,
        "reportedBy": user["uid"],
        "reason": request.reason,
        "details": request.details or "",
        "createdAt": datetime.utcnow().isoformat(),
    })

    return {"success": True}


@router.get("/health")
async def health():
    return {"status": "ok", "firebase": firebase_admin._apps is not None}

# ===== Multi-App Hub Endpoints =====
# These endpoints exist to serve external Stack app integrations (e.g. StackSpent/StackStock).

DEFAULT_EXPENSE_CATEGORIES = [
    "Payroll",
    "Utilities", 
    "Rent",
    "Insurance",
    "Marketing",
    "Office Supplies",
    "Software Subscriptions",
    "Travel",
    "Professional Services",
    "Equipment"
]

def seed_bookkeeping_config():
    """Seed the bookkeeping config with default categories if not exists"""
    try:
        db = firestore.client()
        cfg_ref = db.collection('app_metadata').document('bookkeeping_config')
        cfg_doc = cfg_ref.get()
        
        if not cfg_doc.exists:
            cfg_ref.set({
                'categories': DEFAULT_EXPENSE_CATEGORIES,
                'updatedAt': datetime.utcnow().isoformat()
            })
            logging.info("Bookkeeping config seeded with default categories")
        else:
            logging.info("Bookkeeping config already exists")
    except Exception as e:
        logging.error(f"Error seeding bookkeeping config: {e}")

# Seed on startup
seed_bookkeeping_config()

@router.get("/bookkeeping-categories")
async def get_bookkeeping_categories(authorization: Optional[str] = Header(None)):
    """Get the global bookkeeping expense categories"""
    user = verify_firebase_token(authorization)
    if not user:
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    try:
        db = firestore.client()
        cfg_ref = db.collection('app_metadata').document('bookkeeping_config')
        cfg_doc = cfg_ref.get()
        
        if cfg_doc.exists:
            data = cfg_doc.to_dict()
            return {"categories": data.get("categories", DEFAULT_EXPENSE_CATEGORIES)}
        else:
            return {"categories": DEFAULT_EXPENSE_CATEGORIES}
    except Exception as e:
        logging.error(f"Error fetching categories: {e}")
        return {"categories": DEFAULT_EXPENSE_CATEGORIES}

class McpBlueprintTestRequest(BaseModel):
    model: str = "claude"


class McpBlueprintResultsSave(BaseModel):
    model: str
    result: dict[str, Any]


_VALID_MODELS = {"claude", "gemini", "grok", "gpt4o"}


@router.post("/mcp-blueprint-results")
async def save_mcp_blueprint_results(
    body: McpBlueprintResultsSave,
    authorization: Optional[str] = Header(None),
):
    user = verify_firebase_token(authorization)
    if not user:
        raise HTTPException(status_code=401, detail="Unauthorized")

    db = firestore.client()
    doc_ref = db.collection("mcp_blueprint_test_runs").document()
    saved_at = datetime.now(timezone.utc).isoformat()
    doc_ref.set({
        "model": body.model.strip(),
        "result": body.result,
        "savedAt": saved_at,
        "savedBy": user["uid"],
    })

    return {"id": doc_ref.id}


@router.get("/mcp-blueprint-results")
async def list_mcp_blueprint_results():
    db = firestore.client()
    q = (
        db.collection("mcp_blueprint_test_runs")
        .order_by("savedAt", direction=firestore.Query.DESCENDING)
    )

    rows: list[dict[str, Any]] = []
    for doc in q.stream():
        data = doc.to_dict() or {}
        row = dict(data)
        row["id"] = doc.id
        rows.append(row)

    return rows


@router.get("/mcp-blueprint-results/{run_id}")
async def get_mcp_blueprint_results(run_id: str):
    db = firestore.client()
    doc = db.collection("mcp_blueprint_test_runs").document(run_id).get()

    if not doc.exists:
        raise HTTPException(status_code=404, detail="Not found")

    data = doc.to_dict() or {}
    return {**data, "id": doc.id}

@router.post("/mcp-blueprint-test")
async def run_mcp_blueprint_test_endpoint(
    request: McpBlueprintTestRequest,
    authorization: Optional[str] = Header(None),
) -> Any:
    user = verify_firebase_token(authorization)
    if not user:
        raise HTTPException(status_code=401, detail="Unauthorized")

    model = request.model.strip().lower()
    if model not in _VALID_MODELS:
        raise HTTPException(status_code=400, detail=f"Model must be one of: {', '.join(_VALID_MODELS)}")

    from .mcp_test import run_mcp_blueprint_test

    FIXED_TASK = (
        "Generate a complete set of PWA icons for a recipe app — all required sizes, maskable "
        "variants, iOS icons, Android icons, and manifest.json, packaged and ready to deploy."
    )

    try:
        result = await asyncio.wait_for(
            run_mcp_blueprint_test(task=FIXED_TASK, model=model),
            timeout=600.0,
        )
    except asyncio.TimeoutError:
        raise HTTPException(status_code=504, detail="Test timed out after 600 seconds.")
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))

    return result


from .ratings import ratings_router
from .moderation import moderation_router
from .uploads import uploads_router
from .stacklaunch import router as stacklaunch_router
from .mcp_registry import mcp_registry_router, seed_mcp_registry
from .mcp_stubs import mcp_stubs_bp_router, mcp_stubs_router

app.include_router(router)
app.include_router(ratings_router)
app.include_router(moderation_router)
app.include_router(uploads_router)
app.include_router(stacklaunch_router)
app.include_router(mcp_registry_router)
app.include_router(mcp_stubs_router)
app.include_router(mcp_stubs_bp_router)

seed_mcp_registry()
