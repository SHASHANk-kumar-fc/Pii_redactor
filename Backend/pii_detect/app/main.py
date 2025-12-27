from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import os
import logging

from .routes import router
from pii_detect.signup.routes_auth import router as auth_router
from fastapi.staticfiles import StaticFiles

# Environment configuration - example
ENV = os.getenv("ENV", "development")

# Logger setup for main app
logger = logging.getLogger("pii_detect.main")
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

app = FastAPI(title="PII Document Upload API", version="1.0.0")
app.mount("/redacted_docs", StaticFiles(directory="redacted_docs"), name="redacted_docs")

# CORS middleware setup (example: allow all origins)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routes from routes.py and auth routes
app.include_router(router)
app.include_router(auth_router)

@app.get("/")
async def root():
    logger.info("Root endpoint called")
    return {"message": "PII Detect API is running"}

# Basic error handling example (can be expanded)
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled error: {exc}")
    return JSONResponse(
        status_code=500,
        content={"detail": "An internal server error occurred."}
    )
