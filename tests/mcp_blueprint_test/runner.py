"""
Open-source harness: compare token + scoring cost with vs without Blueprint Protocol
files reachable via candidate app_url.

Run from repo root:
  ANTHROPIC_API_KEY=... python -m tests.mcp_blueprint_test.runner
  ANTHROPIC_API_KEY=... python -m tests.mcp_blueprint_test.runner --run a
  ANTHROPIC_API_KEY=... python -m tests.mcp_blueprint_test.runner --run b

Requires ANTHROPIC_API_KEY and `requests` + `anthropic` packages.
"""

from __future__ import annotations

import argparse
import json
import logging
import os
import re
import sys
from pathlib import Path
from typing import Any, Literal
from urllib.parse import quote

import anthropic
import requests

_REPO_ROOT = Path(__file__).resolve().parents[2]
if str(_REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(_REPO_ROOT))

from tests.mcp_blueprint_test.scoring import TARGET_SERVER_ID, score_tool_call

MODEL = "claude-sonnet-4-6"
MAX_TURNS = 28
REGISTRY_TOOLS_URL_FMT = "https://stackapps.app/api/mcp-registry/servers/{}/tools"
FETCH_TRUNCATE = 20_000
HTTP_TIMEOUT = 15.0

RunKind = Literal["with_blueprint", "without_blueprint"]

_CANDIDATE_BASE = [
    {
        "server_id": "imagcon",
        "app_name": "Imagcon",
        "description": (
            "AI Image & Icon Studio - describe your app and get all 27 PWA icon files, Android adaptive "
            "icons, iOS sizes, and manifest.json in one ZIP. Built for Cursor, Lovable, Bolt, and v0 "
            "users who need real asset files fast."
        ),
        "app_url": "https://stackapps.app/stubs/imagcon",
    },
    {
        "server_id": "brand-kit",
        "app_name": "Brand Kit Studio",
        "description": (
            "Build cohesive brand identities from a name or hex color - color systems, typography stacks, "
            "logo SVGs, and favicon packages for web products."
        ),
        "app_url": "https://stackapps.app/stubs/brand-kit",
    },
    {
        "server_id": "image-gen-tools",
        "app_name": "Image Gen Tools",
        "description": (
            "Text-to-image API for developers - generate, upscale, remove backgrounds, and apply style "
            "transfers at any resolution. Production-ready for scripts and pipelines."
        ),
        "app_url": "https://stackapps.app/stubs/image-gen-tools",
    },
    {
        "server_id": "vector-icon-pack",
        "app_name": "Vector Icon Pack MCP",
        "description": (
            "50,000+ professionally designed SVG icons - search by keyword or style, download instantly, "
            "commercial license included."
        ),
        "app_url": "https://stackapps.app/stubs/vector-icon-pack",
    },
    {
        "server_id": "pwa-toolkit",
        "app_name": "PWA Toolkit",
        "description": (
            "PWA scaffolding and compliance - generate manifest.json, configure service workers, and audit "
            "any live URL for installability."
        ),
        "app_url": "https://stackapps.app/stubs/pwa-toolkit",
    },
]


def _candidates(with_blueprint: bool) -> list[dict[str, Any]]:
    out: list[dict[str, Any]] = []
    for row in _CANDIDATE_BASE:
        d = dict(row)
        if with_blueprint:
            d["app_url"] = d["app_url"].replace(
                "https://stackapps.app/stubs/", "https://stackapps.app/stubs-bp/"
            )
        out.append(d)
    return out


def _imagcon_app_url(candidates: list[dict[str, Any]]) -> str:
    for c in candidates:
        if c.get("server_id") == TARGET_SERVER_ID:
            return str(c["app_url"])
    raise RuntimeError("imagcon candidate missing")


def _tool_defs() -> list[dict[str, Any]]:
    return [
        {
            "name": "fetch_url",
            "description": (
                "HTTP GET a public URL and return response body as plain text (truncated). "
                "Use to load robots.txt, llms.txt, sitemap.xml, blueprint.txt under a candidate app_url."
            ),
            "input_schema": {
                "type": "object",
                "properties": {
                    "url": {
                        "type": "string",
                        "description": "Full HTTPS URL to fetch.",
                    },
                },
                "required": ["url"],
            },
        },
        {
            "name": "get_server_tools",
            "description": (
                "Fetch the full MCP tool definitions (names, descriptions, parameter schemas) for one server."
            ),
            "input_schema": {
                "type": "object",
                "properties": {
                    "server_id": {"type": "string", "description": "Registry server_id, e.g. imagcon."},
                },
                "required": ["server_id"],
            },
        },
    ]


