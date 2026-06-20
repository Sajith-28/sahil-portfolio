"""
Portfolio media API routes.
Scans the local filesystem to serve lists of video and image files
without requiring database queries. Enriches video data with cached
duration and poster metadata from metadata.json for fast page loads.
"""

import json
from pathlib import Path

from fastapi import APIRouter, HTTPException, status

router = APIRouter(prefix="/api", tags=["Portfolio"])

# Base directory for all static assets
STATIC_DIR: Path = Path(__file__).resolve().parent.parent / "static"

# Supported file extensions
VIDEO_EXTENSIONS: set[str] = {".mp4", ".mov", ".webm", ".avi"}
IMAGE_EXTENSIONS: set[str] = {".jpg", ".jpeg", ".png", ".webp"}

# Valid video categories (map to folder names under /static/videos/)
VALID_CATEGORIES: list[str] = [
    "doctors",
    "entrepreneurs",
    "content_creators",
    "retail_shops",
]


def _load_metadata() -> dict:
    """Load the pre-generated video metadata cache (duration + poster paths)."""
    metadata_file = STATIC_DIR / "videos" / "metadata.json"
    if metadata_file.is_file():
        try:
            with open(metadata_file, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            pass
    return {}


def _scan_files(directory: Path, extensions: set[str]) -> list[str]:
    """
    Return a sorted list of filenames in *directory* whose suffix
    matches one of the given *extensions*.  Returns an empty list
    if the directory does not exist.
    """
    if not directory.is_dir():
        return []
    return sorted(
        f.name
        for f in directory.iterdir()
        if f.is_file() and f.suffix.lower() in extensions
    )


def _enrich_video_files(category: str, files: list[str], metadata: dict) -> list[dict]:
    """
    Enrich a list of filenames with duration and poster metadata.
    Returns a list of dicts: {filename, duration, poster}
    """
    cat_meta = metadata.get(category, {})
    enriched = []
    for filename in files:
        entry = cat_meta.get(filename, {})
        enriched.append({
            "filename": filename,
            "duration": entry.get("duration", ""),
            "poster": entry.get("poster", ""),
        })
    return enriched


# ── Video endpoints ─────────────────────────────────────────────────────


@router.get("/videos/all")
async def get_all_videos() -> dict:
    """Return every video file grouped by category, enriched with metadata."""
    metadata = _load_metadata()
    categories: dict[str, list[dict]] = {}
    for category in VALID_CATEGORIES:
        cat_meta = metadata.get(category, {})
        files = list(cat_meta.keys())
        categories[category] = _enrich_video_files(category, files, metadata)
    return {"categories": categories}


@router.get("/videos/long_form")
async def get_long_form_videos() -> list:
    """Read and return list of YouTube-linked long videos from links.json."""
    links_file = STATIC_DIR / "videos" / "long_form" / "links.json"
    if not links_file.is_file():
        return []
    try:
        with open(links_file, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to read links.json: {str(e)}"
        )


@router.get("/videos/{category}")
async def get_videos_by_category(category: str) -> dict:
    """Return video files for a single category, enriched with metadata."""
    if category not in VALID_CATEGORIES:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=(
                f"Category '{category}' not found. "
                f"Valid categories: {', '.join(VALID_CATEGORIES)}"
            ),
        )

    metadata = _load_metadata()
    cat_meta = metadata.get(category, {})
    files = list(cat_meta.keys())
    return {
        "category": category,
        "files": _enrich_video_files(category, files, metadata)
    }


# ── Image endpoints ─────────────────────────────────────────────────────


@router.get("/images/thumbnails")
async def get_thumbnails() -> dict:
    """Return all thumbnail images."""
    folder = STATIC_DIR / "images" / "thumbnails"
    return {"files": _scan_files(folder, IMAGE_EXTENSIONS)}


@router.get("/images/photography")
async def get_photography() -> dict:
    """Return all photography images."""
    folder = STATIC_DIR / "images" / "photography"
    return {"files": _scan_files(folder, IMAGE_EXTENSIONS)}
