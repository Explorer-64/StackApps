import logging
from datetime import datetime
from typing import Optional

from firebase_admin import firestore
from fastapi import APIRouter, HTTPException, Header

from .shared import verify_firebase_token, RateAppRequest, RateAppResponse

ratings_router = APIRouter(prefix="/api")


@ratings_router.post("/rate")
async def rate_app(body: RateAppRequest, authorization: Optional[str] = Header(None)):
    user = verify_firebase_token(authorization)
    if not user:
        raise HTTPException(status_code=401, detail="Unauthorized")

    db = firestore.client()
    user_id = user["uid"]

    app_ref = db.collection("apps").document(body.appId)
    review_id = f"{user_id}_{body.appId}"
    review_ref = db.collection("reviews").document(review_id)

    transaction = db.transaction()

    @firestore.transactional
    def update_in_transaction(transaction, app_ref, review_ref, rating_val, comment_val, user_name, user_avatar):
        app_snapshot = app_ref.get(transaction=transaction)
        if not app_snapshot.exists:
            raise Exception("AppNotFound")

        review_snapshot = review_ref.get(transaction=transaction)

        app_data = app_snapshot.to_dict()
        current_avg = float(app_data.get("averageRating", 0))
        current_count = int(app_data.get("ratingCount", 0))

        old_rating = 0
        is_new = not review_snapshot.exists

        if not is_new:
            old_rating = review_snapshot.get("rating")

        total_score = current_avg * current_count

        if is_new:
            new_total = total_score + rating_val
            new_count = current_count + 1
        else:
            new_total = total_score - old_rating + rating_val
            new_count = current_count

        if new_count > 0:
            new_avg = new_total / new_count
        else:
            new_avg = 0.0

        review_payload = {
            "appId": body.appId,
            "userId": user_id,
            "rating": rating_val,
            "comment": comment_val,
            "updatedAt": datetime.utcnow().isoformat(),
            "userName": user_name,
            "userAvatarUrl": user_avatar
        }

        if is_new:
            review_payload["createdAt"] = datetime.utcnow().isoformat()
            transaction.set(review_ref, review_payload)
        else:
            transaction.update(review_ref, review_payload)

        transaction.update(app_ref, {
            "averageRating": new_avg,
            "ratingCount": new_count
        })

        return new_avg, new_count

    try:
        new_avg, new_cnt = update_in_transaction(
            transaction,
            app_ref,
            review_ref,
            body.rating,
            body.comment,
            body.userName,
            body.userAvatarUrl
        )
    except Exception as e:
        error_msg = str(e)
        if "AppNotFound" in error_msg:
            raise HTTPException(status_code=404, detail="App not found")

        logging.error(f"Transaction failed: {error_msg}")
        raise HTTPException(status_code=500, detail=f"Failed to process rating: {error_msg}")

    return RateAppResponse(
        success=True,
        newAverageRating=new_avg,
        newRatingCount=new_cnt
    )


@ratings_router.delete("/review/{app_id}")
async def delete_review(app_id: str, authorization: Optional[str] = Header(None)):
    user = verify_firebase_token(authorization)
    if not user:
        raise HTTPException(status_code=401, detail="Unauthorized")

    db = firestore.client()
    user_id = user["uid"]
    review_id = f"{user_id}_{app_id}"
    review_ref = db.collection("reviews").document(review_id)
    app_ref = db.collection("apps").document(app_id)

    transaction = db.transaction()

    @firestore.transactional
    def delete_in_transaction(transaction, app_ref, review_ref):
        review_snapshot = review_ref.get(transaction=transaction)
        if not review_snapshot.exists:
            raise Exception("ReviewNotFound")

        review_data = review_snapshot.to_dict()
        if review_data.get("userId") != user_id:
            raise Exception("Forbidden")

        old_rating = review_data.get("rating", 0)

        app_snapshot = app_ref.get(transaction=transaction)
        if app_snapshot.exists:
            app_data = app_snapshot.to_dict()
            current_avg = float(app_data.get("averageRating", 0))
            current_count = int(app_data.get("ratingCount", 0))
            new_count = max(0, current_count - 1)
            if new_count > 0:
                new_avg = (current_avg * current_count - old_rating) / new_count
            else:
                new_avg = 0.0
            transaction.update(app_ref, {
                "averageRating": new_avg,
                "ratingCount": new_count,
                "updatedAt": datetime.utcnow().isoformat(),
            })

        transaction.delete(review_ref)

    try:
        delete_in_transaction(transaction, app_ref, review_ref)
    except Exception as e:
        error_msg = str(e)
        if "ReviewNotFound" in error_msg:
            raise HTTPException(status_code=404, detail="Review not found")
        if "Forbidden" in error_msg:
            raise HTTPException(status_code=403, detail="Not your review")
        logging.error(f"Delete review failed: {error_msg}")
        raise HTTPException(status_code=500, detail=f"Failed to delete review: {error_msg}")

    return {"success": True}

