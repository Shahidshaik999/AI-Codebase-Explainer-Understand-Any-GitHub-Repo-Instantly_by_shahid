import logging
from fastapi import APIRouter, HTTPException

from app.models.response_model import SystemDesignRequest, SystemDesignResult
from app.services.system_design import generate_system_design

router = APIRouter(prefix="/api", tags=["system-design"])
logger = logging.getLogger(__name__)


@router.post("/system-design", response_model=SystemDesignResult)
async def system_design(request: SystemDesignRequest):
    """
    Auto System Design Generator — given a repo URL (and optionally pre-fetched
    summary/tech_stack/execution_flow from a prior analysis), produce a full
    system design: architecture overview, components, data flow, scaling
    strategies, bottlenecks, and improvement suggestions.
    """
    if not request.repo_url.strip():
        raise HTTPException(status_code=400, detail="repo_url is required.")

    try:
        return generate_system_design(request)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.exception("System design generation failed")
        raise HTTPException(status_code=500, detail=f"System design failed: {str(e)}")
