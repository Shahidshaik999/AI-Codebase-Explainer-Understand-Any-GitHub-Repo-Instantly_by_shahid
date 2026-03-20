import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes.analyze import router as analyze_router
from app.routes.what_if import router as what_if_router
from app.routes.history import router as history_router
from app.routes.flow import router as flow_router
from app.routes.system_design import router as system_design_router
from app.routes.structure import router as structure_router
from app.routes.file_content import router as file_content_router

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)

app = FastAPI(
    title="AI Codebase Explainer",
    description="Analyze any GitHub repository with AI-powered insights.",
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174", "http://localhost:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(analyze_router)
app.include_router(what_if_router)
app.include_router(history_router)
app.include_router(flow_router)
app.include_router(system_design_router)
app.include_router(structure_router)
app.include_router(file_content_router)


@app.get("/")
async def root():
    return {"message": "AI Codebase Explainer API v2", "docs": "/docs"}
