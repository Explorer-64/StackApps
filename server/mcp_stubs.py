from firebase_admin import firestore
from fastapi import APIRouter
from fastapi.responses import PlainTextResponse, Response


def _not_found() -> PlainTextResponse:
    return PlainTextResponse("Not found", status_code=404)


def _fetch_mcp_server_doc(server_id: str):
    db = firestore.client()
    return db.collection("mcp_servers").document(server_id).get()


def _build_llms_txt(data: dict, server_id: str, *, path_prefix: str | None) -> str:
    app_name = data.get("app_name") or ""
    description = data.get("description") or ""
    lines: list[str] = [
        f"# {app_name}",
        "",
        description,
        "",
        "## MCP Tools",
    ]
    for t in data.get("tools") or []:
        tool_name = t.get("name") or ""
        tool_description = t.get("description") or ""
        lines.append(f"- {tool_name}: {tool_description}")
    if path_prefix:
        lines.extend([
            "",
            f"Blueprint: https://stackapps.app/{path_prefix}/{server_id}/blueprint.txt",
        ])
    return "\n".join(lines)


def _sitemap_xml_body(server_id: str, path_prefix: str) -> str:
    return (
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
        "  <url>\n"
        f"    <loc>https://stackapps.app/{path_prefix}/{server_id}/</loc>\n"
        "    <changefreq>monthly</changefreq>\n"
        "    <priority>1.0</priority>\n"
        "  </url>\n"
        "</urlset>\n"
    )


mcp_stubs_router = APIRouter(prefix="/stubs")


@mcp_stubs_router.get("/{server_id}/blueprint.txt")
async def stub_no_blueprint(server_id: str):
    doc = _fetch_mcp_server_doc(server_id)
    if not doc.exists:
        return _not_found()
    return PlainTextResponse(
        f"No blueprint published for {server_id}. This server has not adopted Blueprint Protocol.",
        status_code=404,
        media_type="text/plain; charset=utf-8",
    )


@mcp_stubs_router.get("/{server_id}/robots.txt")
async def stub_robots_txt(server_id: str):
    doc = _fetch_mcp_server_doc(server_id)
    if not doc.exists:
        return _not_found()
    body = (
        "User-agent: *\n"
        "Allow: /\n"
        "\n"
        f"Sitemap: https://stackapps.app/stubs/{server_id}/sitemap.xml\n"
    )
    return PlainTextResponse(body, media_type="text/plain; charset=utf-8")


@mcp_stubs_router.get("/{server_id}/sitemap.xml")
async def stub_sitemap_xml(server_id: str):
    doc = _fetch_mcp_server_doc(server_id)
    if not doc.exists:
        return _not_found()
    body = _sitemap_xml_body(server_id, "stubs")
    return Response(content=body, media_type="application/xml; charset=utf-8")


@mcp_stubs_router.get("/{server_id}/llms.txt")
async def stub_llms_txt(server_id: str):
    doc = _fetch_mcp_server_doc(server_id)
    if not doc.exists:
        return _not_found()
    data = doc.to_dict() or {}
    body = _build_llms_txt(data, server_id, path_prefix=None)
    return PlainTextResponse(body, media_type="text/plain; charset=utf-8")


mcp_stubs_bp_router = APIRouter(prefix="/stubs-bp")


@mcp_stubs_bp_router.get("/{server_id}/robots.txt")
async def stub_bp_robots_txt(server_id: str):
    doc = _fetch_mcp_server_doc(server_id)
    if not doc.exists:
        return _not_found()
    body = (
        "User-agent: *\n"
        "Allow: /\n"
        "\n"
        f"# Blueprint: https://stackapps.app/stubs-bp/{server_id}/blueprint.txt\n"
        "\n"
        f"Sitemap: https://stackapps.app/stubs-bp/{server_id}/sitemap.xml\n"
    )
    return PlainTextResponse(body, media_type="text/plain; charset=utf-8")


@mcp_stubs_bp_router.get("/{server_id}/sitemap.xml")
async def stub_bp_sitemap_xml(server_id: str):
    doc = _fetch_mcp_server_doc(server_id)
    if not doc.exists:
        return _not_found()
    body = _sitemap_xml_body(server_id, "stubs-bp")
    return Response(content=body, media_type="application/xml; charset=utf-8")


@mcp_stubs_bp_router.get("/{server_id}/llms.txt")
async def stub_bp_llms_txt(server_id: str):
    doc = _fetch_mcp_server_doc(server_id)
    if not doc.exists:
        return _not_found()
    data = doc.to_dict() or {}
    body = _build_llms_txt(data, server_id, path_prefix="stubs-bp")
    return PlainTextResponse(body, media_type="text/plain; charset=utf-8")


@mcp_stubs_bp_router.get("/{server_id}/blueprint.txt")
async def stub_bp_blueprint_txt(server_id: str):
    doc = _fetch_mcp_server_doc(server_id)
    if not doc.exists:
        return _not_found()
    blueprint_text = (doc.to_dict() or {}).get("blueprint_text") or ""
    if not blueprint_text:
        return _not_found()
    return PlainTextResponse(blueprint_text, media_type="text/plain; charset=utf-8")
