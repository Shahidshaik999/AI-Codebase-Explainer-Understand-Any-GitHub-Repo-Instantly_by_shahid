import logging
from fastapi import APIRouter, HTTPException, BackgroundTasks
from fastapi.responses import JSONResponse

from app.models.response_model import (
    AnalyzeRequest, AnalysisResult,
    ChatRequest, ChatResponse, ErrorResponse,
)
from app.services.analyzer import (
    run_phase1, run_phase2, run_phase3, chat_with_repo,
)

router = APIRouter(prefix="/api", tags=["analyze"])
logger = logging.getLogger(__name__)


def _validate_github_url(url: str) -> None:
    url = url.strip()
    if not url.startswith(("https://github.com/", "http://github.com/")):
        raise HTTPException(
            status_code=400,
            detail="Only GitHub URLs are supported (https://github.com/owner/repo).",
        )
    parts = url.rstrip("/").split("/")
    if len(parts) < 5:
        raise HTTPException(
            status_code=400,
            detail="Invalid GitHub URL. Expected format: https://github.com/owner/repo",
        )


@router.post("/analyze", response_model=AnalysisResult)
async def analyze_repo(request: AnalyzeRequest):
    """
    Main analysis endpoint.
    Phase 1 = MVP, Phase 2 = embeddings + folder summaries,
    Phase 3 = dependency graph, Phase 4 = same as 3 (chat is separate).
    """
    _validate_github_url(request.repo_url)

    try:
        if request.phase >= 3:
            result = run_phase3(request.repo_url, request.explain_mode)
        elif request.phase == 2:
            result = run_phase2(request.repo_url, request.explain_mode)
        else:
            result = run_phase1(request.repo_url, request.explain_mode)
        return result

    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.exception("Unexpected error during analysis")
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")


@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """RAG-powered chat endpoint for Phase 4."""
    _validate_github_url(request.repo_url)

    try:
        history = [{"role": m.role, "content": m.content} for m in request.history]
        result = chat_with_repo(
            repo_url=request.repo_url,
            question=request.message,
            history=history,
        )
        return ChatResponse(answer=result["answer"], sources=result["sources"])

    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.exception("Chat error")
        raise HTTPException(status_code=500, detail=f"Chat failed: {str(e)}")


@router.get("/health")
async def health():
    return {"status": "ok"}
