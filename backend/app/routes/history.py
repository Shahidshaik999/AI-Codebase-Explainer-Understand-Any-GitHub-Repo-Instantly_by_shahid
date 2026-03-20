import logging
from fastapi import APIRouter, HTTPException

from app.models.response_model import HistoryRequest, HistoryResult
from app.services.git_history import get_git_history

router = APIRouter(prefix="/api", tags=["history"])
logger = logging.getLogger(__name__)


@router.post("/history", response_model=HistoryResult)
async def repo_history(request: HistoryRequest):
    """
    Codebase Time Machine — extract commit history with AI-generated
    insights explaining what changed, why, and the impact of each commit.
    """
    if request.limit < 1 or request.limit > 50:
        raise HTTPException(status_code=400, detail="limit must be between 1 and 50.")

    try:
        return get_git_history(request)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        logger.exception("History fetch failed")
        raise HTTPException(status_code=500, detail=f"History failed: {str(e)}")
