import os
import logging
import boto3
from fastapi import HTTPException

logger = logging.getLogger(__name__)

ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
MAX_BYTES = 5 * 1024 * 1024


def _client():
    account_id  = os.getenv("R2_ACCOUNT_ID", "")
    access_key  = os.getenv("R2_ACCESS_KEY_ID", "")
    secret_key  = os.getenv("R2_SECRET_ACCESS_KEY") or os.getenv("R2_SECRET_KEY", "")

    if not all([account_id, access_key, secret_key]):
        missing = [k for k, v in {
            "R2_ACCOUNT_ID": account_id,
            "R2_ACCESS_KEY_ID": access_key,
            "R2_SECRET_ACCESS_KEY": secret_key,
        }.items() if not v]
        raise ValueError(f"R2 config missing: {missing}")

    return boto3.client(
        "s3",
        endpoint_url=f"https://{account_id}.r2.cloudflarestorage.com",
        aws_access_key_id=access_key,
        aws_secret_access_key=secret_key,
        region_name="auto",
    )


def upload_to_r2(data: bytes, path: str, content_type: str) -> str:
    if content_type not in ALLOWED_TYPES:
        raise HTTPException(status_code=400, detail="Only JPG, PNG, WEBP, or GIF allowed")
    if len(data) > MAX_BYTES:
        raise HTTPException(status_code=400, detail="File must be under 5 MB")

    bucket     = os.getenv("R2_BUCKET", "cryorevive-media")
    public_url = os.getenv("R2_PUBLIC_URL", "").rstrip("/")

    try:
        _client().put_object(
            Bucket=bucket,
            Key=path,
            Body=data,
            ContentType=content_type,
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error("R2 upload failed: %s", e)
        raise HTTPException(status_code=503, detail="Storage upload failed")

    return f"{public_url}/{path}" if public_url else path
