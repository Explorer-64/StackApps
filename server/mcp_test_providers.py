"""Provider-specific multi-turn tool loops for MCP discovery-efficiency tests."""

from __future__ import annotations

import json
from typing import Any

import anthropic
from google import genai
from google.genai import types as genai_types
from openai import OpenAI

from .mcp_test_discovery_tools import (
    OPENROUTER_TOOLS,
    OPENROUTER_TOOLS_NAIVE,
    TOOLS_ANTHROPIC,
    TOOLS_ANTHROPIC_NAIVE,
    gemini_discovery_tool,
    gemini_discovery_tool_naive,
)
from .mcp_test_runner import MAX_TURNS, finalize_discovery_round, run_discovery_tool_batch

CLAUDE_MODEL = "claude-sonnet-4-6"
GEMINI_MODEL = "gemini-3.1-flash-lite"


def _tool_input_as_dict(inp: Any) -> dict[str, Any]:
    if isinstance(inp, dict):
        return inp
    md = getattr(inp, "model_dump", None)
    if callable(md):
        out = md()
        return out if isinstance(out, dict) else {}
    return {}


def _assistant_content_from_response(resp: Any) -> list[dict[str, Any]]:
    out: list[dict[str, Any]] = []
    for block in resp.content:
        bt = getattr(block, "type", None)
        if bt == "text":
            out.append({"type": "text", "text": getattr(block, "text", "")})
        elif bt == "tool_use":
            inp = getattr(block, "input", None)
            clean = _tool_input_as_dict(inp)
            out.append({
                "type": "tool_use",
                "id": getattr(block, "id", ""),
                "name": getattr(block, "name", ""),
                "input": clean,
            })
    return out


def _collect_tool_uses(resp: Any) -> list[Any]:
    return [b for b in resp.content if getattr(b, "type", None) == "tool_use"]


def _collect_text_anthropic(resp: Any) -> str:
    parts: list[str] = []
    for block in resp.content:
        if getattr(block, "type", None) == "text":
            parts.append(getattr(block, "text", "") or "")
    return "\n".join(p for p in parts if p).strip()


def run_discovery_claude_sync(
    system_prompt: str,
    user_message: str,
    naive: bool = False,
) -> dict[str, Any]:
    import os
    key = os.environ.get("ANTHROPIC_API_KEY", "")
    if not key:
        raise RuntimeError("ANTHROPIC_API_KEY not set")

    client = anthropic.Anthropic(api_key=key)
    messages: list[dict[str, Any]] = [{"role": "user", "content": user_message}]
    tool_calls_log: list[str] = []
    score_box = [0]
    concluded = False
    all_assistant_text: list[str] = []

    for _turn in range(MAX_TURNS):
        resp = client.messages.create(
            model=CLAUDE_MODEL,
            max_tokens=4096,
            system=system_prompt,
            tools=TOOLS_ANTHROPIC_NAIVE if naive else TOOLS_ANTHROPIC,
            messages=messages,
        )

        assistant_payload = _assistant_content_from_response(resp)
        messages.append({"role": "assistant", "content": assistant_payload})

        text_here = _collect_text_anthropic(resp)
        if text_here:
            all_assistant_text.append(text_here)

        tool_uses = _collect_tool_uses(resp)
        if not tool_uses:
            concluded = True
            break

        calls: list[tuple[str, dict[str, Any]]] = []
        tool_meta: list[tuple[str, str]] = []
        for b in tool_uses:
            bid = getattr(b, "id", "")
            name = getattr(b, "name", "")
            args = _tool_input_as_dict(getattr(b, "input", None))
            calls.append((name, args))
            tool_meta.append((bid, name))

        payloads = run_discovery_tool_batch(calls, tool_calls_log, score_box)

        tool_results: list[dict[str, Any]] = []
        for (bid, _name), payload in zip(tool_meta, payloads):
            tool_results.append({
                "type": "tool_result",
                "tool_use_id": bid,
                "content": json.dumps(payload, default=str)[:80000],
            })

        messages.append({"role": "user", "content": tool_results})

    return finalize_discovery_round(tool_calls_log, concluded, all_assistant_text, score_box[0])


