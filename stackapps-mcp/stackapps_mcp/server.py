from __future__ import annotations

import io
import zipfile
from pathlib import Path

from mcp.server.fastmcp import FastMCP
from starlette.applications import Starlette
from starlette.middleware import Middleware
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import PlainTextResponse, Response
from starlette.routing import Mount, Route

from stackapps_mcp.client import ImagconX402Client

mcp = FastMCP("stackapps-mcp", stateless_http=True)

_client: ImagconX402Client | None = None
_blueprint_text = (Path(__file__).parent / "blueprint.txt").read_text(encoding="utf-8")


def set_client(client: ImagconX402Client) -> None:
    global _client
    _client = client


def _require_client() -> ImagconX402Client:
    if _client is None:
        raise RuntimeError("Imagcon x402 client is not configured")
    return _client


def _profile_note(extra: dict) -> str:
    if not extra.get("profile_token"):
        return ""
    parts = [f"Profile token: {extra['profile_token']} (saved for 60 days)."]
    if api_key := extra.get("api_key"):
        parts.append(f"Imagcon API key issued: {api_key} — unlocks all imagcon-mcp tools.")
    parts.append("Call setup_wallet_profile to make this account permanent.")
    return "\n\n" + " ".join(parts)


# --- tools ---

@mcp.tool()
def create_pwa_icons_from_image(
    image_path: str,
    output_dir: str = "./public/icons",
) -> str:
    """Generate a full PWA icon set (all sizes, manifest.json) from a local PNG/JPEG/WebP image via the Imagcon x402 anonymous endpoint. Costs $0.10 USDC. output_dir should be an absolute path."""
    path = Path(image_path)
    image_bytes = path.read_bytes()
    zip_bytes, extra = _require_client().generate_icons(image_bytes, path.name)

    out = Path(output_dir)
    out.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(io.BytesIO(zip_bytes)) as zf:
        count = len(zf.namelist())
        zf.extractall(out)

    return f"Generated {count} files in {out.resolve()}." + _profile_note(extra)


@mcp.tool()
def create_splash_screens_from_image(
    image_path: str,
    background_color: str = "#ffffff",
    output_dir: str = "./public/splash",
) -> str:
    """Generate 16 iOS/iPad splash screens from a local PNG/JPEG/WebP image via the Imagcon x402 anonymous endpoint. Costs $0.10 USDC. output_dir should be an absolute path."""
    path = Path(image_path)
    image_bytes = path.read_bytes()
    zip_bytes, extra = _require_client().generate_splash(
        image_bytes, path.name, background_color=background_color
    )

    out = Path(output_dir)
    out.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(io.BytesIO(zip_bytes)) as zf:
        count = len(zf.namelist())
        zf.extractall(out)

    return f"Generated {count} files in {out.resolve()}." + _profile_note(extra)


@mcp.tool()
def generate_pwa_icons(
    description: str,
    output_dir: str = "./public/icons",
) -> str:
    """AI-generate a complete PWA icon set from a text description of your app. Costs $0.295 USDC. Imagcon generates the source image and all PWA sizes. output_dir should be an absolute path."""
    zip_bytes, extra = _require_client().generate_pwa_icons_ai(description)

    out = Path(output_dir)
    out.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(io.BytesIO(zip_bytes)) as zf:
        count = len(zf.namelist())
        zf.extractall(out)

    return f"Generated {count} files in {out.resolve()}." + _profile_note(extra)


@mcp.tool()
def generate_image(description: str) -> str:
    """AI-generate a source image from a text description. Costs $0.195 USDC. Returns image_key and preview_url — useful for previewing before generating a full icon set."""
    result, extra = _require_client().generate_image_ai(description)
    msg = f"image_key: {result.get('image_key', '')}\npreview_url: {result.get('preview_url', '')}"
    return msg + _profile_note(extra)


@mcp.tool()
def generate_splash_screens(
    description: str,
    background_color: str = "#ffffff",
    output_dir: str = "./public/splash",
) -> str:
    """AI-generate 16 iOS/iPad splash screens from a text description of your app. Costs $0.295 USDC. output_dir should be an absolute path."""
    zip_bytes, extra = _require_client().generate_splash_screens_ai(description, background_color)

    out = Path(output_dir)
    out.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(io.BytesIO(zip_bytes)) as zf:
        count = len(zf.namelist())
        zf.extractall(out)

    return f"Generated {count} files in {out.resolve()}." + _profile_note(extra)


@mcp.tool()
def setup_wallet_profile(
    profile_token: str,
    name: str,
    company_name: str | None = None,
    tax_id: str | None = None,
) -> str:
    """Activate a permanent Imagcon account linked to your wallet. Call this after the first x402 payment using the profile_token returned alongside the tool result. Permanent accounts keep payment history indefinitely and skip the 60-day expiry."""
    result = _require_client().setup_wallet_profile(
        profile_token=profile_token,
        name=name,
        company_name=company_name,
        tax_id=tax_id,
    )
    status = result.get("profile", {}).get("status", "permanent")
    return f"Profile activated. Future payments from your wallet are linked to {name}. Status: {status}."


# --- HTTP app: blueprint routes + SSE guard (for Cloud Run) ---

async def _serve_blueprint(request: Request) -> Response:
    return PlainTextResponse(_blueprint_text, media_type="text/plain; charset=utf-8")


class _SSEGuard(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        if "text/event-stream" in request.headers.get("accept", ""):
            return PlainTextResponse(
                "SSE transport is not supported on this server.\n"
                "Install the local stdio package instead:\n"
                "  uvx --from https://stackapps.app/downloads/stackapps_mcp-0.1.1-py3-none-any.whl "
                "stackapps-mcp --wallet-key 0x...",
                status_code=405,
            )
        return await call_next(request)


def create_app():
    """ASGI app for Cloud Run: blueprint endpoints + SSE guard + MCP server."""
    mcp_app = mcp.streamable_http_app()
    return Starlette(
        routes=[
            Route("/blueprint.txt", _serve_blueprint),
            Route("/.well-known/blueprint.txt", _serve_blueprint),
            Mount("/", app=mcp_app),
        ],
        middleware=[Middleware(_SSEGuard)],
    )
