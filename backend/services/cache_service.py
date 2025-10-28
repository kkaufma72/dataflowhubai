"""
Redis caching service for performance optimization.
"""

import json
from typing import Any, Optional

import redis.asyncio as aioredis

from utils.config import settings


class CacheService:
    """Service for caching data with Redis."""

    def __init__(self, redis_client: aioredis.Redis):
        self.redis = redis_client
        self.default_ttl = settings.REDIS_CACHE_TTL

    async def get(self, key: str) -> Optional[Any]:
        """
        Get value from cache.
        
        Args:
            key: Cache key
            
        Returns:
            Cached value or None if not found
        """
        try:
            value = await self.redis.get(key)
            if value is None:
                return None
            return json.loads(value)
        except Exception:
            return None

    async def set(
        self,
        key: str,
        value: Any,
        ttl: Optional[int] = None,
    ) -> bool:
        """
        Set value in cache.
        
        Args:
            key: Cache key
            value: Value to cache
            ttl: Time to live in seconds (uses default if not specified)
            
        Returns:
            True if successful, False otherwise
        """
        try:
            serialized = json.dumps(value)
            expire_time = ttl or self.default_ttl
            await self.redis.setex(key, expire_time, serialized)
            return True
        except Exception:
            return False

    async def delete(self, key: str) -> bool:
        """
        Delete value from cache.
        
        Args:
            key: Cache key
            
        Returns:
            True if deleted, False otherwise
        """
        try:
            await self.redis.delete(key)
            return True
        except Exception:
            return False

    async def exists(self, key: str) -> bool:
        """
        Check if key exists in cache.
        
        Args:
            key: Cache key
            
        Returns:
            True if exists, False otherwise
        """
        try:
            result = await self.redis.exists(key)
            return bool(result)
        except Exception:
            return False

    async def invalidate_pattern(self, pattern: str) -> int:
        """
        Invalidate all keys matching pattern.
        
        Args:
            pattern: Pattern to match (e.g., 'user:*')
            
        Returns:
            Number of keys deleted
        """
        try:
            cursor = 0
            deleted = 0
            while True:
                cursor, keys = await self.redis.scan(
                    cursor=cursor,
                    match=pattern,
                    count=100,
                )
                if keys:
                    deleted += await self.redis.delete(*keys)
                if cursor == 0:
                    break
            return deleted
        except Exception:
            return 0

    def cache_key(self, *parts: str) -> str:
        """
        Generate cache key from parts.
        
        Args:
            *parts: Key parts to join
            
        Returns:
            Cache key string
        """
        return ":".join(str(part) for part in parts)


async def get_cache_service(redis_client: aioredis.Redis) -> CacheService:
    """Factory function to get cache service instance."""
    return CacheService(redis_client)


