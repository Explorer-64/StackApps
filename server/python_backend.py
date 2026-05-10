import os
import json
import logging
from datetime import datetime
from typing import Optional

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

from .ratings import ratings_router
from .moderation import moderation_router
from .uploads import uploads_router
from .stacklaunch import router as stacklaunch_router

app.include_router(router)
app.include_router(ratings_router)
app.include_router(moderation_router)
app.include_router(uploads_router)
app.include_router(stacklaunch_router)
