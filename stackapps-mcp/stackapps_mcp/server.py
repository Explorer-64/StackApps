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

from stackapps_mcp.dicta import DictaX402Client
from stackapps_mcp.imagcon import ImagconX402Client
from stackapps_mcp.stackbill import StackBillX402Client

mcp = FastMCP("stackapps-suite-mcp", stateless_http=True)

_client: ImagconX402Client | None = None
_stackbill: StackBillX402Client | None = None
_dicta: DictaX402Client | None = None
_blueprint_text = (Path(__file__).parent / "blueprint.txt").read_text(encoding="utf-8")


def set_client(client: ImagconX402Client) -> None:
    global _client
    _client = client


def set_stackbill(client: StackBillX402Client) -> None:
    global _stackbill
    _stackbill = client


def set_dicta(client: DictaX402Client) -> None:
    global _dicta
    _dicta = client


def _require_client() -> ImagconX402Client:
    if _client is None:
        raise RuntimeError("Imagcon x402 client is not configured")
    return _client


def _require_stackbill() -> StackBillX402Client:
    if _stackbill is None:
        raise RuntimeError("StackBill x402 client is not configured")
    return _stackbill


def _require_dicta() -> DictaX402Client:
    if _dicta is None:
        raise RuntimeError("Dicta-Notes x402 client is not configured")
    return _dicta


def _profile_note(extra: dict) -> str:
    if not extra.get("is_first_payment"):
        return ""
    parts = [
        "A 60-day temp Imagcon account was created for your wallet. To keep it permanently (free), "
        "call setup_wallet_profile_imagcon with the profile token from secure storage, or visit the activate URL."
    ]
    if url := extra.get("profile_setup_url"):
        parts.append(f"Activate URL: {url}")
    if extra.get("api_key_issued"):
        parts.append(
            "An Imagcon API key was issued — use imagcon-mcp with that key (store securely, not in chat)."
        )
    return "\n\n" + " ".join(parts)


def _dicta_profile_note(extra: dict) -> str:
    if not extra.get("is_temp"):
        return ""
    parts = [
        "A 60-day temp Dicta-Notes account was created for your wallet. To keep it permanently (free), "
        "call setup_wallet_profile_dicta with the profile token from secure storage, or visit the activate URL."
    ]
    if url := extra.get("profile_setup_url"):
        parts.append(f"Activate URL: {url}")
    if extra.get("api_key_issued"):
        parts.append(
            "A Dicta-Notes API key was issued — needed for list_dicta_transcripts / "
            "get_dicta_transcript (store securely, not in chat)."
        )
    return "\n\n" + " ".join(parts)


def _safe_extractall(zf: zipfile.ZipFile, output_dir: Path) -> None:
    dest = output_dir.resolve()
    for info in zf.infolist():
        if ".." in Path(info.filename).parts or info.filename.startswith("/"):
            raise ValueError(f"Unsafe path in zip: {info.filename}")
        target = (dest / info.filename).resolve()
        try:
            target.relative_to(dest)
        except ValueError:
            raise ValueError(f"Unsafe path in zip: {info.filename}") from None
    zf.extractall(dest)


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
        _safe_extractall(zf, out)

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
        _safe_extractall(zf, out)

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
        _safe_extractall(zf, out)

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
        _safe_extractall(zf, out)

    return f"Generated {count} files in {out.resolve()}." + _profile_note(extra)


@mcp.tool()
def resize_image(
    image_path: str,
    output_path: str = "./resized.png",
    preset: str | None = None,
    width: int | None = None,
    height: int | None = None,
    mode: str = "cover",
    focal: str = "center",
    background_color: str = "#ffffff",
    output_format: str = "png",
    quality: int = 90,
) -> str:
    """Resize a local image to exact dimensions or a social preset via the Imagcon x402 endpoint. Costs $0.02 USDC. Presets: og, twitter-card, youtube-thumbnail, instagram-square, instagram-portrait, instagram-story, linkedin-post, twitter-header, github-social (preset wins over width/height). Modes: cover, contain, blur (best for OG images), stretch."""
    image_bytes = Path(image_path).read_bytes()
    result_bytes, extra = _require_client().resize_image(
        image_bytes, preset=preset, width=width, height=height, mode=mode,
        focal=focal, background_color=background_color,
        output_format=output_format, quality=quality,
    )
    out = Path(output_path)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_bytes(result_bytes)
    return f"Resized image written to {out.resolve()} ({len(result_bytes)} bytes)." + _profile_note(extra)