def _fetch_url_tool(url: str) -> str:
    r = requests.get(
        url,
        timeout=HTTP_TIMEOUT,
        headers={"User-Agent": "mcp-blueprint-test/1.0"},
    )
    text = r.text if r.text else ""
    text = text[:FETCH_TRUNCATE]
    payload = {"status_code": r.status_code, "url": url, "body": text}
    return json.dumps(payload, indent=2)


def _get_server_tools_tool(server_id: str) -> str:
    sid = quote(server_id, safe="")
    r = requests.get(
        REGISTRY_TOOLS_URL_FMT.format(sid),
        timeout=HTTP_TIMEOUT,
        headers={"User-Agent": "mcp-blueprint-test/1.0", "Accept": "application/json"},
    )
    try:
        body = r.json() if r.content else {}
    except json.JSONDecodeError:
        body = {"raw": (r.text or "")[:FETCH_TRUNCATE]}
    payload = {"status_code": r.status_code, "body": body}
    out = json.dumps(payload, indent=2)
    return out[:FETCH_TRUNCATE]


def _extract_final_json(text: str) -> dict[str, Any] | None:
    t = text.strip()
    if not t:
        return None
    m = re.search(r"\{[\s\S]*\}", t)
    if not m:
        return None
    try:
        parsed: dict[str, Any] = json.loads(m.group())
        return parsed
    except json.JSONDecodeError:
        return None


def _task_prompt(candidates: list[dict[str, Any]]) -> str:
    lines = [
        "A search engine returned these MCP servers as candidates for your task.",
        "",
        "Task: Generate a complete set of PWA icons for a recipe app — all required sizes, maskable variants, "
        "iOS icons, Android icons, and manifest.json, packaged and ready to deploy.",
        "",
        "Candidates:",
        json.dumps(candidates, indent=2),
        "",
        "Identify the correct server_id and the exact tool name and parameters to call. Do not guess — "
        "investigate the candidates using the tools available to you (fetch blueprint and related docs from "
        "each app_url, and inspect tool schemas as needed).",
        "",
        "When finished, reply with ONLY a JSON object (no markdown fences) in this exact shape:",
        '{"selected_server":"<server_id>","selected_tool":"<tool_name>","parameters":{...}}',
    ]
    return "\n".join(lines)


SYSTEM_PROMPT = (
    "You are selecting one MCP server and one tool call for a deployment task. "
    "Use fetch_url to read blueprint.txt, llms.txt, robots.txt, or sitemap.xml from candidate app_url paths. "
    "Use get_server_tools to read full tool definitions from the public registry API. "
    "Do not invent servers outside the candidate list. After you are confident, output the JSON object exactly "
    "as specified — no additional prose."
)


