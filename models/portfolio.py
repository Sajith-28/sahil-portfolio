"""
Pydantic models for Portfolio items.
Designed for a future CMS where Sahil can manage
his video/image portfolio entries from an admin panel.
"""

from datetime import datetime, timezone
from pydantic import BaseModel, field_validator


# Portfolio categories that map to folder names in /static/videos/
VALID_CATEGORIES: list[str] = [
    "doctors",
    "entrepreneurs",
    "content_creators",
    "retail_shops",
    "parlours",
    "long_form",
]

# Supported media types
VALID_TYPES: list[str] = ["video", "image"]


class PortfolioItem(BaseModel):
    """Schema for a single portfolio entry (video or image)."""

    title: str
    category: str
    filename: str
    type: str  # "video" | "image"
    created_at: datetime = None  # type: ignore[assignment]

    def __init__(self, **data):
        super().__init__(**data)
        if self.created_at is None:
            self.created_at = datetime.now(timezone.utc)

    @field_validator("title")
    @classmethod
    def title_must_not_be_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Title cannot be empty")
        return v.strip()

    @field_validator("category")
    @classmethod
    def category_must_be_valid(cls, v: str) -> str:
        if v not in VALID_CATEGORIES:
            raise ValueError(
                f"Invalid category '{v}'. Must be one of: {', '.join(VALID_CATEGORIES)}"
            )
        return v

    @field_validator("type")
    @classmethod
    def type_must_be_valid(cls, v: str) -> str:
        if v not in VALID_TYPES:
            raise ValueError(
                f"Invalid type '{v}'. Must be one of: {', '.join(VALID_TYPES)}"
            )
        return v

    class Config:
        json_schema_extra = {
            "example": {
                "title": "Dental Clinic Promo",
                "category": "doctors",
                "filename": "dental_promo.mp4",
                "type": "video",
            }
        }
