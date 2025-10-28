"""
Authentication and user schemas.
"""

from typing import Optional

from pydantic import BaseModel, EmailStr, Field


class TokenPayload(BaseModel):
    """JWT token payload schema."""

    sub: str  # Subject (user ID)
    email: Optional[str] = None
    role: str = "user"
    exp: Optional[int] = None


class Token(BaseModel):
    """Authentication token response."""

    access_token: str
    refresh_token: Optional[str] = None
    token_type: str = "bearer"
    expires_in: int


class User(BaseModel):
    """User model."""

    id: str
    email: str
    role: str = "user"
    subscription_tier: str = "free"
    is_active: bool = True
    metadata: Optional[dict] = None


class UserCreate(BaseModel):
    """User creation schema."""

    email: EmailStr
    password: str = Field(min_length=8, max_length=100)
    full_name: Optional[str] = None


class UserLogin(BaseModel):
    """User login schema."""

    email: EmailStr
    password: str


class UserUpdate(BaseModel):
    """User update schema."""

    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    subscription_tier: Optional[str] = None
    metadata: Optional[dict] = None


