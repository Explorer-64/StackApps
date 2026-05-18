## The idea

You can scatter answers across `/docs`, `/help`, Notion, and Discord. That is fine for humans. **Agents and crawlers benefit from one canonical Q&A surface** they can rely on: the same path every time, bookmarkable, cacheable, and easy to summarize.

StackApps standardizes on **`/faq`**.

## What we check (stay precise)

The scanner sends **HEAD** to `{yourAppUrl}/faq` and requires **HTTP 200**.

- We do **not** crawl for FAQ content in JSON-LD, schema.org, or random pages.
- We do **not** follow “FAQ-like” URLs. The path is **`/faq`** relative to your listing URL.

If you want the check to pass, **`/faq` must respond 200** to that HEAD probe (redirects are followed by `fetch`; the final response must still be 200).

Implementation reference: [scanner.ts](https://github.com/Explorer-64/StackApps/blob/main/functions/src/scanner.ts).

## How to implement

**Option A — real page:** Ship a normal FAQ route at `/faq` (SSR or static is fine). HEAD should succeed the same way GET does on typical hosts.

**Option B — redirect:** If your answers live elsewhere, add a **301/302 from `/help` (or another path) to `/faq`**, or the other direction, **as long as `/faq` itself ends on 200**. Many stacks do this with one line in their router or edge config.

**Option C — thin hub:** `/faq` can be a short page that links out to deeper docs; it still counts as long as HEAD returns 200.

## Why this matters for Silver

**Silver** requires Bronze **plus** FAQ at `/faq`, viewport meta, and the CLI signal. `/faq` is not optional polish—it is part of the “automatable + explainable” bar we encode in [`scanBadges.ts`](https://github.com/Explorer-64/StackApps/blob/main/client/src/utils/scanBadges.ts).

## Honest expectation-setting

A blank `/faq` that returns 200 passes the probe but wastes visitor trust. Ship a handful of real questions—you get human value **and** a stable surface models can summarize.
