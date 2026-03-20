from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from app.services.file_content import get_file_content, search_files, explain_code_snippet

router = APIRouter()


class FileContentRequest(BaseModel):
    repo_url: str
    file_path: str
    explain_mode: str = "senior"


@router.post("/api/file-content")
async def file_content(req: FileContentRequest):
    try:
        return get_file_content(req.repo_url, req.file_path, req.explain_mode)
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class ExplainCodeRequest(BaseModel):
    code: str
    file_path: str
    explain_mode: str = "senior"


@router.post("/api/explain-code")
async def explain_code(req: ExplainCodeRequest):
    try:
        return explain_code_snippet(req.code, req.file_path, req.explain_mode)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class SearchRequest(BaseModel):
    repo_url: str
    query: str


@router.post("/api/search-files")
async def search_files_route(req: SearchRequest):
    try:
        results = search_files(req.repo_url, req.query)
        return {"results": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
