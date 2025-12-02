import pytest
from unittest.mock import patch

@pytest.mark.anyio
async def test_root(client):
    response = await client.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "SCADA Backend Online"}

@pytest.mark.anyio
async def test_login_success(client):
    # Mock DB fetchrow for user
    with patch("app.db.postgres.PostgresDB.fetchrow") as mock_fetch:
        # Return a valid user record with hashed password for 'admin123'
        # Hash: $2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW
        mock_fetch.return_value = {
            "username": "admin",
            "hashed_password": "$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW",
            "role": "admin"
        }
        
        response = await client.post(
            "/token", 
            data={"username": "admin", "password": "admin123"}
        )
        assert response.status_code == 200
        assert "access_token" in response.json()

@pytest.mark.anyio
async def test_get_latest_data_unauthorized(client):
    response = await client.get("/api/latest")
    assert response.status_code == 401
