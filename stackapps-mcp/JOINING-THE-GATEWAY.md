# Joining the Gateway — Playbook for Adding a Member App

**Hand this file with `../AGENT-SURFACE-SPEC.md` and say “go.”** You do not
need a second brief. This document is the concrete wiring checklist for
plugging a member app’s paid HTTP routes into `stackapps-suite-mcp`.
`AGENT-SURFACE-SPEC.md` is the parity / distribution / live-URL bar that
applies to **both** the member app and this gateway. Neither file alone is
enough for a full join.

## Go — definition of done

Joining is done only when **all** of these are true:

1. **Part A (app):** each new paid route returns a real `402` whose decoded
   `payTo` equals the suite wallet; network/asset/amount match the contract
   below; the app’s **own** live `blueprint.txt` (and agent digest if any)
   lists the route at the correct price (see `AGENT-SURFACE-SPEC.md`).
2. **Part B (gateway):** adapter + `@mcp.tool`s + `stackapps_mcp/blueprint.txt`
   + release + `./deploy-mcp.sh` are done; **live**
   `https://mcp.stackapps.app/blueprint.txt` shows the new tools, prices,
   and member status — `curl` verified, not assumed from deploy exit code.
3. **Inventory parity:** every new tool in `server.py` appears in the
   gateway blueprint’s `### MCP TOOLS` and a `## CAPABILITY:` block. No
   orphan tools; no ghost tools. (Same disease as Imagcon/suite drift —
   see `AGENT-SURFACE-SPEC.md` Pillar 3.)
4. **Cap honesty:** if any tool costs more than the current
   `STACKAPPS_MAX_USD_PER_CALL` default (**$0.50**), you raised the cap
   deliberately in the same change and documented it in the blueprint
   `client-safety` note. Do not ship a tool that the client will refuse
   to sign. (`dicta_transcribe_long` at **$0.59** is the existing example —
   it requires the cap override path; copy that discipline, don’t ignore it.)
5. **Verification checklist** at the bottom of this file is fully checked,
   including one real paid call per new paid tool.

Repo-correct and live-wrong is **not** done.

### Operator prompt (paste as-is)

> Apply `JOINING-THE-GATEWAY.md` and `AGENT-SURFACE-SPEC.md` to add this
> app’s x402 capabilities to `stackapps-suite-mcp`. Follow Parts A and B
> exactly; do not invent a second MCP server for the suite. Done means
> live `https://mcp.stackapps.app/blueprint.txt` and the app’s own live
> blueprint both verified by curl, with tool inventory matching `server.py`.

### Worked examples

- **App-side x402 contract:** Imagcon
  (`https://imagcon.app/blueprint.txt`, routes under
  `https://imagcon.app/routes/x402/…`).
- **Gateway adapter shape:** `stackapps_mcp/imagcon.py` (+ `stackbill.py`,
  `dicta.py`).
- **Surface discipline:** live Imagcon + `AGENT-SURFACE-SPEC.md` Go bar.

---

## Architecture (read before wiring)

There is exactly **one suite gateway MCP server**: this package
(`stackapps-suite-mcp`). Paid suite tools run locally over stdio with
`WALLET_PRIVATE_KEY`. Cloud Run (`mcp.stackapps.app`) serves blueprint
discovery ONLY — never set the wallet key there.

**Do not create a second suite MCP** for the new app. Tools plug into this
package.

**Separate from the suite:** a member app may also ship its **own**
account-key MCP (e.g. Imagcon’s `imagcon-mcp` via `ic_live_` keys). That is
a different product surface (credits / API key, not suite wallet relay).
If you add one, apply `AGENT-SURFACE-SPEC.md` Pillar 1 to that package
independently — do not confuse it with this gateway join.

When this document and existing code disagree, this document wins; flag the
discrepancy to Abe. When this document and `AGENT-SURFACE-SPEC.md` disagree
on distribution or live-URL discipline, **AGENT-SURFACE-SPEC wins** (this
file already defers release/deploy verification to it).

---

## Invariants — never change these

