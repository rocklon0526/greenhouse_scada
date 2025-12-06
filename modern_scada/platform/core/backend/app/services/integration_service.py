import logging
import os
import httpx
from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional

logger = logging.getLogger(__name__)

class IntegrationProvider(ABC):
    """
    Abstract base class for external system integration.
    """
    @abstractmethod
    async def fetch_tasks(self) -> List[Dict[str, Any]]:
        """Fetch tasks/orders from external system."""
        pass

    @abstractmethod
    async def push_metrics(self, data: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Push metrics/results to external system."""
        pass

class MockIntegrationProvider(IntegrationProvider):
    """
    Mock provider for testing and development.
    """
    async def fetch_tasks(self) -> List[Dict[str, Any]]:
        logger.info("[Mock] Fetching tasks from external system...")
        return [
            {"id": "TASK-001", "type": "production", "target": "Lettuce", "quantity": 500, "due": "2023-11-01"},
            {"id": "TASK-002", "type": "maintenance", "target": "Pump-01", "action": "inspect", "due": "2023-11-05"},
        ]

    async def push_metrics(self, data: List[Dict[str, Any]]) -> Dict[str, Any]:
        logger.info(f"[Mock] Pushing {len(data)} metric records to external system.")
        return {"status": "success", "provider": "mock"}

class GenericRestProvider(IntegrationProvider):
    """
    Generic REST API provider configurable via environment variables.
    """
    def __init__(self):
        self.base_url = os.getenv("INTEGRATION_URL", "https://api.external-system.com")
        self.api_key = os.getenv("INTEGRATION_API_KEY", "")
        self.headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }

    async def fetch_tasks(self) -> List[Dict[str, Any]]:
        url = f"{self.base_url}/tasks"
        logger.info(f"[REST] Fetching tasks from {url}")
        
        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(url, headers=self.headers, timeout=10.0)
                response.raise_for_status()
                return response.json()
            except Exception as e:
                logger.error(f"[REST] Fetch failed: {e}")
                raise

    async def push_metrics(self, data: List[Dict[str, Any]]) -> Dict[str, Any]:
        url = f"{self.base_url}/metrics"
        logger.info(f"[REST] Pushing metrics to {url}")
        
        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(url, json=data, headers=self.headers, timeout=10.0)
                response.raise_for_status()
                return response.json()
            except Exception as e:
                logger.error(f"[REST] Push failed: {e}")
                raise

class IntegrationService:
    """
    Factory and Facade for Integration Providers.
    """
    _provider: Optional[IntegrationProvider] = None

    @classmethod
    def get_provider(cls) -> IntegrationProvider:
        if cls._provider:
            return cls._provider
            
        provider_type = os.getenv("INTEGRATION_TYPE", "mock").lower()
        
        if provider_type == "rest":
            logger.info("Initializing GenericRestProvider")
            cls._provider = GenericRestProvider()
        else:
            logger.info("Initializing MockIntegrationProvider")
            cls._provider = MockIntegrationProvider()
            
        return cls._provider

    @staticmethod
    async def sync_tasks():
        provider = IntegrationService.get_provider()
        try:
            tasks = await provider.fetch_tasks()
            logger.info(f"Synced {len(tasks)} tasks.")
            # Logic to save tasks to DB would go here
            return tasks
        except Exception as e:
            logger.error(f"Sync tasks failed: {e}")
            from app.services.metrics_service import MetricsService
            MetricsService.get().external_sync_errors.labels(provider="unknown").inc()
            return []

    @staticmethod
    async def upload_results(results: List[Dict[str, Any]]):
        provider = IntegrationService.get_provider()
        return await provider.push_metrics(results)
