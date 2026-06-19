Fix validateBlueprintTxt in functions/src/scannerContentChecks.ts. The previous pass implemented this as requiring a literal `## CAPABILITY` block, which is wrong — it only recognizes Blueprint Protocol v2.0.0 Format A and produces false negatives on every spec-compliant Format B blueprint (e.g. imagcon.app currently fails scan_blueprint despite being correctly structured).

Background (Blueprint Protocol v2.0.0 spec, confirmed from SPEC.md):
- Format A (inline, <10 capabilities): root blueprint.txt contains one or more `## CAPABILITY: <capability-id>` blocks directly.
- Format B (index, larger apps): root blueprint.txt contains a `## CAPABILITIES` header followed by index lines of the form `<capability-id>: <url> | <actor>` (actor is one of `mcp`, `ui`, `human-only`), each pointing to a standalone per-capability file. The spec explicitly states: "Root blueprint MUST NOT contain inline `## CAPABILITY:` blocks when using Format B."

Both formats are valid and must pass scan_blueprint. Update validateBlueprintTxt so it requires:
1. `ok` is true and body contains the literal header `# BLUEPRINT:` (unchanged from before), AND
2. EITHER:
   - Format A: at least one line matching `/^## CAPABILITY:\s*\S/m` (note the colon — the previous regex `/^## CAPABILITY/m` lacked it and would also match the Format B header `## CAPABILITIES` as a false positive, which is a separate latent bug worth fixing in the same pass), OR
   - Format B: body contains a line matching `/^## CAPABILITIES\s*$/m` AND at least one subsequent line matching `/^\S+:\s*\S+\s*\|\s*(mcp|ui|human-only)\s*$/m`

Implementation notes:
- Keep this scoped to validateBlueprintTxt only — don't touch validateSitemap, validateRobotsTxt, validateLlmsTxt, or anything in scanner.ts.
- Don't follow the URLs listed in a Format B index to validate the per-capability files themselves — that's a deeper check (each capability file having its own valid `## CAPABILITY:` block) and is out of scope for the free/baseline tier. Presence of well-formed index lines is sufficient for baseline.
- After changing, re-fetch and check https://imagcon.app/blueprint.txt — it should now pass scan_blueprint (it uses Format B with a `## CAPABILITIES` header and `<id>: <url> | <actor>` lines, confirmed via direct fetch). Also re-check stackapps.app (or whichever app was previously confirmed gold) to make sure it still passes under Format A.
