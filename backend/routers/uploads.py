import os
import uuid

from fastapi import APIRouter, HTTPException, UploadFile, File, Header
from typing import Optional

from utils.r2_upload import upload_to_r2

router = APIRouter(prefix="/api", tags=["uploads"])

ADMIN_API_KEY = os.environ.get("ADMIN_API_KEY", "")


@router.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    x_admin_key: Optional[str] = Header(default=None),
):
    if not ADMIN_API_KEY or x_admin_key != ADMIN_API_KEY:
        raise HTTPException(status_code=403, detail="Invalid or missing admin key")

    ct = (file.content_type or "").lower()
    data = await file.read()
    ext = (
        file.filename.rsplit(".", 1)[-1]
        if file.filename and "." in file.filename
        else "bin"
    ).lower()
    path = f"uploads/{uuid.uuid4().hex}.{ext}"
    public_url = upload_to_r2(data, path, ct)
    return {"url": public_url, "path": path, "size": len(data)}