def run_discovery_gemini_sync(
    system_prompt: str,
    user_message: str,
    naive: bool = False,
) -> dict[str, Any]:
    import os
    key = os.environ.get("GOOGLEAI_API_KEY", "")
    if not key:
        raise RuntimeError("GOOGLEAI_API_KEY not set")

    client = genai.Client(api_key=key)
    gt = gemini_discovery_tool_naive() if naive else gemini_discovery_tool()
    config = genai_types.GenerateContentConfig(
        tools=[gt],
        system_instruction=system_prompt,
        max_output_tokens=4096,
    )

    contents: list[genai_types.Content] = [
        genai_types.Content(role="user", parts=[genai_types.Part.from_text(text=user_message)])
    ]
    tool_calls_log: list[str] = []
    score_box = [0]
    concluded = False
    all_assistant_text: list[str] = []

    for _turn in range(MAX_TURNS):
        resp = client.models.generate_content(model=GEMINI_MODEL, contents=contents, config=config)
        if not resp.candidates:
            break
        cand = resp.candidates[0]
        parts = list(cand.content.parts or [])
        contents.append(genai_types.Content(role="model", parts=parts))

        texts_here: list[str] = []
        calls: list[tuple[str, dict[str, Any]]] = []
        for p in parts:
            if p.text:
                texts_here.append(p.text)
            fc = p.function_call
            if fc:
                args = dict(fc.args) if fc.args else {}
                calls.append((fc.name or "", args))

        chunk = "\n".join(texts_here).strip()
        if chunk:
            all_assistant_text.append(chunk)

        if not calls:
            concluded = True
            break

        payloads = run_discovery_tool_batch(calls, tool_calls_log, score_box)

        fr_parts: list[genai_types.Part] = []
        for (name, _args), payload in zip(calls, payloads):
            fr_parts.append(genai_types.Part.from_function_response(name=name, response={"result": payload}))

        contents.append(genai_types.Content(role="user", parts=fr_parts))

    return finalize_discovery_round(tool_calls_log, concluded, all_assistant_text, score_box[0])


def run_discovery_openrouter_sync(model_id: str, system_prompt: str, user_message: str, tools: list[dict[str, Any]] | None = None) -> dict[str, Any]:
    import os
    key = os.environ.get("OPENROUTER_API_KEY", "")
    if not key:
        raise RuntimeError("OPENROUTER_API_KEY not set")

    client = OpenAI(api_key=key, base_url="https://openrouter.ai/api/v1")
    messages: list[dict[str, Any]] = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_message},
    ]
    tool_calls_log: list[str] = []
    score_box = [0]
    concluded = False
    all_assistant_text: list[str] = []

    for _turn in range(MAX_TURNS):
        r = client.chat.completions.create(
            model=model_id,
            messages=messages,
            tools=tools or OPENROUTER_TOOLS,
            max_tokens=4096,
        )
        msg = r.choices[0].message
        txt = (msg.content or "").strip()
        if txt:
            all_assistant_text.append(txt)

        if not msg.tool_calls:
            concluded = True
            break

        serialized_calls: list[Any] = []
        for tc in msg.tool_calls:
            serialized_calls.append({
                "id": tc.id,
                "type": "function",
                "function": {"name": tc.function.name, "arguments": tc.function.arguments or "{}"},
            })

        messages.append({
            "role": "assistant",
            "content": msg.content,
            "tool_calls": serialized_calls,
        })

        calls: list[tuple[str, dict[str, Any]]] = []
        for tc in msg.tool_calls:
            raw_args = tc.function.arguments or "{}"
            try:
                args = json.loads(raw_args)
            except json.JSONDecodeError:
                args = {}
            if not isinstance(args, dict):
                args = {}
            calls.append((tc.function.name, args))

        payloads = run_discovery_tool_batch(calls, tool_calls_log, score_box)

        for tc, payload in zip(msg.tool_calls, payloads):
            messages.append({
                "role": "tool",
                "tool_call_id": tc.id,
                "content": json.dumps(payload, default=str)[:80000],
            })

    return finalize_discovery_round(tool_calls_log, concluded, all_assistant_text, score_box[0])
