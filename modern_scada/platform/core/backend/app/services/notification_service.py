import logging
import asyncio
from typing import List, Dict, Any

logger = logging.getLogger(__name__)

class NotificationService:
    @staticmethod
    async def send_email(to: str, subject: str, body: str):
        """
        Sends an email notification (Mock).
        """
        logger.info(f"Sending EMAIL to {to} | Subject: {subject} | Body: {body}")
        # In real implementation: use smtplib or a service like SendGrid
        await asyncio.sleep(0.1) # Simulate network delay
        return True

    @staticmethod
    async def send_line_notify(message: str):
        """
        Sends a LINE notification (Mock).
        """
        logger.info(f"Sending LINE Notify: {message}")
        # In real implementation: use httpx.post to LINE Notify API
        await asyncio.sleep(0.1)
        return True

    @staticmethod
    async def dispatch_alarm_notification(alarm: Dict[str, Any]):
        """
        Dispatches notifications based on alarm severity.
        """
        message = f"ALARM: {alarm.get('message')} (Code: {alarm.get('code')})"
        
        tasks = []
        
        # Always send LINE for all alarms
        tasks.append(NotificationService.send_line_notify(message))
        
        # Send Email for Critical alarms
        if alarm.get('severity') == 'CRITICAL':
            tasks.append(NotificationService.send_email(
                to="admin@greenhouse.com",
                subject=f"CRITICAL ALARM: {alarm.get('code')}",
                body=f"A critical alarm has occurred: {alarm.get('message')}\nTimestamp: {alarm.get('timestamp')}"
            ))
            
        await asyncio.gather(*tasks)