@mcp.tool()
def validate_x402_endpoint(url: str, body: dict | None = None) -> str:
    """Validate any third-party x402 endpoint before paying it: sends a REAL signed probe from a fresh unfunded wallet (no funds can move) and returns the facilitator's verdict (healthy/broken/payment-ignored/...), decoded challenge, lint findings, and discovery report. Costs $0.01 USDC via Imagcon. Use for pre-flight due diligence on unfamiliar paid endpoints. body = the JSON the target expects (default {})."""
    import json as _json

    report, _ = _require_client().validate_x402(url, body)
    return _json.dumps(report, indent=2)


@mcp.tool()
def resize_generated_image(
    image_key: str,
    output_path: str = "./resized.png",
    preset: str | None = None,
    width: int | None = None,
    height: int | None = None,
    mode: str = "cover",
    focal: str = "center",
    background_color: str = "#ffffff",
    output_format: str = "png",
    quality: int = 90,
) -> str:
    """Resize an image previously generated via generate_image (pass its image_key) to exact dimensions or a social preset. Free — no second x402 payment, since the source image was already paid for on generation. Presets and modes match resize_image."""
    result_bytes, extra = _require_client().resize_generated_image(
        image_key, preset=preset, width=width, height=height, mode=mode,
        focal=focal, background_color=background_color,
        output_format=output_format, quality=quality,
    )
    out = Path(output_path)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_bytes(result_bytes)
    return f"Resized image written to {out.resolve()} ({len(result_bytes)} bytes)." + _profile_note(extra)


@mcp.tool()
def check_icon(image_path: str, target: str) -> str:
    """Check whether an existing icon meets real platform compliance rules: W3C maskable safe zone, Android adaptive icon safe zone, or iOS App Store icon guidance. target must be one of: maskable, android-adaptive, ios. Costs $0.01 USDC. Returns a structured pass/warn/fail/undetermined report. Distinct from create_pwa_icons_from_image, which generates a full icon set rather than checking one you already have."""
    import json as _json

    image_bytes = Path(image_path).read_bytes()
    report, extra = _require_client().check_icon(image_bytes, target)
    return _json.dumps(report, indent=2) + _profile_note(extra)


@mcp.tool()
def create_invoice(
    recipient_name: str,
    recipient_address: str,
    line_items: list[dict],
    output_path: str = "./invoice.pdf",
    sender_name: str | None = None,
    sender_address: str | None = None,
    invoice_number: str | None = None,
    due_date: str | None = None,
    tax_rate: float | None = None,
    notes: str | None = None,
    template: str | None = None,
) -> str:
    """Generate a professional invoice PDF via the StackBill x402 endpoint. Costs $0.10 USDC. line_items: [{"description": str, "quantity": number, "unitPrice": number}] — totals and tax are computed server-side. Templates: standard (default), legal, creative. First payment auto-creates a wallet account; on later calls in the same session invoice_number may be omitted (auto-numbered per wallet, e.g. INV-0001). sender is required for new/anonymous wallets."""
    sender = None
    if sender_name and sender_address:
        sender = {"name": sender_name, "address": sender_address}
    recipient = {"name": recipient_name, "address": recipient_address}
    pdf_bytes, extra = _require_stackbill().create_invoice(
        recipient=recipient, line_items=line_items, sender=sender,
        invoice_number=invoice_number, due_date=due_date, tax_rate=tax_rate,
        notes=notes, template=template,
    )
    out = Path(output_path)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_bytes(pdf_bytes)
    parts = [f"Invoice PDF written to {out.resolve()} ({len(pdf_bytes)} bytes)."]
    if number := extra.get("invoice_number"):
        parts.append(f"Invoice number: {number}.")
    if extra.get("api_key_issued"):
        parts.append(
            "First payment: a StackBill wallet account was created and a one-time API key "
            "was issued in the response headers (stored in session only, not shown here). "
            "Future calls this session auto-number invoices. Call setup_wallet_profile_stackbill "
            "to make this account permanent (free) instead of letting it expire in 60 days."
        )
    return " ".join(parts)


@mcp.tool()
def get_wallet_profile_imagcon() -> str:
    """Look up the Imagcon wallet profile for the configured wallet. Returns temp vs permanent status before prompting the user to activate."""
    result = _require_client().get_wallet_profile()
    profile = result.get("profile", result)
    status = profile.get("status", "unknown")
    name = profile.get("name", "")
    parts = [f"Wallet {_require_client().wallet_address}: status={status}"]
    if name:
        parts.append(f"name={name}")
    return ". ".join(parts) + "."


