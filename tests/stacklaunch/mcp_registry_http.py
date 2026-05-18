"""HTTP helpers for StackApps MCP registry (read-only, production)."""

from __future__ import annotations

import json
from typing import Any
from urllib.parse import quote

import requests

BASE_URL = "https://stackapps.app"
UA = "StackLaunch MCP Registry Discovery Score Test/1.0"


def _headers() -> dict[str, str]:
    return {"User-Agent": UA, "Accept": "application/json, text/plain;q=0.9,*/*;q=0.8"}


def registry_search(q: str, timeout: float = 30.0) -> tuple[int, Any]:
    r = requests.get(
        f"{BASE_URL}/api/mcp-registry/search",
        params={"q": q},
        headers=_headers(),
        timeout=timeout,
    )
    try:
        body = r.json() if r.content else {}
    except json.JSONDecodeError:
        body = {"raw": r.text[:8000]}
    return r.status_code, body


def registry_tools(server_id: str, timeout: float = 30.0) -> tuple[int, Any]:
    r = requests.get(
        f"{BASE_URL}/api/mcp-registry/servers/{quote(server_id, safe='')}/tools",
        headers=_headers(),
        timeout=timeout,
    )
    try:
        body = r.json() if r.content else {}
    except json.JSONDecodeError:
        body = {"raw": r.text[:8000]}
    return r.status_code, body


def registry_blueprint(server_id: str, timeout: float = 30.0) -> tuple[int, str]:
    r = requests.get(
        f"{BASE_URL}/api/mcp-registry/servers/{quote(server_id, safe='')}/blueprint",
        headers=_headers(),
        timeout=timeout,
    )
    return r.status_code, r.text if r.text else ""