- `SUITE_PAY_TO` in `stackapps_mcp/x402_http.py` (`0x1f2A484ef654d49c58c625b09e78B538501D652D`).
  Every member app's x402 middleware must pay to this exact address. The client
  refuses to sign payments to any other address. If Abe ever rotates the wallet,
  it changes in BOTH places (all app backends + this constant) in one release.
- Network `eip155:8453` (Base mainnet), asset USDC
  (`0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`).
- The payment guards in `SuiteX402Http` (pay-to pin + per-call amount cap).
  Never bypass them "temporarily". If a new tool must cost more than the
  current default (**$0.50**, env `STACKAPPS_MAX_USD_PER_CALL`), raise the
  cap deliberately and update the `client-safety` note in
  `stackapps_mcp/blueprint.txt` in the same commit. Existing exception:
  Dicta long-form transcribe at $0.59 — that join already required the
  override path; any new over-cap price needs the same explicit treatment.
- `WALLET_PRIVATE_KEY` is NEVER set on Cloud Run. The hosted service is
  discovery-only (`discovery_only=True`). See `http_main.py` and `deploy-mcp.sh`.
- `stateless_http=True` on the FastMCP constructor and the SSE guard middleware
  stay in place (Cloud Run requirements — see global CLAUDE.md).
- Do NOT create a new **suite** MCP server for the new app. Tools plug in here.

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
     Keep prices at or under the gateway cap unless the cap is raised first
     (see Invariants).
3. **On paid retry** (request carries the signed payment header), settle via
   the x402 middleware and return the result.
4. **Optional but recommended:** include the Bazaar `extensions` metadata in
   the challenge (input/output schema) — this is what gets the capability
   indexed. Copy the shape from Imagcon's middleware config.
5. **App blueprint (required for Go):** add/update the capability on the app’s
   own live `blueprint.txt` (price, path, payment mechanics) and deploy/verify
   per `AGENT-SURFACE-SPEC.md` Pillar 3. Gateway wiring does not replace the
   app’s public agent surface.
6. **Verify before proceeding to Part B:**
   `curl -s -D - -o /dev/null -X POST https://<app-domain>/routes/x402/<name> -H 'Content-Type: application/json' -d '{}'`
   must return `HTTP 402` with a `Payment-Required` header whose decoded
   `payTo` equals the suite wallet exactly.

---

## Identity & profile endpoints (if the app has them) — security rules

Learned from Imagcon's wallet-profile hardening (2026-07-04). If a member app
adds any account-ish surface to its x402 flows (profiles, saved data, tokens),
these rules apply:

1. **Secrets never appear in unauthenticated reads.** A public lookup endpoint
   may return status and dates — never tokens, API keys, or anything that
   gates a write. (Imagcon originally returned `profile_token` in the public
   wallet lookup, which made it derivable from public on-chain data.)
2. **Public identifiers never authorize writes.** A wallet address is public
   information; anyone can enumerate payers on-chain. Any endpoint that
   creates/changes profile data must require proof of wallet control:
   a signature from the wallet key over the request payload.
3. **Signature checks must be replay-proof.** The signed message includes a
   timestamp or nonce, and the server rejects stale/reused signatures.
4. **Zero human friction.** The MCP client signs automatically with the same
   key it pays with — no extra agent inputs, no user prompts. Agents bounce at
   any extra step (empirically confirmed by Abe). If a security measure adds a
   visible step, redesign it to ride on the payment key instead.
5. **The strong credential (API key etc.) gates data access only** — saved
   content, galleries, full MCP tools. Do not require it for activation or
   profile writes; users who haven't activated yet don't have it.

---

## Part B — Gateway side (this package)

