import logging
from typing import Optional

from fastapi import Header
from pydantic import BaseModel


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
