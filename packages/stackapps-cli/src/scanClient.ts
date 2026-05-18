export const DEFAULT_PUBLIC_SCAN_URL =
  process.env.STACKAPPS_PUBLIC_SCAN_URL ??
  "https://us-central1-stackapps-dcab1.cloudfunctions.net/publicScan";

export async function postPublicScan(url: string): Promise<unknown> {
  const res = await fetch(DEFAULT_PUBLIC_SCAN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });
  const text = await res.text();
  let body: unknown;
  try {
    body = JSON.parse(text) as unknown;
  } catch {
    body = { raw: text };
  }
  if (!res.ok) {
    const err = new Error(`Scan failed (${res.status})`);
    (err as Error & { body?: unknown }).body = body;
    throw err;
  }
  return body;
}
