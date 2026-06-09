from dotenv import load_dotenv
from pathlib import Path
load_dotenv(Path(__file__).parent / ".env")

import os
import logging
from fastapi import FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from database import get_pool, close_pool
from routers import bookings, contact, blog, payments, uploads, notifications, pricing

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)

app = FastAPI(title="CryoRevive API", version="1.0.0")

allowed_origins_env = os.getenv("ALLOWED_ORIGINS", "").split(",")
allowed_origins = [o.strip() for o in allowed_origins_env if o.strip()]

# Allow production domains + all Vercel preview deployments
allowed_origin_regex = r"https://(www\.)?cryorevive\.(in|com)|https://cryorevive-.*\.vercel\.app"

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=allowed_origin_regex,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(bookings.router)
app.include_router(contact.router)
app.include_router(blog.router)
app.include_router(payments.router)
app.include_router(uploads.router)
app.include_router(notifications.router)
app.include_router(pricing.router)


@app.get("/health")
async def health():
    return {"status": "ok", "version": "1.1.0"}


@app.get("/api/test-r2")
async def test_r2(x_admin_key: str = Header(None, alias="X-Admin-Key")):
    if x_admin_key != os.getenv("ADMIN_API_KEY"):
        raise HTTPException(status_code=403, detail="Forbidden")

    account_id  = os.getenv("R2_ACCOUNT_ID", "")
    access_key  = os.getenv("R2_ACCESS_KEY_ID", "")
    secret_key  = os.getenv("R2_SECRET_ACCESS_KEY") or os.getenv("R2_SECRET_KEY", "")
    bucket      = os.getenv("R2_BUCKET", "")
    public_url  = os.getenv("R2_PUBLIC_URL", "")

    status = {
        "R2_ACCOUNT_ID":       f"set: {account_id[:8]}…"  if account_id  else "MISSING",
        "R2_ACCESS_KEY_ID":    f"set: {access_key[:8]}…"  if access_key  else "MISSING",
        "R2_SECRET_ACCESS_KEY": f"set ({len(secret_key)} chars)" if secret_key else "MISSING",
        "R2_BUCKET":           bucket     or "MISSING",
        "R2_PUBLIC_URL":       public_url or "MISSING",
    }

    try:
        import boto3
        client = boto3.client(
            "s3",
            endpoint_url=f"https://{account_id}.r2.cloudflarestorage.com",
            aws_access_key_id=access_key,
            aws_secret_access_key=secret_key,
            region_name="auto",
        )
        client.list_objects_v2(Bucket=bucket, MaxKeys=1)
        status["connection_test"] = "SUCCESS"
    except Exception as e:
        status["connection_test"] = f"FAILED: {e}"

    return status


@app.on_event("startup")
async def startup():
    log = logging.getLogger(__name__)
    log.info("CryoRevive API starting")
    r2_vars = {
        "R2_ACCOUNT_ID":       os.getenv("R2_ACCOUNT_ID", ""),
        "R2_ACCESS_KEY_ID":    os.getenv("R2_ACCESS_KEY_ID", ""),
        "R2_SECRET_ACCESS_KEY": os.getenv("R2_SECRET_ACCESS_KEY") or os.getenv("R2_SECRET_KEY", ""),
        "R2_BUCKET":           os.getenv("R2_BUCKET", ""),
        "R2_PUBLIC_URL":       os.getenv("R2_PUBLIC_URL", ""),
    }
    missing = [k for k, v in r2_vars.items() if not v]
    if missing:
        log.warning("R2 vars not set: %s — image upload will fail", missing)
    else:
        log.info("R2 config: OK")


@app.on_event("shutdown")
async def shutdown():
    await close_pool()
