"""
Skill guide routes for surfacing local Codex skills in the UI.
"""

from __future__ import annotations

import json
import os
from pathlib import Path
from typing import AsyncGenerator, List, Tuple

import httpx
from fastapi import APIRouter, HTTPException, status
from fastapi.responses import StreamingResponse
from pydantic import BaseModel


router = APIRouter()

# Skills live under the Codex home directory.
SKILL_ROOT = Path.home() / ".codex" / "skills"


class SkillSummary(BaseModel):
    """Minimal skill metadata returned in listings."""

    id: str
    name: str
    description: str


class SkillDetail(SkillSummary):
    """Full skill content."""

    content: str
    path: str


class AssistantRequest(BaseModel):
    """Prompt payload for the vLLM-backed skill assistant."""

    prompt: str
    model: str | None = None


def _extract_frontmatter(text: str) -> Tuple[str | None, str | None, int]:
    """
    Parse minimal YAML-ish frontmatter.

    Returns: (name, description, end_index_of_frontmatter_block_or_-1)
    """
    lines = text.splitlines()
    if not lines or lines[0].strip() != "---":
        return None, None, -1

    name = None
    description = None
    end_idx = -1
    for i in range(1, len(lines)):
        line = lines[i].strip()
        if line == "---":
            end_idx = i
            break
        if line.startswith("name:"):
            name = line.split(":", 1)[1].strip()
        if line.startswith("description:"):
            description = line.split(":", 1)[1].strip()
    return name, description, end_idx


def _load_skill(skill_dir: Path) -> SkillDetail:
    """Read a SKILL.md and return metadata + content."""
    skill_file = skill_dir / "SKILL.md"
    if not skill_file.exists():
        raise HTTPException(status_code=404, detail="Skill not found")

    text = skill_file.read_text(encoding="utf-8")
    meta_name, meta_desc, fm_end = _extract_frontmatter(text)

    if fm_end >= 0:
        # Convert the line index returned from _extract_frontmatter back into
        # a character slice so the YAML metadata is fully removed.
        lines = text.splitlines()
        content = "\n".join(lines[fm_end + 1 :])
    else:
        content = text

    return SkillDetail(
        id=skill_dir.name,
        name=meta_name or skill_dir.name.replace("-", " ").title(),
        description=meta_desc or "Skill documentation",
        content=content.strip(),
        path=str(skill_file),
    )


@router.get("/skills", response_model=List[SkillSummary])
async def list_skills() -> List[SkillSummary]:
    """List available Codex skills from the local skills directory."""
    if not SKILL_ROOT.exists():
        return []

    summaries: List[SkillSummary] = []
    for skill_dir in sorted(SKILL_ROOT.iterdir()):
        skill_file = skill_dir / "SKILL.md"
        if not skill_file.is_file():
            continue
        try:
            skill = _load_skill(skill_dir)
            summaries.append(
                SkillSummary(
                    id=skill.id,
                    name=skill.name,
                    description=skill.description,
                )
            )
        except Exception:
            # Skip malformed skills but do not break the list endpoint.
            continue

    return summaries


@router.get("/skills/{skill_id}", response_model=SkillDetail)
async def get_skill(skill_id: str) -> SkillDetail:
    """Return full content for a given skill."""
    skill_dir = (SKILL_ROOT / skill_id).resolve()

    # Prevent path traversal
    if SKILL_ROOT not in skill_dir.parents:
        raise HTTPException(status_code=404, detail="Skill not found")

    return _load_skill(skill_dir)


@router.post("/skills/assistant/stream")
async def stream_skill_assistant(request: AssistantRequest):
    """
    Proxy a streaming chat completion request to a vLLM server.

    Returns a plain text stream of the generated content; the client
    handles incremental rendering.
    """
    endpoint = os.getenv("VLLM_ENDPOINT", "http://localhost:8000/v1/chat/completions")
    api_key = os.getenv("VLLM_API_KEY")
    headers = {"Content-Type": "application/json"}
    if api_key:
        headers["Authorization"] = f"Bearer {api_key}"

    payload = {
        "model": request.model or "skills-sft",
        "stream": True,
        "messages": [
            {
                "role": "system",
                "content": (
                    "You are the DataFlowHub Skills assistant. "
                    "Respond concisely with an actionable plan for ML/skills workflows. "
                    "Prefer JSON blocks when possible."
                ),
            },
            {"role": "user", "content": request.prompt},
        ],
    }

    async def _event_stream() -> AsyncGenerator[str, None]:
        async with httpx.AsyncClient(timeout=None) as client:
            try:
                resp = await client.stream("POST", endpoint, headers=headers, json=payload)
            except httpx.HTTPError as exc:
                yield f"ERROR: vLLM upstream unreachable ({exc})"
                return

            async with resp:
                if resp.status_code != status.HTTP_200_OK:
                    detail = await resp.aread()
                    msg = detail.decode("utf-8", "ignore") or f"HTTP {resp.status_code}"
                    yield f"ERROR: vLLM upstream error ({msg})"
                    return

                async for line in resp.aiter_lines():
                    if not line:
                        continue
                    raw = line
                    if raw.startswith("data:"):
                        raw = raw[len("data:") :].strip()
                    if raw.strip() == "[DONE]":
                        break
                    try:
                        chunk = json.loads(raw)
                        choice = chunk.get("choices", [{}])[0]
                        delta = choice.get("delta") or choice.get("message") or {}
                        content = delta.get("content")
                        if content:
                            yield content
                    except Exception:
                        # Skip malformed lines to keep stream alive.
                        continue
            # Explicitly end stream
            yield ""

    return StreamingResponse(_event_stream(), media_type="text/plain")
