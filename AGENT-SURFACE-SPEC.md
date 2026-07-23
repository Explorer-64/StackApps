# Agent-Facing Surface Spec — MCP Distribution, x402, and Blueprint

This is the standard for how every StackApps member app presents itself to
automated consumers: MCP tooling, x402 paid endpoints, and blueprint.txt.
Follow it for any new app, and bring an existing app into line with it the
next time you touch that app's agent-facing surface.

Written 2026-07-23 after `stackapps-suite-mcp` spent 9+ days with fixed code
that never reached PyPI, then a registry entry that actively lied about
which PyPI version existed, then a live blueprint.txt that was 12 days
stale — three separate instances of the same failure inside one package.
Every rule below traces back to one of those three, or to the investigation
that fixed them. Where a rule seems arbitrary, read the "Why" — it isn't.

This document covers pillars 1 and 3 below in full. Pillar 2 (x402) is
already fully specified elsewhere and is summarized here only enough to
show how it fits with the other two — see the pointers in that section.
Do not fork x402 rules into this file; edit the canonical sources instead,
or two documents will quietly disagree with each other, which is the exact
disease this spec exists to prevent.

---

## The one rule underneath all the others

**A change is not done when the code is correct. It is done when the thing
a stranger (human or agent) actually reaches — the live PyPI page, the live
registry entry, the live blueprint.txt URL — reflects it, and you checked
that URL yourself.** Every section below is this rule applied to one
specific surface. If you're ever unsure whether something needs a step
beyond "commit and push," assume it does and go verify the live artifact.

---

## Pillar 1 — MCP Distribution

### Rule: never PyPI (or npm) as the only distribution path

Self-host: build the wheel, attach it to a GitHub Release, and document
install as `uvx --from <release-url> <package-name>`. If the package is
listed on the official MCP Registry, use it as a *secondary*, auto-synced
mirror — never as the thing anyone is told to actually run.

**Why:** PyPI publishing is gated by a personal API token. That token can
go missing (imagcon-mcp, 2026-06-18 — no recoverable credentials, stuck on
a stale version with no way to push a fix) or simply not be present in
whatever environment is doing the work (this session, building
`stackapps-suite-mcp` 0.1.8 — code was correct and committed, but had no
way to reach PyPI at all). A GitHub Release has no equivalent failure mode
in this suite: `gh` is already authenticated everywhere this work happens,
the repos are public, and there is no separate account to lose access to.
PyPI also buys nothing here — it is not a discovery channel. The agents
that actually pay for anything (the x402 wallet economy) never touch PyPI,
npm, or MCP tooling at all; they crawl CDP Bazaar and 402index against raw
HTTP endpoints. PyPI's only real audience is a developer who deliberately
wires this gateway into their own MCP client — a small, already-self-selected
group for whom `uvx --from <url>` is exactly as easy as `uvx <name>`.

### Rule: registry listings are automated, not manual

If the package is listed on `registry.modelcontextprotocol.io`, publish it
via a GitHub Actions workflow using `mcp-publisher login github-oidc`
(zero stored secrets — the workflow's own OIDC token authenticates it),
triggered on your release-tag pattern plus `workflow_dispatch` for manual
runs. Never run `mcp-publisher publish` by hand from a laptop as the normal
path.

**Why:** the registry entry is a second copy of "what version is current."
Anything that requires a human to remember to re-run a command after every
release *will* eventually be forgotten — that's exactly what happened here:
`server.json` sat pointing at PyPI 0.1.6/0.1.7 while the real released
version moved past it, and by the time this was caught, the file even
locally claimed a PyPI version (0.1.8) that had never been published —
an outright false claim, not just a stale one. Automating the publish step
on the same trigger as the release removes the human memory dependency
entirely. Reference workflow:
`stackapps-mcp/.github/workflows/publish-mcp-registry.yml` (repo root:
`.github/workflows/publish-mcp-registry.yml`).

### Rule: never label a plain wheel as `registryType: mcpb`

If you want a real one-click-installable registry entry, build an actual
MCPB bundle (`modelcontextprotocol/mcpb` spec — a zip with `manifest.json`;
`server.type: "uv"` mode fits a `uv`/`pyproject.toml` project without
needing to vendor compiled dependencies). Do not just point `registryType:
mcpb` at a `.whl` file to get past registry validation.

**Why:** the registry's own `mcpb` validator only checks URL shape,
host allowlist (GitHub/GitLab Releases only — no other host qualifies,
confirmed from the validator source, not the docs), and a SHA-256 hash. It
does not check file contents. A plain wheel would pass that check and still
be actively broken for any real MCPB-aware client, which downloads the
file, verifies the hash, and then tries to install it *as a bundle* —
unzip, read `manifest.json`, run the declared entry point. A wheel has none
of that structure. Passing registry validation is not the same as working.

### Rule: before building an MCPB bundle for "human install UX," check whether a human is actually in that path

Ask whether anyone who would use this integration is *also* someone who
would be blocked by a terminal command. For any x402/wallet-gated
capability, the answer is almost always no: holding a funded EVM wallet and
understanding x402 well enough to hand a private key to a local process is
a strictly higher bar than pasting one `uvx --from` line. MCPB's entire
value is removing that terminal-command step for a non-technical human — a
persona that mostly doesn't exist for wallet-gated tools. Don't build it on
spec; build it when a real GUI-only audience shows up.

### Release checklist (generalize from `stackapps-suite-mcp` 0.1.8)

1. `uv build` → wheel + sdist in `dist/`.
2. `gh release create <package>-v<version> dist/<wheel> dist/<sdist> --title "..." --notes "..."`
   on the app/package's actual repo (confirm it's public first — private
   repos 404 on public release URLs).
