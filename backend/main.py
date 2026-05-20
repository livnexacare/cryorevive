from dotenv import load_dotenv
from pathlib import Path
load_dotenv(Path(__file__).parent / ".env")

import logging
from fastapi import FastAPI
from starlette.middleware.cors import CORSMiddleware

from database import get_pool, close_pool
from routers import bookings, contact, blog, payments, uploads

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)

app = FastAPI(title="CryoRevive API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://cryo-revive-main.vercel.app",
        "https://cryorevive.com",
        "https://www.cryorevive.com",
        "http://localhost:3000",
    ],
    allow_origin_regex=r"https://.*livnexacares-projects\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(bookings.router)
app.include_router(contact.router)
app.include_router(blog.router)
app.include_router(payments.router)
app.include_router(uploads.router)


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.on_event("startup")
async def startup():
    await get_pool()
    logging.getLogger(__name__).info("DB pool ready")


@app.on_event("shutdown")
async def shutdown():
    await close_pool()
