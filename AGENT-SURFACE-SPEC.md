# Agent-Facing Surface Spec — MCP Distribution, x402, and Blueprint

**Hand this file to any app and say “go.”** You do not need a second brief.
The operator prompt is: bring this app’s agent-facing surfaces to the
parity bar below, using live Imagcon as the worked example, and follow the
three pillars in this document for distribution, x402, and blueprint
discipline.

## Go — definition of done (parity bar)

An app’s agent-facing surface is done only when **all** of these are true:

1. **Code ↔ docs ↔ live URL agree.** Registered MCP tools (and paid x402
   routes) match what `blueprint.txt` / capability files claim, match what
   `llms.txt` (or equivalent agent digest) claims, and match what a stranger
   gets when they `curl` the **live** URLs — not only what’s in the repo.
2. **No orphan tools, no ghost tools.** Every real tool has a capability
   (or an explicit, honest exception). Every named tool still exists.
3. **Local vs hosted (if both exist) is explicit.** What each transport
   omits, and whether `output_dir` extracts locally or the hosted path
   returns a download URL, is stated where an agent would act on it.
4. **Install/version claims are checkable and true** (Pillar 1).
5. **x402 prices/descriptions/status match the blueprint** (Pillar 2) —
   edit the canonical x402 docs, do not fork them here.
6. **You verified the live artifacts yourself after deploy** (Pillar 3).

Repo-correct and live-wrong is **not** done. FAQ / marketing blurbs that
still teach the old matrix are **not** done.

### Canonical worked example (public)

Use Imagcon’s live surfaces as the reference implementation of this bar:

- https://imagcon.app/blueprint.txt  
  (also https://imagcon.app/.well-known/blueprint.txt)
- https://imagcon.app/llms.txt  
- Capability files under https://imagcon.app/blueprints/

Imagcon is the flagship example: copy its *discipline* (inventory parity,
transport honesty, deploy-then-curl), not its product features. If this
app’s surfaces would confuse an agent that already understands Imagcon’s
blueprint shape, they are not done.

### Operator prompt (paste as-is)

> Apply `AGENT-SURFACE-SPEC.md` end to end to this app. Bring MCP, x402,
> and blueprint/`llms` (or equivalent) to the Go parity bar. Use live
> Imagcon (`imagcon.app/blueprint.txt` + `llms.txt`) as the worked
> example. Do not fork x402 rules — follow the pointers in Pillar 2.
> Done means live URLs verified, not only a green local diff.

---

## Scope and reuse

This is the standard for how StackApps member apps present themselves to
automated consumers: MCP tooling, x402 paid endpoints, and blueprint.txt.
It is written so the same file can be applied to any member app, and so
the standard itself can be published or reused outside StackApps without
a private oral tradition — the Go section, Imagcon URLs, and pillars are
the complete handoff.

StackApps-specific paths below (`JOINING-THE-GATEWAY.md`, suite-mcp
workflows, `mcp.stackapps.app`) are **concrete instances** of the rules.
When applying this outside StackApps, keep the rules and swap in that
org’s canonical x402/gateway docs and deploy scripts.

Written 2026-07-23 after `stackapps-suite-mcp` spent 9+ days with fixed
code that never reached PyPI, then a registry entry that actively lied
about which PyPI version existed, then a live blueprint.txt that was 12
days stale — three separate instances of the same failure inside one
package. A later Imagcon pass confirmed the same disease on a flagship
app (repo honest, live stale; tool inventory drift across blueprint /
`llms.txt` / FAQ). Every rule below traces back to those incidents.
Where a rule seems arbitrary, read the "Why" — it isn't.

This document covers pillars 1 and 3 below in full. Pillar 2 (x402) is
already fully specified elsewhere and is summarized here only enough to
show how it fits with the other two — see the pointers in that section.
Do not fork x402 rules into this file; edit the canonical sources instead,
or two documents will quietly disagree with each other, which is the exact
disease this spec exists to prevent.

---

## The one rule underneath all the others

**A change is not done when the code is correct. It is done when the thing
a stranger (human or agent) actually reaches — the live package/install
URL, the live registry entry, the live blueprint.txt URL — reflects it,
and you checked that URL yourself.** Every section below is this rule
applied to one specific surface. If you're ever unsure whether something
needs a step beyond "commit and push," assume it does and go verify the
live artifact.

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
  per-call cap, signature rules). That file has its own **Go** section;
  for a gateway join, hand **both** this spec and JOINING-THE-GATEWAY.md.

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

Stop when the **Go — definition of done** checklist at the top is satisfied
for this app (including live URL verification). The steps below are the
StackApps wiring path; the parity bar is the exit criterion.

1. **x402 + gateway join:** hand and follow `JOINING-THE-GATEWAY.md` (it
   already points here for release/live-URL rules). Its Go checklist must
   pass in addition to this file’s Go bar.
2. **Blueprint:** update the app's own `blueprint.txt` (and the shared
   gateway’s when tools are added there) per Pillar 3, deploy it, and
   verify the live URL before considering the agent-facing surface done.
3. **If the app ever wants its own standalone MCP server** (like
   `imagcon-mcp`, distinct from the shared gateway) rather than plugging
   into `stackapps-suite-mcp`: apply Pillar 1 to that package
   independently. It gets its own repo, its own releases, its own
   self-hosted distribution — the same rules, not a different set.
