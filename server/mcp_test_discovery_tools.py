"""Shared tool schemas for MCP discovery-efficiency tests (Anthropic / OpenRouter / Gemini)."""

from __future__ import annotations

from typing import Any

from google.genai import types as genai_types

_GUIDED_FETCH_DESC = (
    "Fetch the raw HTTP body of an absolute URL under a server's published app URL. Typical "
    "starting points include robots.txt, llms.txt, and sitemap.xml. If another URL in fetched "
    "text clarifies capabilities, retrieve it."
)

TOOLS_ANTHROPIC: list[dict[str, Any]] = [
    {
        "name": "fetch_url",
        "description": _GUIDED_FETCH_DESC,
        "input_schema": {
            "type": "object",
            "properties": {"url": {"type": "string"}},
            "required": ["url"],
        },
    },
    {
        "name": "get_server_tools",
        "description": (
            "Fetch full MCP tool definitions for one server by its server_id after narrowing "
            "candidates via fetch_url."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "server_id": {
                    "type": "string",
                    "description": "Registry server identifier from the server list in the user message.",
                }
            },
            "required": ["server_id"],
        },
    },
]

TOOLS_ANTHROPIC_NAIVE: list[dict[str, Any]] = [
    {
        "name": "fetch_url",
        "description": "Fetch the contents of a URL.",
        "input_schema": {
            "type": "object",
            "properties": {"url": {"type": "string"}},
            "required": ["url"],
        },
    },
]

OPENROUTER_TOOLS: list[dict[str, Any]] = [
    {
        "type": "function",
        "function": {
            "name": "fetch_url",
            "description": TOOLS_ANTHROPIC[0]["description"],
            "parameters": TOOLS_ANTHROPIC[0]["input_schema"],
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_server_tools",
            "description": TOOLS_ANTHROPIC[1]["description"],
            "parameters": TOOLS_ANTHROPIC[1]["input_schema"],
        },
    },
]

OPENROUTER_TOOLS_NAIVE: list[dict[str, Any]] = [
    {
        "type": "function",
        "function": {
            "name": "fetch_url",
            "description": "Fetch the contents of a URL.",
            "parameters": {
                "type": "object",
                "properties": {"url": {"type": "string"}},
                "required": ["url"],
            },
        },
    },
]


def gemini_discovery_tool_naive() -> genai_types.Tool:
    s_fetch = genai_types.Schema(
        type=genai_types.Type.OBJECT,
        properties={"url": genai_types.Schema(type=genai_types.Type.STRING)},
        required=["url"],
    )
    return genai_types.Tool(
        function_declarations=[
            genai_types.FunctionDeclaration(
                name="fetch_url",
                description="Fetch the contents of a URL.",
                parameters=s_fetch,
            ),
        ]
    )


def gemini_discovery_tool() -> genai_types.Tool:
    s_fetch = genai_types.Schema(
        type=genai_types.Type.OBJECT,
        properties={
            "url": genai_types.Schema(
                type=genai_types.Type.STRING,
                description="Absolute HTTPS URL.",
            )
        },
        required=["url"],
    )
    s_tools = genai_types.Schema(
        type=genai_types.Type.OBJECT,
        properties={
            "server_id": genai_types.Schema(
                type=genai_types.Type.STRING,
                description="Registry server identifier (e.g. imagcon).",
            )
        },
        required=["server_id"],
    )
    return genai_types.Tool(
        function_declarations=[
            genai_types.FunctionDeclaration(
                name="fetch_url",
                description=TOOLS_ANTHROPIC[0]["description"],
                parameters=s_fetch,
            ),
            genai_types.FunctionDeclaration(
                name="get_server_tools",
                description=TOOLS_ANTHROPIC[1]["description"],
                parameters=s_tools,
            ),
        ]
    )