3. Smoke-test the exact install line a stranger would run:
   `uvx --from <release-url> <package-name> --help` — must actually run, not
   just resolve.
4. Update every place the install command or version number appears
   (README, blueprint.txt, `server.json` if registry-listed) to the new URL.
5. Push the tag if the registry-publish workflow triggers on tags; otherwise
   run `workflow_dispatch` once to confirm it works, then rely on the tag
   trigger going forward.
6. Verify the *live* registry entry (`curl
   https://registry.modelcontextprotocol.io/v0/servers?search=<name>`) shows
   the new version as `isLatest: true` with no stale package claim.

---

## Pillar 2 — x402 Payment System (pointer, not a fork)

Fully specified in:
- Global `CLAUDE.md`, "x402 / CDP Paid Endpoints" section (payment
  mechanics, wallet-profile security rules, discoverability, ecosystem
  strategy).
- `stackapps-mcp/JOINING-THE-GATEWAY.md` (the concrete checklist for wiring
  a new app's paid routes into the shared gateway — invariants, payTo pin,
  per-call cap, signature rules).

The one thing worth restating here because it connects directly to Pillar 3:
**every x402 route's price, description, and status must match what
`blueprint.txt` claims about it.** A route that changed price or got
retired without a blueprint update is the same failure mode as a stale MCP
install line — a live artifact silently diverging from what agents are
told to expect.

---

## Pillar 3 — Blueprint Accuracy

### Rule: a blueprint edit is not done until the live URL shows it

`blueprint.txt` changes require an explicit deploy step for whatever serves
it (Cloud Run for `mcp.stackapps.app`, Firebase Hosting for each app's own
domain). Committing the file is necessary but never sufficient. After
deploying, `curl` the real URL and confirm the version string, date, and
specific content you changed are actually there.

**Why:** in this same session, `mcp.stackapps.app/blueprint.txt` was found
serving version 1.4.0 (dated 2026-07-11) while the repo's copy had already
moved through 1.5.0 (2026-07-14) and a same-day 1.5.1 fix — twelve days of
drift that nothing surfaced until someone manually curled the live URL.
Imagcon hit the identical gotcha independently: a bare `firebase deploy
--only hosting` ships whatever is already in `dist/`, silently skipping a
rebuild — see `feedback` memory `project_seo_head_helmet_pattern` /
deployment notes in that project. Always use the app's build-then-deploy
script (`./deploy.sh --frontend` for Firebase apps, `./deploy-mcp.sh` for
the gateway's Cloud Run discovery service), never a bare deploy command.

### Rule: every install/version claim in a blueprint must be independently checkable

Any line like `package: X on PyPI` or `fallback-wheel: <url>` is a factual
claim, not documentation flavor. Before writing one, check it's still true
the same way you'd check any other fact — `curl` the URL, query the actual
package index. Don't copy the line forward from the last version without
re-verifying it.

**Why:** the fallback-wheel line in this blueprint pointed at a real,
still-live URL — but the wrong version (0.1.7, after 0.1.8 shipped
elsewhere). It wasn't a broken link, which would have been caught fast; it
was a *plausible*, *working*, *wrong* link, which is worse because nothing
about using it fails loudly.

### Rule: capability lists in the blueprint must track the actual tool list

When a release adds or renames MCP tools (see the `setup_wallet_profile` →
`setup_wallet_profile_imagcon`/`_stackbill`/`_dicta` split in
`stackapps-suite-mcp` 0.1.8), the blueprint's `### MCP TOOLS` table and each
capability's `### MCP tool:` sub-block must be updated in the same change.
An agent reading a blueprint that names a tool which no longer exists (or
misses one that does) gets a worse outcome than an agent with no blueprint
at all, because it trusted the document.

**Status note:** as of this writing, `stackapps-suite-mcp`'s blueprint.txt
still only documents the pre-0.1.8 tool set — the Dicta-Notes relay tools
and the new Imagcon tools (`resize_generated_image`, `check_icon`,
`rotate_api_key`) are live and working but undocumented in the blueprint.
This is flagged, not fixed, as of 2026-07-23 — a concrete example of this
rule being violated in the wild; fix it the next time this file is touched.

---

## Applying this to a new member app

1. **x402 routes:** follow `JOINING-THE-GATEWAY.md` Part A end to end.
2. **Gateway wiring:** follow `JOINING-THE-GATEWAY.md` Part B, but for the
   release step (Part B, item 5), use this document's Pillar 1 release
   checklist instead of the `client/public/downloads` wheel-copy process
   described there — that process was superseded by the GitHub Release
   pattern and is stale (flagged for cleanup; `client/public/downloads/`
   in this repo still holds orphaned 0.1.5/0.1.7 wheels from when that was
   the real path).
3. **Blueprint:** update the app's own `blueprint.txt` (or the shared
   gateway's, if the capability is x402/MCP) per Pillar 3, deploy it, and
   verify the live URL before considering the app's agent-facing surface
   done.
4. **If the app ever wants its own standalone MCP server** (like
   `imagcon-mcp`, distinct from the shared gateway) rather than plugging
   into `stackapps-suite-mcp`: apply Pillar 1 to that package
   independently. It gets its own repo, its own releases, its own
   self-hosted distribution — the same rules, not a different set.
