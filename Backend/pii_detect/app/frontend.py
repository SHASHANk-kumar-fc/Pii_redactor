import logging
import os
from pathlib import Path

from fastapi import FastAPI
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

logger = logging.getLogger("pii_detect.main")

PROJECT_ROOT = Path(__file__).resolve().parents[3]
FRONTEND_DIST = PROJECT_ROOT / "frontend-app" / "dist"
INDEX_HTML = FRONTEND_DIST / "index.html"


def mount_frontend(app: FastAPI) -> None:
    """Serve the Vite/React production build with SPA fallback."""
    if not INDEX_HTML.is_file():
        logger.warning(
            "Frontend build not found at %s — run `npm run build` in frontend-app/",
            FRONTEND_DIST,
        )
        return

    assets_dir = FRONTEND_DIST / "assets"
    if assets_dir.is_dir():
        app.mount(
            "/assets",
            StaticFiles(directory=str(assets_dir)),
            name="frontend_assets",
        )

    img_dir = FRONTEND_DIST / "img"
    if img_dir.is_dir():
        app.mount(
            "/img",
            StaticFiles(directory=str(img_dir)),
            name="frontend_img",
        )

    favicon_path = FRONTEND_DIST / "favicon.svg"
    if favicon_path.is_file():

        @app.get("/favicon.svg", include_in_schema=False)
        async def favicon() -> FileResponse:
            return FileResponse(favicon_path)

    @app.get("/{full_path:path}", include_in_schema=False)
    async def spa_fallback(full_path: str) -> FileResponse:
        if full_path:
            candidate = FRONTEND_DIST / full_path
            if candidate.is_file():
                return FileResponse(candidate)
        return FileResponse(INDEX_HTML)
