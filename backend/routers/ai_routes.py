"""
AI proxy routes to keep API keys on the backend.
"""

from __future__ import annotations

import os
from typing import List, Literal, Optional

import httpx
from fastapi import APIRouter, Depends, HTTPException, Response, status
from pydantic import BaseModel

from dependencies.auth import get_current_user
from schemas.auth import User


router = APIRouter()


class ChatMessage(BaseModel):
    """Single chat message."""

    role: Literal["system", "user", "assistant"]
    content: str


class ChatRequest(BaseModel):
    """Chat completion request payload."""

    messages: List[ChatMessage]
    model: Optional[str] = None  # resolved from env if not provided
    temperature: float = 0.9
    max_tokens: Optional[int] = 2000


@router.post("/ai/chat")
async def chat_completion(
    payload: ChatRequest,
    current_user: User = Depends(get_current_user),
) -> dict:
    """
    Proxy chat completions to OpenAI using server-side credentials.
    """
    # Resolve base URL and model defaults to keep a single model across the app.
    vllm_endpoint = os.getenv("VLLM_ENDPOINT")
    default_model = os.getenv("VLLM_MODEL") or os.getenv("OPENAI_MODEL") or "gpt-4"
    base_url = vllm_endpoint or "https://api.openai.com/v1/chat/completions"
    model = payload.model or default_model

    api_key = os.getenv("OPENAI_API_KEY")
    # vLLM typically runs without auth; only require key for OpenAI-hosted endpoint.
    if "openai.com" in base_url and not api_key:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="OpenAI API key is not configured on the server.",
        )

    headers = {
        "Content-Type": "application/json",
    }
    if api_key:
        headers["Authorization"] = f"Bearer {api_key}"

    body = {
        "model": model,
        "messages": [msg.model_dump() for msg in payload.messages],
        "temperature": payload.temperature,
        "max_tokens": payload.max_tokens,
        "user": current_user.id,
    }

    try:
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(
                base_url,
                headers=headers,
                json=body,
            )
    except httpx.HTTPError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Failed to reach OpenAI: {exc}",
        )

    if resp.status_code != status.HTTP_200_OK:
        try:
            error_detail = resp.json()
        except Exception:
            error_detail = {"message": resp.text}
        raise HTTPException(status_code=resp.status_code, detail=error_detail)

    # FastAPI CORS middleware will add headers automatically
    return resp.json()
