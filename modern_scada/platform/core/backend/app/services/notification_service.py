import logging
import asyncio
import os
import smtplib
from email.mime.text import MIMEText
from typing import List, Dict, Any
import httpx

logger = logging.getLogger(__name__)

class NotificationService:
    @staticmethod
    async def send_email(to: str, subject: str, body: str):
        """
        Sends an email notification via SMTP.
        Configured via environment variables:
        - SMTP_SERVER
        - SMTP_PORT
        - SMTP_USER
        - SMTP_PASSWORD
        """
        smtp_server = os.getenv("SMTP_SERVER", "smtp.gmail.com")
        smtp_port = int(os.getenv("SMTP_PORT", "587"))
        smtp_user = os.getenv("SMTP_USER")
        smtp_password = os.getenv("SMTP_PASSWORD")

        if not smtp_user or not smtp_password:
            logger.warning("SMTP credentials not set. Skipping email.")
            return False

        logger.info(f"Sending EMAIL to {to} | Subject: {subject}")
        
        try:
            msg = MIMEText(body)
            msg['Subject'] = subject
            msg['From'] = smtp_user
            msg['To'] = to

            # Run blocking SMTP in a thread
            def _send():
                with smtplib.SMTP(smtp_server, smtp_port) as server:
                    server.starttls()
                    server.login(smtp_user, smtp_password)
                    server.send_message(msg)

            await asyncio.to_thread(_send)
            logger.info("✓ Email sent successfully")
            return True
        except Exception as e:
            logger.error(f"Failed to send email: {e}")
            return False

    @staticmethod
    async def send_line_notify(message: str):
        """
        Sends a LINE notification.
        Configured via environment variable:
        - LINE_NOTIFY_TOKEN
        """
        token = os.getenv("LINE_NOTIFY_TOKEN")
        
        if not token:
            logger.warning("LINE_NOTIFY_TOKEN not set. Skipping LINE notify.")
            return False

        logger.info(f"Sending LINE Notify: {message}")
        
        url = "https://notify-api.line.me/api/notify"
        headers = {"Authorization": f"Bearer {token}"}
        data = {"message": message}

        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(url, headers=headers, data=data)
                response.raise_for_status()
                logger.info("✓ LINE notification sent successfully")
                return True
        except Exception as e:
            logger.error(f"Failed to send LINE notification: {e}")
            return False

    @staticmethod
    async def dispatch_alarm_notification(alarm: Dict[str, Any]):
        """
        Dispatches notifications based on alarm severity.
        """
        message = f"\n[ALARM] {alarm.get('message')}\nCode: {alarm.get('code')}\nTime: {alarm.get('timestamp')}"
        
        tasks = []
        
        # Always send LINE for all alarms (if token exists)
        tasks.append(NotificationService.send_line_notify(message))
        
        # Send Email for Critical alarms
        if alarm.get('severity') == 'CRITICAL':
            admin_email = os.getenv("ADMIN_EMAIL", "admin@greenhouse.com")
            tasks.append(NotificationService.send_email(
                to=admin_email,
                subject=f"CRITICAL ALARM: {alarm.get('code')}",
                body=f"A critical alarm has occurred:\n\n{message}"
            ))
            
        await asyncio.gather(*tasks)