@mcp.tool()
def setup_wallet_profile_imagcon(
    name: str,
    terms_confirmed: bool,
    profile_token: str | None = None,
    company_name: str | None = None,
    tax_id: str | None = None,
    rotate_api_key: bool = False,
) -> str:
    """Activate a permanent Imagcon account linked to your wallet, or recover a lost API key on an already-permanent profile (rotate_api_key=True issues a fresh key by wallet signature alone, no old key needed). terms_confirmed must be true only after the human has read https://imagcon.app/terms-of-service and agreed. profile_token defaults to the session token from the first paid Imagcon call if omitted. Separate account system from StackBill — use setup_wallet_profile_stackbill for invoice accounts."""
    if not terms_confirmed:
        raise ValueError(
            "terms_confirmed must be true only after the human has read "
            "https://imagcon.app/terms-of-service and agreed."
        )
    client = _require_client()
    token = profile_token or client.profile_token
    if not token:
        raise ValueError(
            "No profile token available. Complete a paid Imagcon tool call first or pass "
            "profile_token from secure storage."
        )
    result = client.setup_wallet_profile(
        profile_token=token,
        name=name,
        terms_confirmed=terms_confirmed,
        company_name=company_name,
        tax_id=tax_id,
        rotate_api_key=rotate_api_key,
    )
    status = result.get("profile", {}).get("status", "permanent")
    parts = [f"Imagcon profile activated. Future payments from your wallet are linked to {name}. Status: {status}."]
    if result.get("api_key"):
        parts.append("A new API key was issued and stored in session (not shown here).")
    return " ".join(parts)


@mcp.tool()
def setup_wallet_profile_stackbill(
    name: str,
    terms_confirmed: bool,
    profile_token: str | None = None,
    company_name: str | None = None,
    tax_id: str | None = None,
    address: str | None = None,
) -> str:
    """Activate a permanent StackBill account linked to your wallet. terms_confirmed must be true only after the human has read https://stackbill.app/terms-of-service and agreed. profile_token defaults to the session token from the first paid invoice call if omitted. Separate account system from Imagcon — use setup_wallet_profile_imagcon for icon/splash accounts. Permanent accounts keep per-wallet invoice numbering and can pre-fill sender details on future invoices."""
    if not terms_confirmed:
        raise ValueError(
            "terms_confirmed must be true only after the human has read "
            "https://stackbill.app/terms-of-service and agreed."
        )
    client = _require_stackbill()
    token = profile_token or client.profile_token
    if not token:
        raise ValueError(
            "No profile token available. Complete a paid create_invoice call first or pass "
            "profile_token from secure storage."
        )
    result = client.setup_wallet_profile(
        profile_token=token,
        name=name,
        terms_confirmed=terms_confirmed,
        company_name=company_name,
        tax_id=tax_id,
        address=address,
    )
    status = result.get("profile", {}).get("status", "permanent")
    return f"StackBill profile activated. Future invoices from your wallet are linked to {name}. Status: {status}."


@mcp.tool()
def dicta_transcribe_audio(audio_url: str, store: bool = False) -> str:
    """Transcribe short audio (voicemail, call recording, memo, podcast clip — up to 15 min, 100 MB) via the Dicta-Notes x402 endpoint. Costs $0.10 USDC. Returns diarized, timestamped transcript JSON; any spoken language is auto-detected and labeled per segment. Set store=True to keep the transcript for 60 days, retrievable later with list_dicta_transcripts / get_dicta_transcript. For recordings over 15 minutes use dicta_transcribe_long_audio."""
    import json as _json

    result, extra = _require_dicta().transcribe(audio_url, store=store)
    return _json.dumps(result, indent=2) + _dicta_profile_note(extra)


@mcp.tool()
def dicta_transcribe_long_audio(audio_url: str, store: bool = False) -> str:
    """Transcribe long-form audio (meetings, interviews, hearings — up to 2 hours, 400 MB) via the Dicta-Notes x402 endpoint. Costs $0.59 USDC. Returns diarized, timestamped transcript JSON; no other x402 transcription endpoint accepts recordings this long. Set store=True to keep the transcript for 60 days. This is a synchronous call — a 2-hour file can take 15-30 minutes to process, so the caller must be prepared to hold the connection open."""
    import json as _json

    result, extra = _require_dicta().transcribe_long(audio_url, store=store)
    return _json.dumps(result, indent=2) + _dicta_profile_note(extra)


