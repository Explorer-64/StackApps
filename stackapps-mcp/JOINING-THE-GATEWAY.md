# Joining the Gateway — Playbook for Adding a Member App

This is the authoritative checklist for adding a new StackApps member app's paid
tools to the stackapps-suite-mcp gateway. Follow it exactly — do not improvise
from other apps' code. When this document and existing code disagree, this
document wins; flag the discrepancy to Abe.

**Architecture recap:** There is exactly ONE MCP server for the whole suite
(this package). Member apps never get their own MCP server. Each member app
hosts its own x402 paid HTTP routes on its own backend; the gateway's tools
relay to those routes and handle payment. Cloud Run (`mcp.stackapps.app`)
serves blueprint discovery ONLY — paid tools run locally over stdio.

---

## Invariants — never change these

- `SUITE_PAY_TO` in `stackapps_mcp/x402_http.py` (`0x1f2A484ef654d49c58c625b09e78B538501D652D`).
  Every member app's x402 middleware must pay to this exact address. The client
  refuses to sign payments to any other address. If Abe ever rotates the wallet,
  it changes in BOTH places (all app backends + this constant) in one release.
- Network `eip155:8453` (Base mainnet), asset USDC
  (`0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`).
- The payment guards in `SuiteX402Http` (pay-to pin + per-call amount cap).
  Never bypass them "temporarily". If a new tool must cost more than $0.50,
  raise `_DEFAULT_MAX_USD_PER_CALL` deliberately and update the `client-safety`
  note in `blueprint.txt` in the same commit.
- `WALLET_PRIVATE_KEY` is NEVER set on Cloud Run. The hosted service is
  discovery-only (`discovery_only=True`). See `http_main.py` and `deploy-mcp.sh`.
- `stateless_http=True` on the FastMCP constructor and the SSE guard middleware
  stay in place (Cloud Run requirements — see global CLAUDE.md).
- Do NOT create a new MCP server for the new app. Tools plug in here.

---

## Part A — App side (the member app's repo, any stack)

The app must expose one POST route per paid capability, satisfying this
contract (framework doesn't matter; Imagcon's backend is the worked example):

1. **Route:** `POST https://<app-domain>/routes/x402/<capability-name>`.
   Public — no auth, no API key. Input is multipart form (for file uploads) or
   JSON. Output is the deliverable (`application/zip`, JSON, etc.).
2. **x402 middleware (v2):** on an unpaid request, respond `402` with the
   challenge in the `Payment-Required` header (base64 JSON). The challenge's
   `accepts` entry must be:
   - `scheme: "exact"`, `network: "eip155:8453"`
   - `asset: 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913` (USDC on Base)
   - `payTo: 0x1f2A484ef654d49c58c625b09e78B538501D652D` (the suite wallet —
     use the shared `X402_PAY_TO_ADDRESS` env var, never a new wallet)
   - `amount`: price in USDC atomic units (6 decimals; $0.10 = `"100000"`).
     Keep prices at or under $0.50 unless the gateway cap is raised first.
3. **On paid retry** (request carries the signed payment header), settle via
   the x402 middleware and return the result.
4. **Optional but recommended:** include the Bazaar `extensions` metadata in
   the challenge (input/output schema) — this is what gets the capability
   indexed. Copy the shape from Imagcon's middleware config.
5. **Verify before proceeding to Part B:**
   `curl -s -D - -o /dev/null -X POST https://<app-domain>/routes/x402/<name> -H 'Content-Type: application/json' -d '{}'`
   must return `HTTP 402` with a `Payment-Required` header whose decoded
   `payTo` equals the suite wallet exactly.

---

## Part B — Gateway side (this package)

1. **Adapter module:** create `stackapps_mcp/<app>.py` modeled on
   `stackapps_mcp/imagcon.py`:
   - URL constants for each endpoint.
   - Constructor takes `(private_key, network)` and builds a `SuiteX402Http`.
   - One method per capability calling `self._x402.post(...)`.
   - Do NOT copy Imagcon's profile-token logic unless the app actually issues
     `X-<App>-Token` headers.
   - Never construct raw httpx clients or handle 402 responses in the adapter —
     that is `SuiteX402Http`'s job (it owns the safety guards).
2. **Tools:** add `@mcp.tool()` functions in `stackapps_mcp/server.py`, modeled
   on the existing ones. Docstring must state what it does and the exact price
   ("Costs $X.XX USDC"). If the tool writes files, use `_safe_extractall` for
   zips and document `output_dir`.
3. **Wiring:** `main.py` constructs clients and passes them to the server
   (see `set_client`). Extend the same pattern — one client per member app,
   all sharing the wallet key. Close all clients in the `finally` block.
4. **Blueprint (`stackapps_mcp/blueprint.txt`):** update ALL of:
   - `# Version:` (bump minor) and `# Updated:` date
   - `## SUMMARY` capabilities list (one line, with price)
   - `### MCP TOOLS` (one line: `tool | params | description ($price) | source: <domain>`)
   - a full `## CAPABILITY:` block with `### MCP tool:` sub-block
   - `## SUITE` members list (move the app from "planned" to "live")
5. **Release:** bump `version` in `pyproject.toml`. Build the wheel
   (`uv build`), copy it to `client/public/downloads/`, then update the wheel
   filename in every place that references it:
   - `_WHEEL_URL` in `stackapps_mcp/server.py`
   - all install/config lines in `stackapps_mcp/blueprint.txt`
   - `client/public/llms.txt` and the hub blueprint files if they mention it
   Old wheel stays available for one release, then delete it.
6. **Deploy discovery:** run `./deploy-mcp.sh` from the repo root (deploys the
   blueprint-only Cloud Run service; scale-to-zero, no secrets).

---

## Verification checklist (all must pass)

- [ ] Live 402 probe of each new app endpoint shows `payTo` == suite wallet.
- [ ] Guard test: feed the engine a forged challenge (wrong wallet / over-cap)
      and confirm `NoMatchingRequirementsError` refusal; a legit challenge signs.
      (Use a throwaway key — see the test pattern in the session that built this.)
- [ ] `python -c "from stackapps_mcp import server, main"` imports cleanly in
      the package venv.
- [ ] MCP inspector (or `claude mcp add` locally): new tools appear in the tool
      list with correct descriptions and prices.
- [ ] One real paid call per new tool from a funded test wallet; deliverable
      arrives; payment visible on Base for the correct amount.
- [ ] `https://mcp.stackapps.app/blueprint.txt` serves the updated version.
- [ ] Wheel installs: `uvx --from <wheel-url> stackapps-suite-mcp --help`.

---

## Current member apps

| App | Status | Adapter |
|---|---|---|
| imagcon.app | live (5 paid + 2 free capabilities) | `stackapps_mcp/imagcon.py` |
| stackbill.app | planned | — |
| stackslip.app | planned | — |

Candidate future members (shipped apps, no x402 routes yet): stackspent.app,
stacktax.app, stackvideo.app, stackagent.app, stacklaunch.app, calypterv.com,
easyhomeflow.com, dicta-notes.com.
