import logging
import uuid
from datetime import datetime
from typing import Optional

from firebase_admin import storage
from fastapi import APIRouter, HTTPException, UploadFile, File, Header

from .shared import verify_firebase_token, UploadImageResponse

uploads_router = APIRouter(prefix="/api")


@uploads_router.post("/upload-image")
async def upload_image(file: UploadFile = File(...), authorization: Optional[str] = Header(None)):
    user = verify_firebase_token(authorization)
    if not user:
        raise HTTPException(status_code=401, detail="Unauthorized")

    if not file.content_type or not file.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="File must be an image")

    contents = await file.read()
    if len(contents) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File size must be less than 10MB")

    try:
        from PIL import Image
        import io

        img = Image.open(io.BytesIO(contents))
        if img.mode not in ('RGB', 'RGBA'):
            img = img.convert('RGB')
        img.thumbnail((800, 800), Image.LANCZOS)

        output = io.BytesIO()
        save_kwargs = {'format': 'WebP', 'quality': 85, 'optimize': True}
        if img.mode == 'RGBA':
            save_kwargs['lossless'] = False
        else:
            img = img.convert('RGB')
        img.save(output, **save_kwargs)
        output.seek(0)
        compressed = output.read()

        unique_id = f"{int(datetime.now().timestamp())}-{uuid.uuid4().hex[:8]}"
        filename = f"app-images/{unique_id}.webp"

        bucket = storage.bucket()
        blob = bucket.blob(filename)
        blob.upload_from_string(compressed, content_type='image/webp')
        blob.make_public()

        return UploadImageResponse(url=blob.public_url, filename=filename)
    except Exception as e:
        logging.error(f"Error uploading image: {e}")
        raise HTTPException(status_code=500, detail="Failed to upload image")

