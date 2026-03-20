from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.services.repo_structure import get_repo_structure

router = APIRouter()


class StructureRequest(BaseModel):
    repo_url: str


@router.post("/api/repo-structure")
async def repo_structure(req: StructureRequest):
    try:
        tree = get_repo_structure(req.repo_url)
        return tree
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
