"""
Authentication and authorization routes.
"""

from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from jose import jwt

from dependencies.auth import get_current_user
from schemas.auth import Token, User, UserCreate, UserLogin
from utils.config import settings


router = APIRouter()


@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
async def register_user(user_data: UserCreate) -> Token:
    """
    Register a new user.
    
    Note: This is a simplified version. In production, integrate with Supabase Auth.
    
    Args:
        user_data: User registration data
        
    Returns:
        Authentication token
    """
    # In production, create user in Supabase
    # For now, return a mock token
    
    access_token_expires = timedelta(minutes=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": "mock-user-id", "email": user_data.email, "role": "user"},
        expires_delta=access_token_expires,
    )

    return Token(
        access_token=access_token,
        token_type="bearer",
        expires_in=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )


@router.post("/login", response_model=Token)
async def login_user(credentials: UserLogin) -> Token:
    """
    Authenticate user and return access token.
    
    Note: This is a simplified version. In production, integrate with Supabase Auth.
    
    Args:
        credentials: User login credentials
        
    Returns:
        Authentication token
    """
    # In production, verify with Supabase Auth
    # For now, return a mock token
    
    access_token_expires = timedelta(minutes=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": "mock-user-id", "email": credentials.email, "role": "user"},
        expires_delta=access_token_expires,
    )

    return Token(
        access_token=access_token,
        token_type="bearer",
        expires_in=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )


@router.get("/me", response_model=User)
async def get_current_user_info(
    current_user: User = Depends(get_current_user),
) -> User:
    """
    Get current authenticated user information.
    
    Args:
        current_user: Current authenticated user from token
        
    Returns:
        User information
    """
    return current_user


@router.post("/refresh", response_model=Token)
async def refresh_token(
    current_user: User = Depends(get_current_user),
) -> Token:
    """
    Refresh access token.
    
    Args:
        current_user: Current authenticated user
        
    Returns:
        New authentication token
    """
    access_token_expires = timedelta(minutes=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={
            "sub": current_user.id,
            "email": current_user.email,
            "role": current_user.role,
        },
        expires_delta=access_token_expires,
    )

    return Token(
        access_token=access_token,
        token_type="bearer",
        expires_in=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )


def create_access_token(data: dict, expires_delta: timedelta | None = None) -> str:
    """
    Create JWT access token.
    
    Args:
        data: Token payload data
        expires_delta: Token expiration time
        
    Returns:
        Encoded JWT token
    """
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    
    to_encode.update({"exp": expire})
    
    encoded_jwt = jwt.encode(
        to_encode,
        settings.JWT_SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM,
    )
    
    return encoded_jwt


