## What “CLI” means here

In StackApps readiness, **“CLI available” does not mean “you must ship a terminal product.”** It means we see **documented automation entry points**: common install or run commands that a developer or script could execute without clicking through a GUI.

We are scoring **discoverability of those commands**, not judging your architecture.

## How the scanner detects it

1. **Primary:** We scan the **HTML** of your app’s root URL (GET, first ~document body as loaded).
2. If that misses, we **GET** `/llms.txt` when it returns 200 and scan that text.
3. If still missing, we **GET** `/blueprint.txt` when it returns 200 and scan that text.

The regex (simplified) looks for patterns like:

`npm install -g …`, `npx …`, `uvx …`, `pipx …`, `brew install …`, `pip install …`, `cargo install …`

Exact pattern lives in [`scanner.ts`](https://github.com/Explorer-64/StackApps/blob/main/functions/src/scanner.ts) (`cliPattern`).

## Examples that tend to pass

- A hero or docs section that says `npx your-cli --help`.
- `brew install your/tap/tool` in the README block embedded on the landing page.
- The same strings repeated legitimately in **`llms.txt`** or **`blueprint.txt`** (useful when your marketing page is minimal).

## Examples that do not pass

- “Download our Mac app” with no install command.
- JSON-LD or hidden metadata only—**we are not doing deep semantic inference**; we match those command-shaped strings in the surfaces above.

## Tie-in to **Silver**

Tier logic (client-side mirror of listing badges) is in [`scanBadges.ts`](https://github.com/Explorer-64/StackApps/blob/main/client/src/utils/scanBadges.ts):

- **Bronze:** reachable + `llms.txt` + `robots.txt` + `sitemap.xml`
- **Silver:** Bronze + **CLI** + **FAQ at `/faq`** + **viewport** meta
- **Gold:** Silver + MCP + `blueprint.txt`

So the CLI check is a **Silver ingredient**, not a Bronze requirement. If you are Bronze and stuck below Silver, compare FAQ, viewport, and these command hints.
