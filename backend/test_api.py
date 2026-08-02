import pytest
import httpx
from main import app, FRAMEWORKS

@pytest.mark.asyncio
async def test_root_endpoint():
    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "online"
        assert data["framework_count"] == len(FRAMEWORKS)

@pytest.mark.asyncio
async def test_health_endpoint():
    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["ok"] is True
        assert "max_prompt_length" in data

@pytest.mark.asyncio
async def test_intents_endpoint():
    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/intents")
        assert response.status_code == 200
        data = response.json()
        assert "intents" in data
        assert "categories" in data
        assert len(data["intents"]) == len(FRAMEWORKS)

@pytest.mark.asyncio
async def test_models_endpoint():
    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/models")
        assert response.status_code == 200
        data = response.json()
        assert "models" in data
        assert len(data["models"]) > 0

@pytest.mark.asyncio
async def test_generate_validation_error():
    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test") as client:
        response = await client.post("/generate", json={"base_prompt": "   ", "intent": "rtf"})
        assert response.status_code == 422 or response.status_code == 400

@pytest.mark.asyncio
async def test_generate_invalid_intent():
    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test") as client:
        response = await client.post("/generate", json={"base_prompt": "Valid prompt", "intent": "invalid_intent_xyz"})
        assert response.status_code == 422 or response.status_code == 400
