"""
Pydantic models for the Contact form submission.
Validates incoming data before it reaches the database.
"""

from datetime import datetime, timezone
from pydantic import BaseModel, EmailStr, field_validator


# Services offered – used for front-end dropdown AND server-side validation
ALLOWED_SERVICES: list[str] = [
    "Reels Editing",
    "Long Form Editing",
    "Photography",
    "Videography",
    "AI Video",
    "Thumbnail Design",
    "Other",
]


class ContactForm(BaseModel):
    """Schema for a contact-form submission."""

    name: str
    email: EmailStr
    service: str
    brief: str
    created_at: datetime = None  # type: ignore[assignment]

    def __init__(self, **data):
        super().__init__(**data)
        if self.created_at is None:
            self.created_at = datetime.now(timezone.utc)

    @field_validator("name")
    @classmethod
    def name_must_not_be_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Name cannot be empty")
        return v.strip()

    @field_validator("service")
    @classmethod
    def service_must_be_allowed(cls, v: str) -> str:
        if v not in ALLOWED_SERVICES:
            raise ValueError(
                f"Invalid service '{v}'. Must be one of: {', '.join(ALLOWED_SERVICES)}"
            )
        return v

    @field_validator("brief")
    @classmethod
    def brief_must_not_be_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Project brief cannot be empty")
        return v.strip()

    class Config:
        json_schema_extra = {
            "example": {
                "name": "John Doe",
                "email": "john@example.com",
                "service": "Video Editing",
                "brief": "I need a 60-second promo video for my startup.",
            }
        }
