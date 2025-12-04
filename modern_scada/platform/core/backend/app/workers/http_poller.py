import asyncio
import logging
import httpx
from typing import Any, Dict
from app.config import settings
from app.services.event_processor import EventProcessor
from app.services.websocket_manager import manager
from app.services.state_builder import StateBuilder

logger = logging.getLogger(__name__)


def get_nested_value(data: Dict[str, Any], json_key: str) -> Any:
    """
    Extract value from nested JSON using dot-notation key.
    
    Args:
        data: The JSON response data
        json_key: Dot-notation path (e.g., "data.sensors.temp")
    
    Returns:
        The value at the specified path, or None if not found
    
    Example:
        >>> data = {"data": {"sensors": {"temp": 25.5}}}
        >>> get_nested_value(data, "data.sensors.temp")
        25.5
    """
    keys = json_key.split('.')
    value = data
    
    try:
        for key in keys:
            # Handle array indexing like "sensors[0].temp"
            if '[' in key and ']' in key:
                field_name, index = key.split('[')
                index = int(index.rstrip(']'))
                value = value[field_name][index]
            else:
                value = value[key]
        return value
    except (KeyError, IndexError, TypeError) as e:
        logger.warning(f"Failed to extract '{json_key}' from response: {e}")
        return None


async def poll_single_http_source(source_config, processor: EventProcessor, client: httpx.AsyncClient):
    """
    Poll a single HTTP endpoint and process the data.
    
    Args:
        source_config: Configuration for this HTTP source
        processor: EventProcessor instance to send data to
        client: Shared httpx AsyncClient for connection pooling
    """
    try:
        # Prepare request parameters
        request_kwargs = {
            "url": source_config.url,
            "timeout": source_config.timeout or 10.0
        }
        
        # Add headers if provided
        if source_config.headers:
            request_kwargs["headers"] = source_config.headers
        
        # Add request body for POST requests
        if source_config.method.upper() == "POST" and source_config.body:
            request_kwargs["json"] = source_config.body
        
        # Execute HTTP request
        if source_config.method.upper() == "GET":
            response = await client.get(**request_kwargs)
        elif source_config.method.upper() == "POST":
            response = await client.post(**request_kwargs)
        else:
            logger.error(f"Unsupported HTTP method: {source_config.method}")
            return
        
        # Check response status
        response.raise_for_status()
        
        # Parse JSON response
        json_data = response.json()
        
        # Extract and process each tag
        for tag in source_config.tags:
            value = get_nested_value(json_data, tag.json_key)
            
            if value is not None:
                # Convert to float if possible (SCADA typically uses numeric values)
                try:
                    numeric_value = float(value)
                    await processor.process_data(tag.name, numeric_value)
                    logger.debug(f"Processed {tag.name} = {numeric_value} from {source_config.url}")
                except (ValueError, TypeError):
                    logger.warning(f"Could not convert value '{value}' to float for tag {tag.name}")
            else:
                logger.warning(f"Tag {tag.name} returned None from key '{tag.json_key}'")
        
        logger.info(f"✓ Successfully polled {source_config.url} - {len(source_config.tags)} tags processed")
                
    except httpx.TimeoutException:
        logger.error(f"Timeout polling {source_config.url}")
    except httpx.HTTPStatusError as e:
        logger.error(f"HTTP error {e.response.status_code} from {source_config.url}: {e.response.text}")
    except httpx.RequestError as e:
        logger.error(f"Request error polling {source_config.url}: {e}")
    except Exception as e:
        logger.error(f"Unexpected error polling {source_config.url}: {e}", exc_info=True)


async def http_polling_loop():
    """
    Main HTTP polling worker loop.
    
    This worker runs concurrently with the Modbus poller and handles
    all HTTP-based data sources defined in config.yaml.
    """
    logger.info("Starting HTTP Polling Worker")
    processor = EventProcessor()
    
    # Use a shared async client for better connection pooling
    async with httpx.AsyncClient() as client:
        while True:
            try:
                http_sources = settings.app_config.http_sources
                
                if not http_sources:
                    logger.debug("No HTTP sources configured, sleeping...")
                    await asyncio.sleep(10)
                    continue
                
                # Poll all sources concurrently, but respect individual intervals
                # For simplicity, we poll all sources in each iteration and use
                # the minimum interval. For more sophisticated scheduling, consider
                # using APScheduler or separate tasks per source.
                
                tasks = [poll_single_http_source(source, processor, client) for source in http_sources]
                await asyncio.gather(*tasks, return_exceptions=True)
                
                # Broadcast updates after polling all HTTP sources
                system_state = StateBuilder.build_system_state()
                await manager.broadcast({"type": "update", "data": system_state})
                
            except Exception as e:
                logger.error(f"Global HTTP polling loop error: {e}", exc_info=True)
            
            # Use the minimum interval from all sources, or default to 5 seconds
            min_interval = 5.0
            if settings.app_config.http_sources:
                intervals = [source.interval for source in settings.app_config.http_sources]
                min_interval = min(intervals) if intervals else 5.0
            
            await asyncio.sleep(min_interval)
