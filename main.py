"""
Sahil Ahamed – Portfolio Website
FastAPI application entry point.

Serves the Jinja2-rendered frontend, mounts static assets,
and includes API routers for contact and portfolio endpoints.
"""

from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import HTMLResponse, JSONResponse, Response
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from starlette.middleware.base import BaseHTTPMiddleware

from database import connect_db, close_db
from routes.contact import router as contact_router
from routes.portfolio import router as portfolio_router

# ── Path constants ───────────────────────────────────────────────────────

BASE_DIR: Path = Path(__file__).resolve().parent
STATIC_DIR: Path = BASE_DIR / "static"
TEMPLATES_DIR: Path = BASE_DIR / "templates"


# ── Cache-Control middleware ─────────────────────────────────────────────
# Browsers cache static assets aggressively so refresh is instant.

STATIC_CACHE_RULES: list[tuple[str, str]] = [
    (".js",    "public, max-age=31536000, immutable"),   # 1 year (versioned)
    (".css",   "public, max-age=31536000, immutable"),   # 1 year (versioned)
    (".woff",  "public, max-age=31536000, immutable"),
    (".woff2", "public, max-age=31536000, immutable"),
    (".otf",   "public, max-age=31536000, immutable"),
    (".ttf",   "public, max-age=31536000, immutable"),
    (".jpg",   "public, max-age=604800"),   # 7 days
    (".jpeg",  "public, max-age=604800"),
    (".png",   "public, max-age=604800"),
    (".webp",  "public, max-age=604800"),
    (".mp4",   "public, max-age=604800"),
    (".webm",  "public, max-age=604800"),
]


class CacheControlMiddleware(BaseHTTPMiddleware):
    """Attach browser cache headers to all /static responses."""

    async def dispatch(self, request: Request, call_next):
        response: Response = await call_next(request)
        path = request.url.path.lower()
        if path.startswith("/static"):
            for ext, directive in STATIC_CACHE_RULES:
                if path.endswith(ext):
                    response.headers["Cache-Control"] = directive
                    break
        return response


# ── Lifespan (replaces deprecated on_event) ─────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup / shutdown lifecycle for the FastAPI app."""
    # ── Startup ──
    await connect_db()
    yield
    # ── Shutdown ──
    await close_db()


# ── App factory ──────────────────────────────────────────────────────────

app = FastAPI(
    title="Sahil Ahamed Portfolio",
    description="Backend API for Sahil Ahamed's video-editing portfolio website.",
    version="1.0.0",
    lifespan=lifespan,
)

# ── Middleware (order matters: outermost added last) ─────────────────────

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(GZipMiddleware, minimum_size=1000)   # compress text responses
app.add_middleware(CacheControlMiddleware)              # static asset caching

# ── Static files ─────────────────────────────────────────────────────────

app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")

# ── Templates ────────────────────────────────────────────────────────────

templates = Jinja2Templates(directory=str(TEMPLATES_DIR))

# ── Routers ──────────────────────────────────────────────────────────────

app.include_router(contact_router)
app.include_router(portfolio_router)


# ── Root page ────────────────────────────────────────────────────────────

@app.get("/", response_class=HTMLResponse)
async def serve_index(request: Request) -> HTMLResponse:
    """Render the single-page portfolio."""
    return templates.TemplateResponse(
        "index.html",
        {"request": request, "show_testimonials": False}
    )


# ── Global error handlers ────────────────────────────────────────────────

@app.exception_handler(404)
async def not_found_handler(request: Request, exc) -> HTMLResponse | JSONResponse:
    """Return a friendly JSON 404 for API requests, HTML for everything else."""
    if request.url.path.startswith("/api"):
        return JSONResponse(
            status_code=404,
            content={"detail": "The requested resource was not found."},
        )
    # For non-API routes, redirect to home
    return templates.TemplateResponse(
        "index.html",
        {"request": request, "show_testimonials": False},
        status_code=404
    )


@app.exception_handler(500)
async def internal_error_handler(request: Request, exc) -> JSONResponse:
    """Catch-all for unhandled server errors."""
    return JSONResponse(
        status_code=500,
        content={"detail": "An internal server error occurred. Please try again later."},
    )


# ── Dev server ───────────────────────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
