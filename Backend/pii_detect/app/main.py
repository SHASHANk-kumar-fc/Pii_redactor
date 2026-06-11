import logging
import os

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

from .frontend import mount_frontend
from .routes import router
from Backend.pii_detect.signup.routes_auth import router as auth_router

ENV = os.getenv("ENV", "development")

logger = logging.getLogger("pii_detect.main")
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s"
)

os.makedirs("redacted_docs", exist_ok=True)
app = FastAPI(title="PII Document Upload API", version="1.0.0")
app.mount("/redacted_docs", StaticFiles(directory="redacted_docs"), name="redacted_docs")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)
app.include_router(auth_router)

mount_frontend(app)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled error: {exc}")
    return JSONResponse(
        status_code=500,
        content={"detail": "An internal server error occurred."},
    )
