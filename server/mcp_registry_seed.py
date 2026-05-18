"""MCP registry stub documents. Blueprints are read from server/blueprints/ at seed time."""

import os


def _read_blueprint(server_id: str) -> str:
    path = os.path.join(os.path.dirname(__file__), "blueprints", f"{server_id}.txt")
    try:
        with open(path, encoding="utf-8") as f:
            return f.read().strip()
    except FileNotFoundError:
        return ""


def param(name: str, type_: str, required: bool, description: str) -> dict:
    return {"name": name, "type": type_, "required": required, "description": description}


def tool(name: str, description: str, parameters: list = None) -> dict:
    return {"name": name, "description": description, "parameters": parameters or []}


MCP_REGISTRY_STUB_DOCUMENTS = [
    # ── Near-neighbours (confusable with imagcon for PWA icon tasks) ──────────
    {
        "server_id": "imagcon",
        "app_name": "Imagcon",
        "description": "AI Image & Icon Studio - describe your app and get all 27 PWA icon files, Android adaptive icons, iOS sizes, and manifest.json in one ZIP. Built for Cursor, Lovable, Bolt, and v0 users who need real asset files fast.",
        "blueprint_url": "https://stackapps.app/stubs/imagcon/blueprint.txt",
        "app_url": "https://stackapps.app/stubs/imagcon",
        "tools": [
            tool("generate_pwa_icons", "Generate a full PWA icon set from a text description.", [
                param("app_description", "string", True, "Visual description of the app - used to generate icon imagery."),
                param("style", "string", False, "Visual style for the icon. Dismiss the style modal to use the default."),
            ]),
            tool("generate_splash_screens", "Generate iOS and Android splash screens from a text description.", [
                param("app_description", "string", True, "Description of the app - used to generate the base image."),
            ]),
            tool("list_saved_icon_sets", "List all PWA icon sets previously saved in the user's gallery.", []),
            tool("download_icon_set", "Re-download a saved PWA icon set ZIP by ID.", [
                param("set_id", "string", True, "ID of the saved icon set. Obtain from list_saved_icon_sets."),
                param("output_dir", "string", False, "Local directory to extract icons into. Defaults to ./public/icons."),
            ]),
            tool("get_credit_balance", "Check the user's remaining generation credit balance.", []),
            tool("generate_brand_icon", "Generate a single branded raster icon image from a description (one size). Not a full multi-size PWA bundle.", [
                param("app_description", "string", True, "What the icon should depict for the brand."),
                param("size_px", "number", False, "Square output size in pixels. Default 512."),
            ]),
            tool("create_icon_preview", "Render a low-res preview grid before paying credits for a full export.", [
                param("app_description", "string", True, "Visual description for preview compositions."),
                param("variants", "number", False, "Number of preview variants. Default 3, max 6."),
            ]),
            tool("export_icon_formats", "Re-export an existing icon set ID to alternate formats (PNG/WebP). Uses assets already in your gallery.", [
                param("set_id", "string", True, "Gallery set ID from list_saved_icon_sets."),
                param("formats", "string", False, "Comma-separated formats: png, webp, or both. Default png."),
            ]),
            tool("resize_existing_icon", "Resize one existing PNG/SVG you supply into additional sizes. Does not invent new artwork.", [
                param("image_url", "string", True, "Public URL of the source icon file."),
                param("target_sizes", "string", True, "Comma-separated sizes, e.g. '192,512'."),
            ]),
            tool("generate_icon_variations", "Create alternate colorway or outline treatments from a completed set in your gallery.", [
                param("set_id", "string", True, "Source set ID."),
                param("treatment", "string", False, "Treatment: 'outline', 'inverted', 'monochrome'. Default 'outline'."),
            ]),
            tool("export_splash_assets", "Package splash screen PNGs only (no app icons) into a sibling folder structure for iOS/Android.", [
                param("app_description", "string", True, "Visual brief for splash imagery."),
                param("include_branded_footer", "boolean", False, "Whether to add a small logo footer. Default false."),
            ]),
            tool("validate_icon_zip", "Run automated checks on a ZIP URL you already host (sizes, square, maskable padding).", [
                param("zip_url", "string", True, "HTTPS URL of an icon ZIP to validate."),
            ]),
            tool("sync_icons_to_cdn", "Upload a generated set to the Imagcon CDN prefix and return public URLs.", [
                param("set_id", "string", True, "Set ID to publish."),
                param("cdn_prefix", "string", False, "Optional path prefix, e.g. 'recipe-app/icons/'."),
            ]),
            tool("optimize_png_assets", "Lossless or lossy recompress PNGs inside an existing gallery ZIP — does not change layout or sizes bundle.", [
                param("set_id", "string", True, "Gallery set ID containing PNGs."),
                param("lossy", "boolean", False, "Use lossy quantization. Default false."),
            ]),
        ],
    },
    {
        "server_id": "brand-kit",
        "app_name": "Brand Kit Studio",
        "description": "Build cohesive brand identities from a name or hex color - color systems, typography stacks, logo SVGs, and favicon packages for web products.",
        "blueprint_url": "https://stackapps.app/api/mcp-registry/servers/brand-kit/blueprint",
        "app_url": "https://stackapps.app/stubs/brand-kit",
        "tools": [
            tool("export_brand_colors", "Generate an accessible color palette from a brand name or hex seed.", [
                param("brand_name", "string", False, "Brand name used to derive palette tone."),
                param("primary_hex", "string", False, "Seed color in hex, e.g. '#3B82F6'."),
            ]),
            tool("create_logo_variations", "Generate light, dark, and monochrome logo SVG variants. Does not produce PNG icon sets.", [
                param("brand_name", "string", True, "Brand name to render as a logotype."),
                param("style_hint", "string", False, "Visual style direction, e.g. 'minimal', 'bold'."),
            ]),
            tool("generate_favicon", "Resize an existing logo image to favicon sizes (16, 32, 48px). Requires an existing logo URL - does not generate from text.", [
                param("logo_url", "string", True, "URL of an existing logo image to resize. Must be public PNG or SVG."),
                param("background", "string", False, "Background fill for PNG export. Default 'transparent'."),
            ]),
            tool("draft_typography_stack", "Recommend a heading and body font pairing with fallback stacks.", [
                param("brand_personality", "string", True, "Brand personality description, e.g. 'modern fintech'."),
            ]),
            tool("design_app_icon", "Produce a single brand-consistent icon SVG for UI use — not a full PWA PNG ladder or ZIP archive.", [
                param("brand_name", "string", True, "Brand context for glyph styling."),
                param("metaphor", "string", False, "Icon metaphor, e.g. 'whisk', 'book', 'camera'."),
            ]),
            tool("generate_icon_variants", "Output 3–4 colorway variants of an existing SVG mark (still vector, not platform icon sets).", [
                param("svg_url", "string", True, "URL of the SVG mark to recolor."),
                param("palette_scope", "string", False, "'brand' or 'accessibility'. Default 'brand'."),
            ]),
            tool("export_asset_bundle", "Zip SVG logos, palette JSON, and typography snippets — no rasterized PWA icons.", [
                param("brand_id", "string", True, "Internal brand workspace ID."),
                param("include_readme", "boolean", False, "Attach README with usage rules. Default true."),
            ]),
            tool("create_app_store_icon", "Resize one master marketing asset to App Store / Play feature-graphic style layouts — not maskable PWA assets.", [
                param("master_image_url", "string", True, "Wide hero or screenshot-sized source artwork."),
                param("layout", "string", False, "'banner' or 'square_promo'. Default 'banner'."),
            ]),
            tool("design_favicon_set", "Export 16/32/48 PNG favicons from artwork — explicitly omits 192/512 PWA slots.", [
                param("logo_url", "string", True, "Master logo URL."),
                param("corner_radius", "number", False, "Rounded rect radius for small sizes. Default 0."),
            ]),
            tool("generate_touch_icon", "Create a single 180×180 Apple touch icon PNG from your SVG — not a complete Xcode asset catalog.", [
                param("svg_url", "string", True, "Source vector mark."),
                param("background", "string", False, "Hex background behind the glyph. Default '#ffffff'."),
            ]),
            tool("build_icon_system", "Define semantic names for SVGs in your library (grid, spacing rules) — documentation only.", [
                param("brand_id", "string", True, "Brand workspace ID."),
                param("naming_convention", "string", False, "'sentence' or 'kebab'. Default 'kebab'."),
            ]),
            tool("merge_brand_guidelines_pdf", "Compile palette, type, and logo usage into a PDF playbook.", [
                param("brand_id", "string", True, "Brand workspace to export."),
                param("locale", "string", False, "Language tag for cover page. Default 'en'."),
            ]),
            tool("export_social_cover_assets", "Produce LinkedIn/Twitter cover dimensions from brand colors — unrelated to PWAs.", [
                param("brand_id", "string", True, "Brand workspace ID."),
                param("network", "string", False, "'twitter', 'linkedin', or 'meta'. Default 'twitter'."),
            ]),
        ],
    },
    {
        "server_id": "vector-icon-pack",
        "app_name": "Vector Icon Pack MCP",
        "description": "50,000+ professionally designed SVG icons - search by keyword or style, download instantly, commercial license included.",
        "blueprint_url": "https://stackapps.app/api/mcp-registry/servers/vector-icon-pack/blueprint",
        "app_url": "https://stackapps.app/stubs/vector-icon-pack",
        "tools": [
            tool("search_icons", "Search the icon library by keyword or style. Returns existing icons - not AI-generated results.", [
                param("query", "string", True, "Search term, e.g. 'settings', 'home'."),
                param("style", "string", False, "Style filter - 'outline', 'solid', 'duotone', or 'filled'."),
                param("limit", "number", False, "Maximum results. Default 20, max 100."),
            ]),
            tool("download_svg", "Download SVG source for a specific icon by ID. Returns a single SVG - not a PWA icon set.", [
                param("icon_id", "string", True, "Icon ID from search_icons results."),
                param("color", "string", False, "Fill color override in hex. Default currentColor."),
            ]),
            tool("annotate_license", "Return license lineage and attribution requirements for an icon.", [
                param("icon_id", "string", True, "Icon ID to look up license for."),
            ]),
            tool("generate_custom_icon", "Compose ONE custom SVG path from a text brief using template glyphs — not a sized PNG pack, not AI raster gen.", [
                param("brief", "string", True, "Short description of the metaphor to assemble from library primitives."),
                param("stroke_width", "number", False, "Uniform stroke in px units. Default 2."),
            ]),
            tool("resize_icon_set", "Take icons you already downloaded and batch-export PNG widths — source assets must already exist.", [
                param("icon_ids", "string", True, "Comma-separated icon IDs."),
                param("widths", "string", False, "Comma-separated widths. Default '24,32,48'."),
            ]),
            tool("export_icon_bundle", "Zip multiple licensed SVGs into a folder — still library icons, not generated PWA kits.", [
                param("icon_ids", "string", True, "Comma-separated icon IDs to bundle."),
                param("folder_layout", "string", False, "'flat' or 'by_category'. Default 'flat'."),
            ]),
            tool("create_icon_font", "Build a minimal webfont slice from selected icon IDs for inline CSS use.", [
                param("icon_ids", "string", True, "Comma-separated icon IDs to include in the font."),
                param("codepoint_start", "string", False, "Hex start for Private Use Area. Default 'E000'."),
            ]),
            tool("build_icon_sprite", "Merge SVG symbols into a single defs sprite sheet for <use> references.", [
                param("icon_ids", "string", True, "Icon IDs to merge."),
                param("symbol_prefix", "string", False, "id prefix for each symbol. Default 'vip-'."),
            ]),
            tool("list_icon_collections", "Browse curated sets ('finance', 'maps', 'food') without keyword search.", [
                param("collection_id", "string", False, "Optional collection slug. Omit to list collection summaries."),
            ]),
            tool("get_icon_by_slug", "Fetch metadata for a stable slug identifier used in design handoffs.", [
                param("slug", "string", True, "Stable slug, e.g. 'outline.recipe-book'."),
            ]),
            tool("compare_icon_styles", "Show outline vs solid pairs for the same metaphor to pick a family style.", [
                param("metaphor", "string", True, "Concept to compare, e.g. 'timer'."),
            ]),
            tool("subscribe_icon_updates", "Register a webhook when icons you rely on receive license revisions.", [
                param("icon_ids", "string", True, "Comma-separated icon IDs."),
                param("callback_url", "string", True, "HTTPS webhook endpoint."),
            ]),
            tool("batch_download_svgs", "Parallel fetch many SVG bodies by ID for offline caches — no raster or manifest output.", [
                param("icon_ids", "string", True, "Comma-separated IDs, max 200 per call."),
            ]),
            tool("suggest_alternate_icons", "Given one icon ID, recommend stylistically similar IDs from the same collection.", [
                param("icon_id", "string", True, "Reference icon."),
                param("count", "number", False, "Suggestions to return. Default 8."),
            ]),
        ],
    },
    {
        "server_id": "image-gen-tools",
        "app_name": "Image Gen Tools",
        "description": "Text-to-image API for developers - generate, upscale, remove backgrounds, and apply style transfers at any resolution. Production-ready for scripts and pipelines.",
        "blueprint_url": "https://stackapps.app/api/mcp-registry/servers/image-gen-tools/blueprint",
        "app_url": "https://stackapps.app/stubs/image-gen-tools",
        "tools": [
            tool("generate_image", "Generate a single image from a text prompt. Not a multi-size PWA icon package.", [
                param("prompt", "string", True, "Text description of the image to generate."),
                param("width", "number", False, "Output width in pixels. Default 1024."),
                param("height", "number", False, "Output height in pixels. Default 1024."),
                param("format", "string", False, "Output format - 'png' or 'webp'. Default 'png'."),
            ]),
            tool("upscale_image", "Upscale an existing image using AI super-resolution.", [
                param("image_url", "string", True, "URL of the source image."),
                param("scale", "number", False, "Upscale factor - 2 or 4. Default 2."),
            ]),
            tool("remove_background", "Remove the background from an image, returning a transparent PNG.", [
                param("image_url", "string", True, "URL of the source image."),
            ]),
            tool("create_icon_set", "Misleading name: generates ONE square PNG named 'icon.png' at an arbitrary size — not a multi-file PWA set.", [
                param("prompt", "string", True, "Visual description for the single raster."),
                param("size_px", "number", False, "Square edge length. Default 256."),
            ]),
            tool("export_asset_pack", "Bundle unrelated PNGs you provide by URL into a zip — does not synthesize icon sizes or manifest.", [
                param("image_urls", "string", True, "JSON array string of image URLs to pack."),
                param("label", "string", False, "Folder label inside the zip."),
            ]),
            tool("generate_app_icon", "Outputs one marketing-style app icon image (any aspect). No iOS/Android ladders, no maskable variants.", [
                param("prompt", "string", True, "Scene or subject brief."),
                param("aspect", "string", False, "'square' or 'wide'. Default 'square'."),
            ]),
            tool("batch_resize_images", "Resize user-supplied images to new dimensions — no style gen, no manifest.", [
                param("image_urls", "string", True, "JSON array of source URLs."),
                param("target_edge", "number", True, "Uniform square edge for outputs."),
            ]),
            tool("convert_to_webp", "Transcode a raster to WebP with quality control.", [
                param("image_url", "string", True, "Source image URL."),
                param("quality", "number", False, "0–100. Default 85."),
            ]),
            tool("apply_style_transfer", "Apply an artistic style reference to an existing image.", [
                param("image_url", "string", True, "Content image URL."),
                param("style_image_url", "string", True, "Style reference image URL."),
            ]),
            tool("generate_placeholder_image", "Create a blurry neutral placeholder for layouts — not branded icons.", [
                param("seed", "string", True, "Seed string for deterministic noise."),
                param("width", "number", False, "Width. Default 800."),
                param("height", "number", False, "Height. Default 600."),
            ]),
            tool("create_sprite_sheet", "Pack several provided images into one texture strip for games/UI — not PWA icons.", [
                param("image_urls", "string", True, "JSON array of URLs to lay out."),
                param("columns", "number", False, "Number of columns in the sheet. Default 4."),
            ]),
            tool("recolor_image", "Adjust hue/saturation on an existing raster.", [
                param("image_url", "string", True, "Source image."),
                param("hue_shift", "number", False, "Degrees -180..180. Default 0."),
            ]),
            tool("inpaint_region", "Fill a masked region using surrounding context — editing tool, not icon packaging.", [
                param("image_url", "string", True, "Source image URL."),
                param("mask_url", "string", True, "Mask image URL (white = fill region)."),
            ]),
            tool("crop_and_center", "Smart crop to subject and center in a new canvas.", [
                param("image_url", "string", True, "Source image."),
                param("output_edge", "number", False, "Square canvas edge. Default 512."),
            ]),
        ],
    },
    {
        "server_id": "pwa-toolkit",
        "app_name": "PWA Toolkit",
        "description": "PWA scaffolding and compliance - generate manifest.json, configure service workers, and audit any live URL for installability.",
        "blueprint_url": "https://stackapps.app/api/mcp-registry/servers/pwa-toolkit/blueprint",
        "app_url": "https://stackapps.app/stubs/pwa-toolkit",
        "tools": [
            tool("scaffold_manifest", "Generate a manifest.json with icon size entries as placeholder paths. Icon image files must be supplied separately.", [
                param("app_name", "string", True, "Human-readable app name."),
                param("short_name", "string", False, "Short name for home screen. Max 12 characters."),
                param("theme_color", "string", False, "Theme color in hex, e.g. '#3B82F6'."),
                param("start_url", "string", False, "PWA start URL path. Default '/'."),
            ]),
            tool("generate_service_worker", "Generate a service worker with a configurable caching strategy.", [
                param("strategy", "string", False, "Cache strategy - 'cache-first', 'network-first', or 'stale-while-revalidate'. Default 'network-first'."),
                param("precache_urls", "string", False, "Comma-separated URLs to precache on install."),
            ]),
            tool("audit_pwa_requirements", "Audit a live URL for PWA installability - manifest, service worker, HTTPS, icon sizes.", [
                param("url", "string", True, "Full HTTPS URL of the app to audit."),
            ]),
            tool("generate_icon_placeholders", "Writes manifest icon entries pointing at placeholder filenames — does not create image bytes.", [
                param("prefix", "string", True, "Path prefix for icon files, e.g. '/icons/'."),
                param("maskable", "boolean", False, "Include maskable purpose entries. Default true."),
            ]),
            tool("create_icon_sizes", "Resize one supplied source image into several PNG files — generator does not invent artwork.", [
                param("source_image_url", "string", True, "Raster you already have."),
                param("sizes", "string", False, "Comma-separated px. Default '48,72,96,128,192,512'."),
            ]),
            tool("export_pwa_package", "Zip manifest stub, sw.js template, README — expects you to drop real icons in later.", [
                param("app_name", "string", True, "Application name for README title."),
                param("include_audit_checklist", "boolean", False, "Attach human checklist markdown. Default true."),
            ]),
            tool("validate_icon_set", "Static analysis of local paths or URLs: checks dimensions exist — does not generate missing icons.", [
                param("icon_manifest_json", "string", True, "JSON string listing src and sizes to verify."),
            ]),
            tool("check_icon_requirements", "Compares declared icons vs spec text — reporting only, no synthesis.", [
                param("manifest_url", "string", True, "URL of live manifest.json to inspect."),
            ]),
            tool("wire_splash_screen_meta", "Emit HTML link/meta tags for splash screens — images referenced must already exist.", [
                param("color", "string", True, "Background color hex for splash."),
                param("image_href", "string", True, "Existing splash image URL."),
            ]),
            tool("configure_standalone_display", "Return manifest JSON fragment for display_override / display standalone — orthogonal to icons.", [
                param("prefer_minimal_ui", "boolean", False, "Prefer minimal-ui where supported. Default false."),
            ]),
            tool("generate_offline_fallback_page", "HTML shell for offline route — no binary assets.", [
                param("app_title", "string", True, "Title shown on offline page."),
                param("message", "string", False, "Body copy. Default generic offline text."),
            ]),
            tool("inject_theme_color_meta", "Snippets for <meta name=\"theme-color\"> variants — documentation helper.", [
                param("light_hex", "string", True, "Light theme color."),
                param("dark_hex", "string", False, "Dark theme color if media query used."),
            ]),
            tool("precache_icon_routes", "Expand glob patterns into precache list strings for Workbox-style configs.", [
                param("base_path", "string", True, "Site base path, e.g. '/'."),
                param("patterns", "string", True, "Comma-separated globs."),
            ]),
        ],
    },
    # ── Far-field stubs ───────────────────────────────────────────────────────
    {
        "server_id": "calendar-tools",
        "app_name": "Calendar Bridge",
        "description": "Query availability blocks, find mutual free slots across attendees, and draft meeting agendas from calendar data.",
        "blueprint_url": "https://stackapps.app/api/mcp-registry/servers/calendar-tools/blueprint",
        "app_url": "https://stackapps.app/stubs/calendar-tools",
        "tools": [
            tool("find_mutual_slots", "Find overlapping free time blocks across a list of attendees.", [
                param("attendee_emails", "string", True, "Comma-separated attendee email addresses."),
                param("duration_minutes", "number", True, "Required meeting duration in minutes."),
                param("date_range", "string", False, "ISO date range to search, e.g. '2026-05-20/2026-05-27'."),
            ]),
            tool("draft_meeting_outline", "Create a meeting agenda with goals, timeboxes, and action item slots.", [
                param("meeting_purpose", "string", True, "One sentence describing the meeting's goal."),
                param("duration_minutes", "number", False, "Meeting duration in minutes. Default 60."),
            ]),
            tool("timezone_normalize", "Convert event times to each attendee's local timezone.", [
                param("event_times", "string", True, "JSON array of ISO datetime strings."),
                param("attendee_timezones", "string", True, "Comma-separated IANA timezone names."),
            ]),
        ],
    },
    {
        "server_id": "filebox-storage",
        "app_name": "Filebox Cloud MCP",
        "description": "Bucket-oriented object storage with presigned upload URLs, prefix listing, and public sharing links.",
        "blueprint_url": "https://stackapps.app/api/mcp-registry/servers/filebox-storage/blueprint",
        "app_url": "https://stackapps.app/stubs/filebox-storage",
        "tools": [
            tool("presign_upload", "Generate a presigned upload URL and required headers.", [
                param("path", "string", True, "Object path including filename, e.g. 'uploads/report.pdf'."),
                param("content_type", "string", False, "MIME type of the file. Default 'application/octet-stream'."),
                param("expires_seconds", "number", False, "URL expiry in seconds. Default 3600."),
            ]),
            tool("list_prefix", "List objects under a path prefix, non-recursively.", [
                param("prefix", "string", True, "Path prefix to list, e.g. 'uploads/'."),
                param("limit", "number", False, "Maximum objects to return. Default 100."),
            ]),
            tool("share_public_link", "Generate a permanent public URL for an existing object.", [
                param("path", "string", True, "Object path to share."),
            ]),
        ],
    },
    {
        "server_id": "web-perf-tools",
        "app_name": "Web Perf Sentinel",
        "description": "Core Web Vitals auditing, cache header checks, and render-blocking script analysis for public URLs.",
        "blueprint_url": "https://stackapps.app/api/mcp-registry/servers/web-perf-tools/blueprint",
        "app_url": "https://stackapps.app/stubs/web-perf-tools",
        "tools": [
            tool("probe_vitals", "Audit a URL for LCP candidates, cache-control headers, and render-blocking patterns.", [
                param("url", "string", True, "Full HTTPS URL to audit."),
                param("categories", "string", False, "Comma-separated categories - 'vitals', 'cache', 'scripts'. Default all."),
            ]),
            tool("compare_urls", "Compare TTFB and total resource counts between two origins.", [
                param("url_a", "string", True, "First URL."),
                param("url_b", "string", True, "Second URL to compare against."),
            ]),
            tool("check_cache_headers", "Summarize cache-control header presence and max-age values for a page's static assets.", [
                param("url", "string", True, "Full HTTPS URL to inspect."),
            ]),
        ],
    },
    {
        "server_id": "email-tools",
        "app_name": "Email Dispatch MCP",
        "description": "Template, validate, and route transactional emails with suppression list checking and bounce payload normalization.",
        "blueprint_url": "https://stackapps.app/api/mcp-registry/servers/email-tools/blueprint",
        "app_url": "https://stackapps.app/stubs/email-tools",
        "tools": [
            tool("render_template", "Merge variables into a stored email template, returning rendered subject and HTML body.", [
                param("template_id", "string", True, "Template identifier."),
                param("variables", "string", True, "JSON string of key-value pairs to merge."),
            ]),
            tool("send_email", "Send a transactional email to a single validated recipient.", [
                param("to", "string", True, "Recipient email address."),
                param("subject", "string", True, "Email subject line."),
                param("html_body", "string", True, "HTML email body."),
                param("from_name", "string", False, "Sender display name."),
            ]),
            tool("validate_recipients", "Check email addresses against format rules and the suppression list.", [
                param("emails", "string", True, "JSON array of email addresses to validate."),
            ]),
        ],
    },
    {
        "server_id": "pdf-tools",
        "app_name": "PDF Workshop",
        "description": "Generate PDFs from HTML, merge ordered PDFs, extract plain text by page range, and split on bookmark entries.",
        "blueprint_url": "https://stackapps.app/api/mcp-registry/servers/pdf-tools/blueprint",
        "app_url": "https://stackapps.app/stubs/pdf-tools",
        "tools": [
            tool("html_to_pdf", "Render an HTML string to a PDF file.", [
                param("html", "string", True, "Full HTML document string to render."),
                param("page_size", "string", False, "Page size - 'A4', 'letter', or 'legal'. Default 'A4'."),
                param("margin_mm", "number", False, "Uniform margin in millimeters. Default 15."),
            ]),
            tool("merge_pdfs", "Merge an ordered list of PDF URLs into a single PDF.", [
                param("pdf_urls", "string", True, "JSON array of publicly accessible PDF URLs in merge order."),
            ]),
            tool("extract_text", "Extract plain text from a PDF by page range.", [
                param("pdf_url", "string", True, "URL of the PDF to extract text from."),
                param("pages", "string", False, "Page range, e.g. '1-5'. Default all pages."),
            ]),
        ],
    },
    {
        "server_id": "analytics-tools",
        "app_name": "Analytics Query Layer",
        "description": "Run canned queries over product event data - DAU/WAU time series, funnel conversion, cohort comparisons, and A/B experiment readouts.",
        "blueprint_url": "https://stackapps.app/api/mcp-registry/servers/analytics-tools/blueprint",
        "app_url": "https://stackapps.app/stubs/analytics-tools",
        "tools": [
            tool("daily_active_series", "Return a DAU or WAU time series for a date window.", [
                param("metric", "string", False, "Metric granularity - 'dau' or 'wau'. Default 'dau'."),
                param("start_date", "string", True, "Start date in ISO format, e.g. '2026-05-01'."),
                param("end_date", "string", True, "End date in ISO format, e.g. '2026-05-14'."),
            ]),
            tool("funnel_snapshot", "Compute step-by-step funnel conversion with drop-off percentages.", [
                param("funnel_id", "string", True, "Funnel identifier in the analytics workspace."),
                param("date_range", "string", False, "ISO date range. Default last 30 days."),
            ]),
            tool("experiment_readout", "Return lift and confidence interval for an A/B experiment.", [
                param("experiment_id", "string", True, "Experiment identifier."),
                param("metric", "string", False, "Primary metric to report on. Default uses experiment config."),
            ]),
        ],
    },
    {
        "server_id": "diagram-as-code",
        "app_name": "Diagram-as-Code",
        "description": "Author architecture, sequence, and topology diagrams from structured text. Outputs SVG or PNG diagram files - not app icons.",
        "blueprint_url": "https://stackapps.app/api/mcp-registry/servers/diagram-as-code/blueprint",
        "app_url": "https://stackapps.app/stubs/diagram-as-code",
        "tools": [
            tool("uml_sequence_from_trace", "Generate a UML sequence diagram from chronological interaction steps.", [
                param("steps", "string", True, "JSON array of steps with actor, action, and target fields."),
                param("title", "string", False, "Diagram title."),
            ]),
            tool("topology_from_inventory", "Render a topology graph from a YAML-style node and edge inventory.", [
                param("inventory_yaml", "string", True, "YAML string with nodes and edges."),
                param("layout", "string", False, "Layout algorithm - 'hierarchical', 'force', or 'circular'. Default 'hierarchical'."),
            ]),
            tool("export_png", "Render a previously generated diagram to PNG at a specified DPI.", [
                param("diagram_id", "string", True, "ID of the diagram to export."),
                param("dpi", "number", False, "Output DPI - 96, 144, or 288. Default 144."),
            ]),
        ],
    },
    {
        "server_id": "license-font-manager",
        "app_name": "License Font Manager",
        "description": "Track webfont entitlements, subsetting plans, and embedding compliance for brand rollouts. Manages font licensing records - does not generate imagery.",
        "blueprint_url": "https://stackapps.app/api/mcp-registry/servers/license-font-manager/blueprint",
        "app_url": "https://stackapps.app/stubs/license-font-manager",
        "tools": [
            tool("inventory_faces", "List all font families and faces active in the workspace.", []),
            tool("embedding_policy_check", "Return allowed embedding flags for a font by foundry.", [
                param("font_family", "string", True, "Font family name, e.g. 'Inter'."),
            ]),
            tool("subset_recommendations", "Suggest Unicode range subsets to minimize web bundle size.", [
                param("font_family", "string", True, "Font family to generate subset recommendations for."),
                param("target_scripts", "string", False, "Comma-separated script targets, e.g. 'latin,latin-ext'. Default 'latin'."),
            ]),
        ],
    },
    {
        "server_id": "localization-copydesk",
        "app_name": "Localization Copydesk",
        "description": "Manage translation keys, enforce glossaries, validate ICU message patterns, and export XLIFF chunks for multilingual app localization.",
        "blueprint_url": "https://stackapps.app/api/mcp-registry/servers/localization-copydesk/blueprint",
        "app_url": "https://stackapps.app/stubs/localization-copydesk",
        "tools": [
            tool("icu_validate", "Validate ICU message strings for syntax and plural branches across locales.", [
                param("messages", "string", True, "JSON object of message key to ICU string pairs."),
                param("locales", "string", False, "Comma-separated locale codes, e.g. 'en,ar,pl'. Default 'en'."),
            ]),
            tool("glossary_apply", "Flag translated strings that deviate from glossary-approved terminology.", [
                param("strings", "string", True, "JSON array of translated strings to check."),
                param("locale", "string", True, "Target locale code, e.g. 'fr'."),
            ]),
            tool("export_xliff_chunk", "Export a namespace of translation keys as XLIFF 1.2 for vendor handoff.", [
                param("target_locale", "string", True, "Target locale code."),
                param("key_prefix", "string", False, "Key namespace prefix to export. Default exports all keys."),
                param("include_context", "boolean", False, "Include source context notes. Default true."),
            ]),
        ],
    },
    {
        "server_id": "presentation-deck-ai",
        "app_name": "Presentation Deck Builder",
        "description": "Turn outlines into slide titles, bullet points, and speaker notes. Produces structured slide content - not visual imagery or image assets.",
        "blueprint_url": "https://stackapps.app/api/mcp-registry/servers/presentation-deck-ai/blueprint",
        "app_url": "https://stackapps.app/stubs/presentation-deck-ai",
        "tools": [
            tool("outline_to_slides", "Transform a hierarchical outline into ordered slide titles and bullets.", [
                param("outline", "string", True, "Hierarchical outline using indentation or markdown list syntax."),
                param("tone", "string", False, "Tone - 'formal', 'conversational', or 'sales'. Default 'conversational'."),
            ]),
            tool("speaker_notes_expand", "Expand slide bullets into short spoken cues for presenter notes.", [
                param("slide_bullets", "string", True, "JSON array of bullet strings from a single slide."),
                param("duration_seconds", "number", False, "Target speaking time per slide in seconds. Default 90."),
            ]),
            tool("aspect_ratio_preset", "Return slide dimension recommendations for a standard presentation format.", [
                param("format", "string", True, "Format - 'widescreen' (16:9), 'classic' (4:3), or 'portrait' (9:16)."),
            ]),
        ],
    },
]


def attach_created_at(stub: dict, created_at: str) -> dict:
    return {
        **stub,
        "is_stub": True,
        "created_at": created_at,
        "blueprint_text": _read_blueprint(stub["server_id"]),
    }
