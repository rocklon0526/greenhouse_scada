"""
Webhook Router for Vendor Data Ingress

This module handles incoming webhooks from third-party vendors
who push data changes (COV - Change of Value) to the SCADA system.
"""

import logging
from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel
from typing import Dict, Optional, Any
from app.services.event_processor import EventProcessor

logger = logging.getLogger(__name__)

router = APIRouter()


class WebhookPayload(BaseModel):
    """
    Vendor webhook payload structure.
    
    Expected format:
    {
        "device_id": "nursery_greenhouse_01", 
        "data": {
            "temperature": 25.5,
            "humidity": 65.2,
            "co2": 450
        },
        "timestamp": "2025-12-04T12:00:00Z"  # Optional
    }
    """
    device_id: str
    data: Dict[str, Any]
    timestamp: Optional[str] = None


@router.post("/api/hooks/nursery/update")
async def receive_nursery_webhook(
    payload: WebhookPayload,
    x_api_key: Optional[str] = Header(None, alias="X-API-Key")
):
    """
    Receive data push from Nursery Vendor.
    
    This endpoint allows the vendor to proactively send data updates
    (Change of Value) instead of relying solely on polling.
    
    Args:
        payload: Webhook data payload
        x_api_key: Optional API key for authentication (Header)
    
    Returns:
        Success confirmation
    
    Example:
        POST /api/hooks/nursery/update
        Headers: X-API-Key: your-secret-key
        Body: {
            "device_id": "nursery_greenhouse_01",
            "data": {"temperature": 25.5, "humidity": 65.2}
        }
    """
    try:
        # Optional: Validate API key if configured
        # For production, store expected key in settings
        # if x_api_key != settings.WEBHOOK_API_KEY:
        #     raise HTTPException(status_code=401, detail="Invalid API key")
        logger.info(f"Received webhook from device: {payload.device_id}")
        
        # Initialize EventProcessor
        processor = EventProcessor()
        
        # Process each data point in the payload
        processed_count = 0
        for key, value in payload.data.items():
            # Construct tag name: device_id + parameter
            # e.g., "nursery_greenhouse_01_temperature"
            tag_name = f"{payload.device_id}_{key}"
            
            try:
                # Convert value to float (SCADA typically uses numeric values)
                if isinstance(value, (int, float)):
                    numeric_value = float(value)
                    
                    # Inject data into the system
                    await processor.process_data(tag_name, numeric_value)
                    processed_count += 1
                    logger.debug(f"Processed webhook data: {tag_name} = {numeric_value}")
                else:
                    logger.warning(f"Non-numeric value for {tag_name}: {value} (type: {type(value).__name__})")
                    
            except Exception as e:
                logger.error(f"Error processing tag {tag_name}: {e}", exc_info=True)
                # Continue processing other tags even if one fails
        
        logger.info(f"✓ Webhook processed successfully: {processed_count}/{len(payload.data)} tags from {payload.device_id}")
        
        return {
            "status": "success",
            "device_id": payload.device_id,
            "processed": processed_count,
            "total": len(payload.data),
            "message": f"Processed {processed_count} data points"
        }
        
    except Exception as e:
        logger.error(f"Webhook processing failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Webhook processing error: {str(e)}")


@router.post("/api/hooks/nursery/batch")
async def receive_nursery_batch_webhook(
    payloads: list[WebhookPayload],
    x_api_key: Optional[str] = Header(None, alias="X-API-Key")
):
    """
    Receive batch data push from Nursery Vendor (multiple devices).
    
    Args:
        payloads: List of webhook payloads
        x_api_key: Optional API key for authentication
    
    Returns:
        Batch processing summary
    """
    try:
        processor = EventProcessor()
        total_processed = 0
        total_devices = len(payloads)
        
        for payload in payloads:
            logger.debug(f"Processing batch item: {payload.device_id}")
            
            for key, value in payload.data.items():
                tag_name = f"{payload.device_id}_{key}"
                
                try:
                    if isinstance(value, (int, float)):
                        await processor.process_data(tag_name, float(value))
                        total_processed += 1
                except Exception as e:
                    logger.error(f"Batch processing error for {tag_name}: {e}")
        
        logger.info(f"✓ Batch webhook processed: {total_processed} tags from {total_devices} devices")
        
        return {
            "status": "success",
            "devices": total_devices,
            "total_tags": total_processed,
            "message": f"Batch processed {total_processed} tags from {total_devices} devices"
        }
        
    except Exception as e:
        logger.error(f"Batch webhook processing failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Batch processing error: {str(e)}")


@router.get("/api/hooks/health")
async def webhook_health_check():
    """Health check endpoint for webhook service."""
    return {
        "status": "healthy",
        "service": "webhook receiver",
        "endpoints": [
            "/api/hooks/nursery/update",
            "/api/hooks/nursery/batch"
        ]
    }
