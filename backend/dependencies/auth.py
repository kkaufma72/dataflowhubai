"""
Authentication and authorization dependencies.
"""

from typing import Optional
import time
import httpx

from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt

from schemas.auth import TokenPayload, User
from utils.config import settings

security = HTTPBearer(auto_error=False)

SUPABASE_ISSUER = getattr(settings, "SUPABASE_ISSUER", "https://bcobpxgktvgfsffdsiog.supabase.co/auth/v1")
SUPABASE_AUDIENCE = getattr(settings, "SUPABASE_AUDIENCE", "authenticated")
SUPABASE_JWT_SECRET = getattr(settings, "SUPABASE_JWT_SECRET", None) or getattr(settings, "JWT_SECRET_KEY", None)
DEBUG = bool(getattr(settings, "DEBUG", False))

# Simple in-memory JWKS cache with TTL
_JWKS_KEYS = None
_JWKS_FETCHED_AT = 0.0
_JWKS_TTL = 3600.0  # seconds


def get_jwks_keys():
    global _JWKS_KEYS, _JWKS_FETCHED_AT
    now = time.time()
    if not _JWKS_KEYS or (now - _JWKS_FETCHED_AT) > _JWKS_TTL:
        JWKS_URL = f"{SUPABASE_ISSUER}/.well-known/jwks.json"
        try:
            resp = httpx.get(JWKS_URL, timeout=5.0)
            resp.raise_for_status()
            data = resp.json()
            _JWKS_KEYS = data.get("keys", [])
            _JWKS_FETCHED_AT = now
        except Exception as e:
            if DEBUG:
                print(f"JWKS fetch failed: {e}")
            # Keep old keys if present; else empty
            _JWKS_KEYS = _JWKS_KEYS or []
    return _JWKS_KEYS


def verify_supabase_jwt_es256_via_jwks(token: str) -> dict:
    """
    Verify ES256 tokens using Supabase JWKS.
    """
    # jose supports passing a JWKS dict (with "keys") directly
    keys = get_jwks_keys()
    if not keys:
        raise JWTError("JWKS unavailable")

    jwks = {"keys": keys}
    return jwt.decode(
        token,
        jwks,
        algorithms=["ES256"],
        audience=SUPABASE_AUDIENCE,
        issuer=SUPABASE_ISSUER,
        options={
            "verify_signature": True,
            "verify_aud": True,
            "verify_iss": True,
            "verify_exp": True,
            "require_exp": True,
            "require_iat": False,
        },
    )


def verify_supabase_jwt_hs256(token: str) -> dict:
    """
    Verify HS256 tokens (legacy/shared secret).
    """
    if not SUPABASE_JWT_SECRET:
        raise JWTError("JWT secret not configured for HS256")
    return jwt.decode(
        token,
        SUPABASE_JWT_SECRET,
        algorithms=["HS256"],
        audience=SUPABASE_AUDIENCE,
        issuer=SUPABASE_ISSUER,
        options={
            "verify_signature": True,
            "verify_aud": True,
            "verify_iss": True,
            "verify_exp": True,
            "require_exp": True,
            "require_iat": False,
        },
    )


def verify_supabase_jwt(token: str) -> dict:
    """
    Auto-detect and verify Supabase JWT (ES256 via JWKS or HS256 via shared secret).
    Prefer ES256; keep HS256 only if you still have old tokens in circulation.
    """
    import sys

    try:
        headers = jwt.get_unverified_header(token)
        alg = headers.get("alg")
        kid = headers.get("kid")
        if DEBUG:
            print(f"JWT header alg={alg} kid={kid}", file=sys.stderr)
    except Exception as e:
        # If header parse fails, default to HS256 to raise a clear error
        if DEBUG:
            print(f"Failed to parse JWT header: {e}", file=sys.stderr)
        alg = None

    if alg == "ES256":
        # New Supabase ECC (P-256) tokens
        try:
            return verify_supabase_jwt_es256_via_jwks(token)
        except JWTError as e:
            if DEBUG:
                print(f"ES256 verify failed: {e}", file=sys.stderr)
            raise
    elif alg == "HS256":
        # Legacy/shared-secret tokens
        try:
            return verify_supabase_jwt_hs256(token)
        except JWTError as e:
            if DEBUG:
                print(f"HS256 verify failed: {e}", file=sys.stderr)
            raise
    else:
        # Unknown/missing alg: try ES256 first (current standard), then HS256
        try:
            return verify_supabase_jwt_es256_via_jwks(token)
        except Exception as es_err:
            if DEBUG:
                print(f"Tried ES256 and failed: {es_err}", file=sys.stderr)
            try:
                return verify_supabase_jwt_hs256(token)
            except Exception as hs_err:
                if DEBUG:
                    print(f"Tried HS256 and failed: {hs_err}", file=sys.stderr)
                raise JWTError("Unsupported or invalid JWT algorithm")


async def get_current_user(
    request: Request,
    creds: HTTPAuthorizationCredentials = Depends(security),
) -> User:
    """
    Validate JWT token and return current user.
    """
    # Skip auth for CORS preflight
    if request.method == "OPTIONS":
        return User(id="preflight", email="", role="user")  # not used by handlers

    if not creds or creds.scheme.lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing auth token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = creds.credentials

    try:
        payload = verify_supabase_jwt(token)
    except JWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id: Optional[str] = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token: missing subject",
            headers={"WWW-Authenticate": "Bearer"},
        )

    email: Optional[str] = payload.get("email")
    role: str = payload.get("role", "user")

    user = User(
        id=user_id,
        email=email or "",
        role=role,
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


