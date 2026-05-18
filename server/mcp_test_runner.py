"""MCP registry HTTP, shared discovery scoring, and multi-provider dispatcher."""

from __future__ import annotations

import os

from typing import Any
from urllib.parse import quote

import requests

from .mcp_test_fixtures import GROUND_TRUTH_SERVER, SCORE_GET_SERVER_TOOLS

MAX_TURNS = 50

OPENROUTER_MODELS = {
    "claude": "anthropic/claude-sonnet-4-6:online",
    "grok": "x-ai/grok-4.3",
    "gpt4o": "openai/gpt-4.1",
}


def _registry_base_url() -> str:
    raw = (os.environ.get("STACKAPPS_REGISTRY_URL") or "https://stackapps.app").strip()
    return raw.rstrip("/")


def _registry_get(path_with_query: str, timeout: float = 30.0) -> Any:
    base = _registry_base_url()
    url = f"{base}{path_with_query}"
    r = requests.get(url, timeout=timeout)
    try:
        return r.json()
    except Exception:
        return {"http_status": r.status_code, "body": (r.text or "")[:8000]}


def _rewrite_stub_urls_for_blueprint(obj: Any) -> Any:
    if isinstance(obj, dict):
        out: dict[str, Any] = {}
        for k, v in obj.items():
            if k == "app_url" and isinstance(v, str):
                out[k] = v.replace("/stubs/", "/stubs-bp/")
            else:
                out[k] = _rewrite_stub_urls_for_blueprint(v)
        return out
    if isinstance(obj, list):
        return [_rewrite_stub_urls_for_blueprint(x) for x in obj]
    return obj


def fetch_test_candidates() -> list[dict[str, Any]]:
    data = _registry_get("/api/mcp-registry/test-candidates")
    if isinstance(data, list):
        return data
    if isinstance(data, dict):
        for key in ("servers", "candidates", "results", "items"):
            v = data.get(key)
            if isinstance(v, list):
                return v
    return []


def normalize_servers_for_discovery(servers: list[dict[str, Any]]) -> list[dict[str, Any]]:
    if len(servers) > 5:
        servers = servers[:5]
    if len(servers) != 5:
        return list(servers)
    imag = None
    rest: list[dict[str, Any]] = []
    for s in servers:
        sid = str(s.get("server_id", "")).strip().lower()
        if sid == GROUND_TRUTH_SERVER:
            imag = s
        else:
            rest.append(s)
    if imag is None or len(rest) != 4:
        return list(servers)
    return rest[:2] + [imag] + rest[2:]


def execute_fetch_url(url: str) -> Any:
    try:
        r = requests.get(url, timeout=10)
        if r.status_code >= 400:
            return {"error": f"HTTP {r.status_code}"}
        return r.text
    except requests.RequestException:
        return {"error": "HTTP 0"}


def execute_get_server_tools(server_id: str) -> Any:
    sid = quote(server_id or "", safe="")
    data = _registry_get(f"/api/mcp-registry/servers/{sid}/tools")
    if isinstance(data, dict):
        data = dict(data)
        data.pop("blueprint_url", None)
    return data


def _fetch_url_weight(url: str) -> int:
    u = url.lower()
    if u.endswith("/robots.txt"):
        return 1
    if u.endswith("/llms.txt"):
        return 10
    if u.endswith("/sitemap.xml"):
        return 3
    if u.endswith("/blueprint.txt"):
        return 1
    if "/blueprints/" in u and u.endswith(".txt"):
        return 1
    return 1


def run_discovery_tool_batch(
    calls: list[tuple[str, dict[str, Any]]],
    tool_calls_log: list[str],
    score_box: list[int],
) -> list[Any]:
    payloads: list[Any] = []
    for name, args in calls:
        if name == "fetch_url":
            url = str(args.get("url", "")).strip()
            payloads.append(execute_fetch_url(url))
            score_box[0] += _fetch_url_weight(url)
            tool_calls_log.append(url)
        elif name == "get_server_tools":
            sid = str(args.get("server_id", "")).strip()
            payloads.append(execute_get_server_tools(sid))
            score_box[0] += SCORE_GET_SERVER_TOOLS
            tool_calls_log.append(sid)
        else:
            payloads.append({"error": f"unknown tool {name!r}"})
    return payloads


def finalize_discovery_round(
    tool_calls_log: list[str],
    concluded: bool,
    all_assistant_text: list[str],
    discovery_score: int,
) -> dict[str, Any]:
    return {
        "stepsToFind": int(discovery_score),
        "wrongServersInspected": list(tool_calls_log),
        "foundCorrectServer": bool(concluded),
        "toolSelected": "",
        "reasoning": (all_assistant_text[-1] if all_assistant_text else "")[:8000],
        "steps": [s[:4000] for s in all_assistant_text],
    }


def run_discovery_golf_round_sync(
    model: str,
    system_prompt: str,
    user_message: str,
    naive: bool = False,
) -> dict[str, Any]:
    from .mcp_test_providers import run_discovery_gemini_sync, run_discovery_openrouter_sync
    from .mcp_test_discovery_tools import OPENROUTER_TOOLS, OPENROUTER_TOOLS_NAIVE

    m = (model or "").strip().lower()
    guided_or = OPENROUTER_TOOLS_NAIVE if naive else OPENROUTER_TOOLS
    if m == "gemini":
        return run_discovery_gemini_sync(system_prompt, user_message, naive=naive)
    if m in ("claude", "grok", "gpt4o"):
        return run_discovery_openrouter_sync(
            OPENROUTER_MODELS[m],
            system_prompt,
            user_message,
            tools=guided_or,
        )
    raise ValueError(f"unknown model: {model}")
