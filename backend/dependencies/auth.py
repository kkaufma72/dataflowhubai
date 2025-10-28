"""
Authentication and authorization dependencies.
"""

from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt

from schemas.auth import TokenPayload, User
from utils.config import settings


security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> User:
    """
    Validate JWT token and return current user.
    
    Raises:
        HTTPException: If token is invalid or expired.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    token = credentials.credentials

    try:
        payload = jwt.decode(
            token,
            settings.SUPABASE_JWT_SECRET or settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM],
        )
        
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
            
        email: Optional[str] = payload.get("email")
        role: str = payload.get("role", "user")
        
        token_data = TokenPayload(
            sub=user_id,
            email=email,
            role=role,
        )
        
    except JWTError:
        raise credentials_exception

    # Create user object from token
    user = User(
        id=token_data.sub,
        email=token_data.email or "",
        role=token_data.role,
    )

    return user


async def get_current_active_user(
    current_user: User = Depends(get_current_user),
) -> User:
    """Get current active user (additional checks can be added)."""
    return current_user


async def get_admin_user(
    current_user: User = Depends(get_current_user),
) -> User:
    """
    Get current user and verify admin privileges.
    
    Raises:
        HTTPException: If user is not an admin.
    """
    if current_user.role not in ["admin", "superadmin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required",
        )
    return current_user


def require_subscription(subscription_tier: str):
    """
    Dependency factory to check user subscription tier.
    
    Args:
        subscription_tier: Required subscription tier (free, pro, enterprise)
    
    Returns:
        Dependency function that validates subscription
    """
    async def check_subscription(
        current_user: User = Depends(get_current_user),
    ) -> User:
        tier_hierarchy = {"free": 0, "pro": 1, "enterprise": 2}
        
        user_tier_level = tier_hierarchy.get(current_user.subscription_tier, 0)
        required_tier_level = tier_hierarchy.get(subscription_tier, 0)
        
        if user_tier_level < required_tier_level:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Subscription tier '{subscription_tier}' or higher required",
            )
        
        return current_user
    
    return check_subscription


