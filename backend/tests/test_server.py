"""
Smoke tests for the CryoRevive FastAPI backend.
Run with: pytest tests/test_server.py -v

Requires a live DATABASE_URL in .env (or environment).
"""
import pytest
from httpx import AsyncClient, ASGITransport
from unittest.mock import AsyncMock, patch

# Patch DB before importing server so pool is never actually created
@pytest.fixture(autouse=True)
def mock_db(monkeypatch):
    monkeypatch.setenv("DATABASE_URL", "postgresql://mock:mock@localhost/mock")
    monkeypatch.setenv("RESEND_API_KEY", "")
    monkeypatch.setenv("R2_ACCOUNT_ID", "test")
    monkeypatch.setenv("R2_ACCESS_KEY_ID", "test")
    monkeypatch.setenv("R2_SECRET_KEY", "test")


@pytest.mark.asyncio
async def test_health():
    from server import app
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        with patch("server.get_pool", new_callable=AsyncMock):
            r = await client.get("/api/")
    assert r.status_code == 200
    assert r.json()["service"] == "cryorevive"


@pytest.mark.asyncio
async def test_register_missing_fields():
    from server import app
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        r = await client.post("/api/auth/register", json={"email": "bad"})
    assert r.status_code == 422


@pytest.mark.asyncio
async def test_create_booking_missing_fields():
    from server import app
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        r = await client.post("/api/bookings", json={"service": "ice_bath"})
    assert r.status_code == 422


@pytest.mark.asyncio
async def test_unauthenticated_admin():
    from server import app
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        r = await client.get("/api/admin/stats")
    assert r.status_code == 401