@mcp.tool()
def get_wallet_profile_dicta() -> str:
    """Look up the Dicta-Notes wallet profile for the configured wallet. Returns temp vs permanent status before prompting the user to activate."""
    client = _require_dicta()
    result = client.get_wallet_profile()
    status = result.get("status", "unknown")
    parts = [f"Wallet {client.wallet_address}: status={status}"]
    for key in ("created_at", "expires_at", "activated_at"):
        if value := result.get(key):
            parts.append(f"{key}={value}")
    return ". ".join(parts) + "."


@mcp.tool()
def setup_wallet_profile_dicta(
    name: str,
    terms_confirmed: bool,
    profile_token: str | None = None,
    rotate_api_key: bool = False,
) -> str:
    """Activate a permanent Dicta-Notes account linked to your wallet, or recover a lost API key on an already-permanent profile (rotate_api_key=True). terms_confirmed must be true only after the human has read https://dicta-notes.com/terms-of-service and agreed. profile_token defaults to the session token from the first paid Dicta transcribe call if omitted. Separate account system from Imagcon/StackBill — this does not activate those profiles."""
    if not terms_confirmed:
        raise ValueError(
            "terms_confirmed must be true only after the human has read "
            "https://dicta-notes.com/terms-of-service and agreed."
        )
    client = _require_dicta()
    token = profile_token or client.profile_token
    if not token:
        raise ValueError(
            "No profile token available. Complete a paid Dicta transcribe call first or pass "
            "profile_token from secure storage."
        )
    result = client.setup_wallet_profile(
        profile_token=token,
        name=name,
        terms_confirmed=terms_confirmed,
        rotate_api_key=rotate_api_key,
    )
    status = result.get("profile", {}).get("status", "permanent")
    parts = [f"Dicta-Notes profile activated. Future payments from your wallet are linked to {name}. Status: {status}."]
    if result.get("api_key"):
        parts.append("A new API key was issued and stored in session (not shown here).")
    return " ".join(parts)


@mcp.tool()
def recover_wallet_profile_dicta(profile_token: str | None = None) -> str:
    """Recover a lost Dicta-Notes API key by wallet signature alone — no old key needed. Works for both temp and permanent profiles. profile_token defaults to the session token from the first paid Dicta transcribe call if omitted."""
    client = _require_dicta()
    token = profile_token or client.profile_token
    if not token:
        raise ValueError(
            "No profile token available. Complete a paid Dicta transcribe call first or pass "
            "profile_token from secure storage."
        )
    client.recover_wallet_profile(token)
    return "Dicta-Notes API key recovered and stored in session (not shown here)."


@mcp.tool()
def list_dicta_transcripts(limit: int | None = None) -> str:
    """List previously stored Dicta-Notes transcripts for this wallet (only transcripts saved with store=True on a prior transcribe call). Requires a Dicta API key from a prior paid call, setup_wallet_profile_dicta, or recover_wallet_profile_dicta. Returns id, route, created_at, expires_at, and duration_seconds for each (default 50, max 100)."""
    import json as _json

    result = _require_dicta().list_transcripts(limit=limit)
    return _json.dumps(result, indent=2)


@mcp.tool()
def get_dicta_transcript(transcript_id: str) -> str:
    """Fetch a previously stored Dicta-Notes transcript by id (from list_dicta_transcripts). Requires a Dicta API key. Returns the full transcript JSON: transcript, segments, speakers, duration_seconds, language, languages_detected."""
    import json as _json

    result = _require_dicta().get_transcript(transcript_id)
    return _json.dumps(result, indent=2)


# --- HTTP app: blueprint routes + SSE guard (for Cloud Run) ---

async def _serve_blueprint(request: Request) -> Response:
    return PlainTextResponse(_blueprint_text, media_type="text/plain; charset=utf-8")


class _SSEGuard(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        if "text/event-stream" in request.headers.get("accept", ""):
            return PlainTextResponse(
                "SSE transport is not supported on this server.\n"
                "Install the local stdio package instead:\n"
                "  uvx stackapps-suite-mcp --wallet-key 0x...",
                status_code=405,
            )
        return await call_next(request)


def create_app(*, discovery_only: bool = False):
    """ASGI app for Cloud Run (discovery_only=True) or local HTTP MCP."""
    routes: list = [
        Route("/blueprint.txt", _serve_blueprint),
        Route("/.well-known/blueprint.txt", _serve_blueprint),
    ]
    if not discovery_only:
        routes.append(Mount("/", app=mcp.streamable_http_app()))
    return Starlette(
        routes=routes,
        middleware=[Middleware(_SSEGuard)],
    )
