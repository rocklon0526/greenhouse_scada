from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import StreamingResponse
from app.services.report_service import ReportService
import io

router = APIRouter(
    prefix="/reports",
    tags=["Reports"]
)

@router.post("/generate")
async def generate_report(
    report_type: str = Query(..., description="Type of report: 'production' or 'alarm'"),
    start_date: str = Query(None),
    end_date: str = Query(None)
):
    """
    Generates an Excel report based on the specified type.
    """
    if report_type == "production":
        data = ReportService.get_mock_production_data()
    elif report_type == "alarm":
        data = ReportService.get_mock_alarm_data()
    else:
        raise HTTPException(status_code=400, detail="Invalid report type")

    excel_bytes = ReportService.generate_excel_report(data, report_type)
    
    filename = f"{report_type}_report.xlsx"
    
    return StreamingResponse(
        io.BytesIO(excel_bytes),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