def run_single(
    *,
    kind: RunKind,
    max_turns: int = MAX_TURNS,
    model: str = MODEL,
    api_key: str | None = None,
    base_url: str | None = None,
) -> dict[str, Any]:
    resolved_key = api_key or os.environ.get("ANTHROPIC_API_KEY")
    if not resolved_key:
        raise RuntimeError("No API key available (set ANTHROPIC_API_KEY or pass api_key)")

    candidates = _candidates(kind == "with_blueprint")
    imagcon_url = _imagcon_app_url(candidates)

    client_kwargs: dict[str, Any] = {"api_key": resolved_key}
    if base_url:
        client_kwargs["base_url"] = base_url
    client = anthropic.Anthropic(**client_kwargs)
    tools = _tool_defs()
    messages: list[dict[str, Any]] = [{"role": "user", "content": _task_prompt(candidates)}]

    total_input_tokens = 0
    total_output_tokens = 0
    tool_calls: list[dict[str, Any]] = []
    total_score = 0
    locked = False

    for _ in range(max_turns):
        response = client.messages.create(
            model=model,
            max_tokens=8192,
            system=SYSTEM_PROMPT,
            tools=tools,
            messages=messages,
        )
        usage = getattr(response, "usage", None)
        if usage is not None:
            total_input_tokens += int(getattr(usage, "input_tokens", 0) or 0)
            total_output_tokens += int(getattr(usage, "output_tokens", 0) or 0)

        messages.append({"role": "assistant", "content": response.content})

        if response.stop_reason != "tool_use":
            break

        tool_blocks = [b for b in response.content if getattr(b, "type", None) == "tool_use"]
        user_payload: list[dict[str, Any]] = []

        for block in tool_blocks:
            name = block.name
            raw_inp = block.input
            inp: dict[str, Any] = raw_inp if isinstance(raw_inp, dict) else {}
            delta, lock_after = score_tool_call(
                name,
                inp,
                locked=locked,
                imagcon_app_url=imagcon_url,
            )
            score_delta_record = 0 if locked else delta
            if not locked:
                total_score += delta
            tool_calls.append({"tool": name, "args": dict(inp), "score_delta": score_delta_record})

            if lock_after:
                locked = True

            try:
                if name == "fetch_url":
                    result_text = _fetch_url_tool(str(inp.get("url") or ""))
                elif name == "get_server_tools":
                    result_text = _get_server_tools_tool(str(inp.get("server_id") or ""))
                else:
                    result_text = json.dumps({"error": f"unknown tool {name}"})
            except Exception as exc:
                result_text = json.dumps({"error": str(exc)})

            user_payload.append({"type": "tool_result", "tool_use_id": block.id, "content": result_text})

        messages.append({"role": "user", "content": user_payload})

    final_text = ""
    for msg in reversed(messages):
        if msg.get("role") != "assistant":
            continue
        parts = msg.get("content")
        if not isinstance(parts, list):
            continue
        texts = [
            getattr(b, "text", "") for b in parts if getattr(b, "type", None) == "text"
        ]
        if texts:
            final_text = "".join(texts)
            break

    parsed = _extract_final_json(final_text)
    selected_server = None
    selected_tool = None
    if isinstance(parsed, dict):
        sel = parsed.get("selected_server")
        selected_server = str(sel) if sel is not None else None
        st = parsed.get("selected_tool")
        selected_tool = str(st) if st is not None else None

    return {
        "run": kind,
        "total_input_tokens": total_input_tokens,
        "total_output_tokens": total_output_tokens,
        "total_tokens": total_input_tokens + total_output_tokens,
        "tool_calls": tool_calls,
        "total_score": total_score,
        "correct_server_found": selected_server == TARGET_SERVER_ID,
        "correct_tool_identified": selected_tool == "generate_pwa_icons",
        "selected_server": selected_server,
        "selected_tool": selected_tool,
    }


def run_both_and_compare(
    *,
    max_turns: int = MAX_TURNS,
    model: str = MODEL,
    api_key: str | None = None,
    base_url: str | None = None,
) -> dict[str, Any]:
    logging.info("=== without_blueprint (run a / stubs) ===")
    without = run_single(kind="without_blueprint", max_turns=max_turns, model=model, api_key=api_key, base_url=base_url)
    logging.info("=== with_blueprint (run b / stubs-bp) ===")
    with_bp = run_single(kind="with_blueprint", max_turns=max_turns, model=model, api_key=api_key, base_url=base_url)

    tw = int(without["total_tokens"])
    tb = int(with_bp["total_tokens"])
    token_delta = tw - tb

    return {
        "without_blueprint": without,
        "with_blueprint": with_bp,
        "token_delta": token_delta,
        "score_delta": int(without["total_score"]) - int(with_bp["total_score"]),
    }


def main() -> None:
    logging.basicConfig(level=logging.INFO, format="%(message)s")
    ap = argparse.ArgumentParser()
    ap.add_argument(
        "--run",
        choices=("a", "b", "both"),
        default="both",
        help="a=without_blueprint (stubs), b=with_blueprint (stubs-bp), both=A then B.",
    )
    args = ap.parse_args()

    if args.run == "both":
        out = run_both_and_compare()
    elif args.run == "a":
        out = run_single(kind="without_blueprint")
    else:
        out = run_single(kind="with_blueprint")

    print(json.dumps(out, indent=2, default=str))


if __name__ == "__main__":
    main()
