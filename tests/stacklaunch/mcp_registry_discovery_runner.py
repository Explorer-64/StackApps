"""
StackLaunch-style Claude agent loop: MCP registry discovery scoring vs stackapps.app.

Repo note: StackLaunch backend lives under server/stacklaunch.py (Anthropic Messages API).
There was no existing agent/tool-use test harness here — this follows that client's patterns.

Run from repo root:
  python -m tests.stacklaunch.mcp_registry_discovery_runner

Requires ANTHROPIC_API_KEY.
"""

from __future__ import annotations

import json
import logging
import os
import sys
from pathlib import Path
from typing import Any, Literal

import anthropic

_REPO_ROOT = Path(__file__).resolve().parents[2]
if str(_REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(_REPO_ROOT))

from tests.stacklaunch.mcp_registry_http import registry_blueprint, registry_search, registry_tools

TARGET_SERVER_ID = "imagcon"
MODEL = "claude-sonnet-4-6"

TASK_PROMPT = (
    "I need to generate a complete PWA icon set for my app. Find the right MCP server "
    "in the registry and identify the exact tool and parameters to call."
)

SYSTEM_PROMPT = (
    "You explore the public StackApps MCP server registry using only the tools provided. "
    "Use search to narrow candidates, then inspect servers until you know which server_id "
    "and tool satisfy the user's goal."
)


RunKind = Literal["with_blueprint", "without_blueprint"]


def _tool_definitions(include_blueprint: bool) -> list[dict[str, Any]]:
    tools: list[dict[str, Any]] = [
        {
            "name": "registry_search",
            "description": (
                "Search MCP servers by free text; returns server_id, app_name, description, "
                "blueprint_url, and tool_count (not full tool schemas)."
            ),
            "input_schema": {
                "type": "object",
                "properties": {"q": {"type": "string", "description": "Search query string"}},
                "required": ["q"],
            },
        },
        {
            "name": "registry_server_tools",
            "description": "Fetch full tool definitions for one registry server_id.",
            "input_schema": {
                "type": "object",
                "properties": {"server_id": {"type": "string"}},
                "required": ["server_id"],
            },
        },
    ]
    if include_blueprint:
        tools.append(
            {
                "name": "registry_server_blueprint",
                "description": (
                    "Fetch blueprint documentation as plain text for one registry server_id."
                ),
                "input_schema": {
                    "type": "object",
                    "properties": {"server_id": {"type": "string"}},
                    "required": ["server_id"],
                },
            }
        )
    return tools


def _invoke_http_tool(name: str, inp: dict[str, Any]) -> str:
    if name == "registry_search":
        status, body = registry_search(str(inp.get("q") or ""))
        payload = {"status_code": status, "body": body}
        return json.dumps(payload, indent=2)[:24000]
    if name == "registry_server_tools":
        status, body = registry_tools(str(inp.get("server_id") or ""))
        payload = {"status_code": status, "body": body}
        return json.dumps(payload, indent=2)[:24000]
    if name == "registry_server_blueprint":
        status, text = registry_blueprint(str(inp.get("server_id") or ""))
        payload = {"status_code": status, "blueprint_text": text[:24000]}
        return json.dumps(payload, indent=2)[:26000]
    raise ValueError(f"Unsupported tool {name!r}")


def _score_delta(name: str, inp: dict[str, Any], locked: bool) -> tuple[int, bool]:
    """Returns (delta, should_lock_after_this_call)."""
    if locked:
        return 0, False
    if name == "registry_search":
        return 1, False
    if name == "registry_server_tools":
        sid = str(inp.get("server_id") or "").strip()
        if sid == TARGET_SERVER_ID:
            return 0, True
        return 3, False
    if name == "registry_server_blueprint":
        sid = str(inp.get("server_id") or "").strip()
        if sid == TARGET_SERVER_ID:
            return 0, True
        return 1, False
    return 0, False


def run_mcp_registry_discovery_score(
    *,
    include_blueprint: bool,
    max_turns: int = 28,
    model: str = MODEL,
) -> dict[str, Any]:
    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        raise RuntimeError("ANTHROPIC_API_KEY is not set")

    run: RunKind = "with_blueprint" if include_blueprint else "without_blueprint"
    client = anthropic.Anthropic(api_key=api_key)
    tools = _tool_definitions(include_blueprint)

    messages: list[dict[str, Any]] = [{"role": "user", "content": TASK_PROMPT}]
    steps: list[dict[str, Any]] = []
    total_score = 0
    locked = False
    found_imagcon_at_step: int | None = None
    step_counter = 0

    for _ in range(max_turns):
        response = client.messages.create(
            model=model,
            max_tokens=8192,
            system=SYSTEM_PROMPT,
            tools=tools,
            messages=messages,
        )
        messages.append({"role": "assistant", "content": response.content})

        if response.stop_reason != "tool_use":
            break

        tool_blocks = [b for b in response.content if getattr(b, "type", None) == "tool_use"]
        user_payload: list[dict[str, Any]] = []

        for block in tool_blocks:
            step_counter += 1
            name = block.name
            raw_inp = block.input
            inp = raw_inp if isinstance(raw_inp, dict) else {}
            delta, lock_after = _score_delta(name, inp, locked)
            total_score += delta

            try:
                result_text = _invoke_http_tool(name, inp)
            except Exception as exc:
                result_text = json.dumps({"error": str(exc)})

            preview = result_text[:900]
            logging.info(
                "[%s] step=%s tool=%s score_delta=%s cumulative=%s args=%s",
                run,
                step_counter,
                name,
                delta,
                total_score,
                inp,
            )
            logging.info("response_preview=%s", preview.replace("\n", " ")[:480])

            steps.append(
                {
                    "step_index": step_counter,
                    "tool_name": name,
                    "arguments": inp,
                    "score_delta": delta,
                    "cumulative_score": total_score,
                    "response_preview": preview,
                    "locked_discovery_after_step": lock_after,
                }
            )

            if lock_after:
                locked = True
                found_imagcon_at_step = step_counter

            user_payload.append(
                {"type": "tool_result", "tool_use_id": block.id, "content": result_text}
            )

        messages.append({"role": "user", "content": user_payload})

        if locked:
            break

    return {
        "run": run,
        "steps": steps,
        "total_score": total_score,
        "found_imagcon_at_step": found_imagcon_at_step,
    }


def run_both_and_compare(*, max_turns: int = 28) -> dict[str, Any]:
    logging.info("=== Run A: without_blueprint ===")
    without = run_mcp_registry_discovery_score(include_blueprint=False, max_turns=max_turns)
    logging.info("=== Run B: with_blueprint ===")
    with_bp = run_mcp_registry_discovery_score(include_blueprint=True, max_turns=max_turns)

    delta_without_minus_with = without["total_score"] - with_bp["total_score"]
    summary = (
        f"comparison: without_blueprint_score={without['total_score']} "
        f"with_blueprint_score={with_bp['total_score']} "
        f"delta(without_minus_with)={delta_without_minus_with} "
        f"(positive = blueprint saved tokens, negative = blueprint cost more)"
    )
    logging.info(summary)

    return {
        "without_blueprint": without,
        "with_blueprint": with_bp,
        "delta_without_minus_with": delta_without_minus_with,
        "summary_line": summary,
    }


def main() -> None:
    logging.basicConfig(level=logging.INFO, format="%(message)s")
    out = run_both_and_compare()
    print(json.dumps(out, indent=2, default=str))


if __name__ == "__main__":
    main()