1. **Adapter module:** create `stackapps_mcp/<app>.py` modeled on
   `stackapps_mcp/imagcon.py`:
   - URL constants for each endpoint.
   - Constructor takes a `SuiteX402Http` (or `(private_key, network)` and
     builds one — match the current pattern in `main.py`).
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
   - `## SUMMARY` / IDENTITY copy if it lists member apps
   - `### MCP TOOLS` (one line per tool: `tool | params | description ($price) | source: <domain>`)
   - a full `## CAPABILITY:` block with `### MCP tool:` sub-block for each
   - `## SUITE` members list (status accurate: live / demoted / planned —
     do not leave a live app described as planned)
   - **Parity check:** `server.py` tool names ⊆ blueprint MCP TOOLS. If you
     only document “the new ones” and leave prior undocumented tools missing,
     you failed Go (current known debt: Dicta tools and newer Imagcon tools
     such as `check_icon` / `resize_generated_image` were live in code while
     the gateway blueprint lagged — fix forward, don’t repeat).
5. **Release:** bump `version` in `pyproject.toml`, then follow the release
   checklist in `../AGENT-SURFACE-SPEC.md` (Pillar 1) — build the wheel,
   attach it to a GitHub Release, update every install line to the new
   release URL, and let the OIDC workflow re-publish the registry entry.
   Do **not** use `client/public/downloads/` or a `_WHEEL_URL` constant —
   that was the pre-2026-07-23 process and is superseded; PyPI is not the
   distribution path either (see AGENT-SURFACE-SPEC Pillar 1).
   `client/public/downloads/` may still hold orphaned wheels from the old
   process — leave them; don’t resurrect the pattern.
6. **Deploy discovery:** run `./deploy-mcp.sh` from the repo root (deploys the
   blueprint-only Cloud Run service; scale-to-zero, no secrets), then `curl
   https://mcp.stackapps.app/blueprint.txt` and confirm the live version
   string and your new tool lines are actually there — do not assume the
   deploy succeeded from its exit code alone.

---

## Verification checklist (all must pass)

- [ ] Live 402 probe of each new app endpoint shows `payTo` == suite wallet.
- [ ] App’s own live blueprint lists each new route at the correct price.
- [ ] Guard test: feed the engine a forged challenge (wrong wallet / over-cap)
      and confirm `NoMatchingRequirementsError` refusal; a legit challenge signs.
      (Use a throwaway key — see the test pattern in the session that built this.)
- [ ] If price > default cap: `STACKAPPS_MAX_USD_PER_CALL` / blueprint
      `client-safety` updated in the same change.
- [ ] `python -c "from stackapps_mcp import server, main"` imports cleanly in
      the package venv.
- [ ] MCP inspector (or `claude mcp add` locally): new tools appear in the tool
      list with correct descriptions and prices.
- [ ] One real paid call per new paid tool from a funded test wallet; deliverable
      arrives; payment visible on Base for the correct amount.
- [ ] `https://mcp.stackapps.app/blueprint.txt` serves the updated version **and**
      lists every new `server.py` tool (parity).
- [ ] Wheel installs: `uvx --from <release-wheel-url> stackapps-suite-mcp --help`.

---

## Current member apps

Status of adapters in this package (source of truth for “is there an adapter”
is the file; source of truth for “is the live blueprint honest” is
`curl https://mcp.stackapps.app/blueprint.txt` — those can drift; Go forbids
leaving that drift after your change).

| App | Gateway adapter | Notes |
|---|---|---|
| imagcon.app | `stackapps_mcp/imagcon.py` | Live. Paid x402 routes include icons/splash/generate/resize/validate/check-icon; free `resize-generated` + profile tools. Also has standalone `imagcon-mcp` (account-key) — not this gateway. |
| stackbill.app | `stackapps_mcp/stackbill.py` | Live. Invoice PDF + profile activate. |
| dicta-notes.com | `stackapps_mcp/dicta.py` | Live in code (transcribe + transcribe-long + profile/transcript tools). **Gateway blueprint must list them** — treat missing blueprint lines as a Go failure, not “optional polish.” |
| stackslip.app | — | Demoted (packing-slip x402 showed ~$0 measured demand in the 2026-07-18 scan). Do not list as planned. |

Candidate future members (shipped apps, no x402 routes yet): stackspent.app,
stacktax.app, stackvideo.app, stackagent.app, stacklaunch.app, calypterv.com,
easyhomeflow.com.

Do not hard-code capability counts in this table — they drift. Count tools in
`server.py` / the adapter when you need a number.
