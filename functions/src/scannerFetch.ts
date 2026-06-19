export function withPath(baseUrl: string, path: string): string {
  return new URL(path, baseUrl).toString();
}

export async function fetchWithTimeout(url: string, init: RequestInit = {}): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

export async function statusIs200(url: string, method: "GET" | "HEAD"): Promise<boolean> {
  try {
    const response = await fetchWithTimeout(url, { method, redirect: "follow" });
    return response.status === 200;
  } catch {
    return false;
  }
}

export async function fetchTextResult(url: string): Promise<{ ok: boolean; body: string }> {
  try {
    const response = await fetchWithTimeout(url, { method: "GET", redirect: "follow" });
    if (response.status !== 200) {
      return { ok: false, body: "" };
    }
    return { ok: true, body: await response.text() };
  } catch {
    return { ok: false, body: "" };
  }
}
