import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from app.services.integration_service import IntegrationService, GenericRestProvider, MockIntegrationProvider

@pytest.mark.asyncio
async def test_mock_provider():
    """Test that MockIntegrationProvider returns static data."""
    provider = MockIntegrationProvider()
    tasks = await provider.fetch_tasks()
    assert len(tasks) == 2
    assert tasks[0]["id"] == "TASK-001"
    
    result = await provider.push_metrics([{"test": "data"}])
    assert result["status"] == "success"

@pytest.mark.asyncio
async def test_rest_provider_fetch():
    """Test GenericRestProvider fetch_tasks with mocked HTTP client."""
    with patch("httpx.AsyncClient") as mock_client_cls:
        mock_client = AsyncMock()
        mock_client_cls.return_value.__aenter__.return_value = mock_client
        
        # Mock Response
        mock_response = MagicMock()
        mock_response.json.return_value = [{"id": "REST-001"}]
        mock_response.raise_for_status.return_value = None
        mock_client.get.return_value = mock_response
        
        provider = GenericRestProvider()
        provider.base_url = "http://test-api.com"
        
        tasks = await provider.fetch_tasks()
        
        assert len(tasks) == 1
        assert tasks[0]["id"] == "REST-001"
        mock_client.get.assert_called_once()

@pytest.mark.asyncio
async def test_integration_service_factory():
    """Test that IntegrationService returns the correct provider based on env var."""
    # Reset singleton
    IntegrationService._provider = None
    
    with patch.dict("os.environ", {"INTEGRATION_TYPE": "rest"}):
        provider = IntegrationService.get_provider()
        assert isinstance(provider, GenericRestProvider)
        
    # Reset singleton
    IntegrationService._provider = None
    
    with patch.dict("os.environ", {"INTEGRATION_TYPE": "mock"}):
        provider = IntegrationService.get_provider()
        assert isinstance(provider, MockIntegrationProvider)
