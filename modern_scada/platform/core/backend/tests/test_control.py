import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from app.services.device_control_service import DeviceControlService
from app.config import AppConfig, VendorControlConfig, PLCConfig, PLCConnection

@pytest.fixture
def mock_settings():
    with patch("app.services.device_control_service.settings") as mock_settings:
        # Setup default config
        config = AppConfig()
        config.vendor_control = VendorControlConfig(
            url="http://vendor-api.com",
            device_prefix="nursery_"
        )
        config.plc = PLCConfig(connections=[
            PLCConnection(name="main", host="localhost", port=502)
        ])
        mock_settings.app_config = config
        yield mock_settings

@pytest.mark.asyncio
async def test_vendor_routing(mock_settings):
    """Test that devices with vendor prefix are routed to HTTP."""
    with patch("httpx.AsyncClient") as mock_client_cls:
        mock_client = AsyncMock()
        mock_client_cls.return_value.__aenter__.return_value = mock_client
        
        mock_response = MagicMock()
        mock_response.json.return_value = {"status": "ok"}
        mock_client.post.return_value = mock_response
        
        await DeviceControlService.send_control_command("nursery_fan_1", "SET", "speed", 50.0)
        
        # Verify HTTP call
        mock_client.post.assert_called_once()
        call_args = mock_client.post.call_args
        assert call_args[1]["json"]["device_id"] == "nursery_fan_1"

@pytest.mark.asyncio
async def test_modbus_routing(mock_settings):
    """Test that standard devices are routed to Modbus."""
    with patch("app.services.device_control_service.AsyncModbusTcpClient") as mock_modbus_cls:
        mock_client = AsyncMock()
        mock_modbus_cls.return_value = mock_client
        mock_client.connect = AsyncMock()
        mock_client.connected = True
        
        # Test with a known mapped device
        await DeviceControlService.send_control_command("fan_1", "SET", "status", 1.0)
        
        # Verify Modbus write
        mock_client.write_single_register.assert_called_once()
        # fan_1 maps to 400
        assert mock_client.write_single_register.call_args[0][0] == 400
