import pandas as pd
import io
from datetime import datetime
from typing import List, Dict, Any

class ReportService:
    @staticmethod
    def generate_excel_report(data: List[Dict[str, Any]], report_type: str) -> bytes:
        """
        Generates an Excel report from a list of dictionaries.
        """
        df = pd.DataFrame(data)
        
        output = io.BytesIO()
        with pd.ExcelWriter(output, engine='openpyxl') as writer:
            sheet_name = f"{report_type}_{datetime.now().strftime('%Y%m%d')}"
            df.to_excel(writer, index=False, sheet_name=sheet_name[:31])  # Sheet name max 31 chars
            
        return output.getvalue()

    @staticmethod
    def get_mock_production_data() -> List[Dict[str, Any]]:
        """
        Returns mock production data for testing.
        """
        return [
            {"timestamp": "2023-10-27 08:00:00", "product": "Lettuce", "quantity": 150, "status": "OK"},
            {"timestamp": "2023-10-27 09:00:00", "product": "Tomato", "quantity": 120, "status": "OK"},
            {"timestamp": "2023-10-27 10:00:00", "product": "Basil", "quantity": 50, "status": "Low Yield"},
            {"timestamp": "2023-10-27 11:00:00", "product": "Lettuce", "quantity": 160, "status": "OK"},
        ]

    @staticmethod
    def get_mock_alarm_data() -> List[Dict[str, Any]]:
        """
        Returns mock alarm data for testing.
        """
        return [
            {"timestamp": "2023-10-27 08:15:00", "alarm_code": "A001", "message": "High Temp", "severity": "Critical"},
            {"timestamp": "2023-10-27 09:30:00", "alarm_code": "A002", "message": "Low Water Level", "severity": "Warning"},
        ]
