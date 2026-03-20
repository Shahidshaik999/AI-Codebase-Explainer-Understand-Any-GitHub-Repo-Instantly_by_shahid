import logging
from fastapi import APIRouter, HTTPException

from app.models.response_model import WhatIfRequest, WhatIfResult
from app.services.what_if import analyze_what_if

router = APIRouter(prefix="/api", tags=["what-if"])
logger = logging.getLogger(__name__)


@router.post("/what-if", response_model=WhatIfResult)
async def what_if_analysis(request: WhatIfRequest):
    """
    What-If Impact Analyzer — simulate a hypothetical change and get
    AI-powered impact analysis with affected files, risk level, and recommendations.
    """
    if not request.query.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty.")

    try:
        return analyze_what_if(request)
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        logger.exception("What-If analysis failed")
        raise HTTPException(status_code=500, detail=f"What-If analysis failed: {str(e)}")
