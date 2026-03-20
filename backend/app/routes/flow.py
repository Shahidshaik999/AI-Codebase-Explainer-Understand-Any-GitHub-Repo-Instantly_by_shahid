import logging
from fastapi import APIRouter, HTTPException

from app.models.response_model import FlowRequest, FlowResult
from app.services.flow_analyzer import build_execution_flow

router = APIRouter(prefix="/api", tags=["flow"])
logger = logging.getLogger(__name__)


@router.post("/flow", response_model=FlowResult)
async def execution_flow(request: FlowRequest):
    """
    Execution Flow Simulator — build a detailed function/class call graph
    using AST parsing, suitable for React Flow visualization.
    """
    try:
        return build_execution_flow(request)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        logger.exception("Flow analysis failed")
        raise HTTPException(status_code=500, detail=f"Flow analysis failed: {str(e)}")
