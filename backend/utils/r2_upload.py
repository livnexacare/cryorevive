import os
import logging
import boto3
from botocore.config import Config
from fastapi import HTTPException

logger = logging.getLogger(__name__)

R2_ACCOUNT_ID    = os.environ.get("R2_ACCOUNT_ID", "")
R2_ACCESS_KEY_ID = os.environ.get("R2_ACCESS_KEY_ID", "")
R2_SECRET_KEY    = os.environ.get("R2_SECRET_KEY", "")
R2_BUCKET        = os.environ.get("R2_BUCKET", "cryorevive-media")
R2_PUBLIC_URL    = os.environ.get("R2_PUBLIC_URL", "").rstrip("/")

ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
MAX_BYTES = 5 * 1024 * 1024


def _client():
    return boto3.client(
        "s3",
        endpoint_url=f"https://{R2_ACCOUNT_ID}.r2.cloudflarestorage.com",
        aws_access_key_id=R2_ACCESS_KEY_ID,
        aws_secret_access_key=R2_SECRET_KEY,
        config=Config(signature_version="s3v4"),
        region_name="auto",
    )


def upload_to_r2(data: bytes, path: str, content_type: str) -> str:
    """Upload bytes to R2 at `path`. Returns the public URL."""
    if content_type not in ALLOWED_TYPES:
        raise HTTPException(status_code=400, detail="Only JPG, PNG, WEBP, or GIF allowed")
    if len(data) > MAX_BYTES:
        raise HTTPException(status_code=400, detail="File must be under 5 MB")
    try:
        _client().put_object(
            Bucket=R2_BUCKET,
            Key=path,
            Body=data,
            ContentType=content_type,
        )
    except Exception as e:
        logger.error("R2 upload failed: %s", e)
        raise HTTPException(status_code=503, detail="Storage upload failed")
    return f"{R2_PUBLIC_URL}/{path}" if R2_PUBLIC_URL else path
