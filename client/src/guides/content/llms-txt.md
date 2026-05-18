## What it is

`/llms.txt` is a small, plain-text file at the **root** of your site (`https://yoursite.com/llms.txt`). Think of it as a business card for machines: who you are, what the product does, and where humans and agents should look next.

## Why agents skip you without it

Crawlers and assistants already have your marketing page. They do **not** have a compact, factual map of intent, boundaries, and pointers to deeper docs. Without `/llms.txt`, everything becomes guesswork from layout and hero copy—which is noisy, easy to misread, and expensive to reconcile.

A real `/llms.txt` says: *here is what we want you to know, in one place.*

## What StackApps actually checks

Our production scanner issues a **HEAD** request to `{yourAppUrl}/llms.txt` and requires **HTTP 200**. That is the baseline check—no parsing of the body for pass/fail on this signal.

We also **GET** the body for other heuristics (for example CLI and MCP hints when those files exist), but **llms pass/fail is the HEAD + 200 bar** only.

Source of truth in repo: [`scanner.ts`](https://github.com/Explorer-64/StackApps/blob/main/functions/src/scanner.ts) (HEAD on `/llms.txt` must return 200).

## What to put in the file

Keep it short and scannable. Most teams include:

- **Product name** and one-line purpose.
- **Primary audience** (developers, SMBs, etc.).
- **Links** to docs, pricing, support, and anything you want cited accurately.
- **Optional:** install or automation hints (`npx …`, `brew install …`) if they are real—those strings can also feed the separate **CLI** check when they appear here or in `blueprint.txt`.

Skip pretending to be a full spec; link out instead.

## Bronze tier reminder

**Bronze** on StackApps means baseline discoverability: reachable site plus `robots.txt`, `sitemap.xml`, and **`/llms.txt` returning 200**. Nail those before you chase Silver or Gold.
