"""MCP blueprint discovery-efficiency test (golf scoring across two rounds)."""

from __future__ import annotations

import asyncio
from typing import Any

from .mcp_test_runner import _rewrite_stub_urls_for_blueprint, fetch_test_candidates, normalize_servers_for_discovery, run_discovery_golf_round_sync

NAIVE_SYSTEM_PROMPT = "Find the tool to complete the user's task as efficiently as possible. State your answer when ready."

SYSTEM_PROMPT = """You are an autonomous agent selecting the best MCP server and tool for a task.

Each server lists an app_url and server_id in the user message.

For every server:
- Compose candidate URLs under that app_url and use fetch_url to read what publishers expose (for example directives and links in robots.txt or llms.txt, and pointers from sitemap.xml).
- Optionally follow URLs you observe in those bodies when they help characterize the server relative to the task.

Rules:
- You MUST investigate every listed server before you choose a winner.
- Do not stop after the first server that looks plausible.

Once you settle on one server_id, call get_server_tools with that server_id, then reply with which server wins, which tool, and suggested parameters."""


def _discovery_user_message(servers: list[dict[str, Any]], task: str) -> str:
    lines = ["Available MCP servers:"]
    for s in servers:
        app_name = str(s.get("app_name") or s.get("name") or "").strip()
        sid = str(s.get("server_id") or "").strip()
        url = str(s.get("app_url") or "").strip()
        desc = str(s.get("description") or "").strip()
        lines.append(f"- {app_name} | server_id: {sid} | app_url: {url}")
        lines.append(f"  {desc}")
    lines.append("")
    lines.append(f"Task: {task.strip()}")
    return "\n".join(lines)


def _verdict(without: dict[str, Any], with_bp: dict[str, Any]) -> str:
    wf = bool(without.get("foundCorrectServer"))
    bf = bool(with_bp.get("foundCorrectServer"))
    ws = int(without.get("stepsToFind", 0))
    bs = int(with_bp.get("stepsToFind", 0))

    if not wf and not bf:
        return "Neither round concluded within the step limit."
    if wf and bf:
        if bs == ws:
            return f"No improvement: both rounds had the same discovery overhead ({ws} points)."
        if bs < ws:
            pct = round((ws - bs) / ws * 100) if ws > 0 else 0
            if bs == 0:
                return f"Blueprint eliminated all discovery overhead: ~0 points vs ~{ws} without blueprint (~{pct}% reduction)."
            return f"Blueprint reduced discovery overhead by ~{pct}%: ~{bs} points vs ~{ws} without blueprint."
        return f"Blueprint caused regression: {bs} points vs {ws} without blueprint."
    if bf and not wf:
        return f"Blueprint helped conclude ({bs} overhead points). Baseline did not conclude within the step limit."
    return "Baseline concluded but blueprint round did not — unexpected result."


async def run_mcp_blueprint_test(task: str, model: str) -> dict[str, Any]:
    m = (model or "claude").strip().lower()
    if m not in ("claude", "gemini", "grok", "gpt4o"):
        m = "claude"

    servers = await asyncio.to_thread(fetch_test_candidates)
    if not servers:
        raise RuntimeError("No test candidates returned from registry.")

    servers = normalize_servers_for_discovery(servers)
    um_a = _discovery_user_message(servers, task)
    servers_b = _rewrite_stub_urls_for_blueprint([dict(s) for s in servers])
    um_b = _discovery_user_message(servers_b, task)

    without = await asyncio.to_thread(run_discovery_golf_round_sync, m, SYSTEM_PROMPT, um_a)
    with_bp = await asyncio.to_thread(run_discovery_golf_round_sync, m, SYSTEM_PROMPT, um_b)
    naive = await asyncio.to_thread(run_discovery_golf_round_sync, m, NAIVE_SYSTEM_PROMPT, um_b, True)

    return {
        "task": task.strip(),
        "model": m,
        "withoutBlueprint": without,
        "withBlueprint": with_bp,
        "naiveRun": naive,
        "verdict": _verdict(without, with_bp),
        "naiveVerdict": _verdict(without, naive),
    }
