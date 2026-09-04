type JsonRecord = Record<string, unknown>;

export class FetchJsonError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "FetchJsonError";
    this.status = status;
  }
}

function redirectToLogin() {
  if (typeof window === "undefined") return;
  const next = encodeURIComponent(
    `${window.location.pathname}${window.location.search}`
  );
  window.location.href = `/login?next=${next}`;
}

/** Client fetch that never throws on empty/invalid JSON; redirects on 401. */
export async function fetchJson<T extends JsonRecord = JsonRecord>(
  url: string,
  init?: RequestInit
): Promise<T> {
  const res = await fetch(url, init);
  const text = await res.text();

  if (res.status === 401) {
    redirectToLogin();
    throw new FetchJsonError("Unauthorized", 401);
  }

  if (!text.trim()) {
    throw new FetchJsonError(
      res.status >= 500
        ? `Server error from ${url} (${res.status})`
        : `Empty response from ${url}`,
      res.status
    );
  }

  let data: T;
  try {
    data = JSON.parse(text) as T;
  } catch {
    throw new FetchJsonError(
      `Invalid JSON from ${url} (${res.status})`,
      res.status
    );
  }

  if (!res.ok) {
    const message =
      typeof data.error === "string" ? data.error : `HTTP ${res.status}`;
    throw new FetchJsonError(message, res.status);
  }

  return data;
}
