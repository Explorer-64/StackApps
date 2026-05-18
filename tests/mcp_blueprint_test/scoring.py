"""Score discovery calls for the MCP blueprint evaluation harness."""

from __future__ import annotations

from typing import Any
from urllib.parse import urlparse


TARGET_SERVER_ID = "imagcon"
TARGET_TOOL = "generate_pwa_icons"


def _url_is_imagcon(url: str, imagcon_app_url: str) -> bool:
    u = (url or "").strip()
    if not u:
        return False
    base = imagcon_app_url.rstrip("/")
    if u.startswith(base):
        return True
    p = urlparse(u)
    path = (p.path or "").strip("/")
    return path.startswith("stubs/imagcon") or path.startswith("stubs-bp/imagcon")


def score_tool_call(
    tool: str,
    args: dict[str, Any],
    *,
    locked: bool,
    imagcon_app_url: str,
) -> tuple[int, bool]:
    """Return (score_delta, lock_after)."""
    if locked:
        return 0, False
    if tool == "fetch_url":
        url = str(args.get("url") or "")
        if _url_is_imagcon(url, imagcon_app_url):
            return 0, True
        return 1, False
    if tool == "get_server_tools":
        sid = str(args.get("server_id") or "").strip()
        if sid == TARGET_SERVER_ID:
            return 0, True
        return 3, False
    return 0, False
