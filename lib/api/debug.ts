import "server-only";

const MAX_EVENTS = 50;

export type ApiDebugEventRecord = {
  id: string;
  at: string;
  method: string;
  url: string;
  status?: number;
  durationMs: number;
  error?: string;
  curl: string;
  body?: string;
};

type ApiDebugEvent = {
  method: string;
  url: string;
  status?: number;
  durationMs: number;
  error?: string;
  headers?: Headers | Record<string, string>;
  body?: string;
};

const globalStore = globalThis as typeof globalThis & {
  __pressScriptApiDebugEvents?: ApiDebugEventRecord[];
};

function getStore() {
  if (!globalStore.__pressScriptApiDebugEvents) {
    globalStore.__pressScriptApiDebugEvents = [];
  }
  return globalStore.__pressScriptApiDebugEvents;
}

export function isApiDebugEnabled() {
  const flag = process.env.API_DEBUG?.toLowerCase();
  if (flag === "0" || flag === "false") return false;
  if (flag === "1" || flag === "true") return true;
  return process.env.NODE_ENV === "development";
}

function toHostCurlUrl(url: string) {
  // Inside Docker the API host is often host.docker.internal; Postman on the
  // host machine should use localhost instead.
  return url.replace("://host.docker.internal", "://localhost");
}

function shellQuote(value: string) {
  return `'${value.replace(/'/g, `'\\''`)}'`;
}

function headersToObject(headers?: ApiDebugEvent["headers"]) {
  if (!headers) return {} as Record<string, string>;
  if (headers instanceof Headers) {
    return Object.fromEntries(headers.entries());
  }
  return headers;
}

export function formatCurl(
  event: Pick<ApiDebugEvent, "method" | "url" | "headers" | "body">,
) {
  const parts = [
    "curl",
    "-X",
    event.method,
    shellQuote(toHostCurlUrl(event.url)),
  ];

  for (const [key, value] of Object.entries(headersToObject(event.headers))) {
    parts.push("-H", shellQuote(`${key}: ${value}`));
  }

  if (event.body !== undefined) {
    parts.push("--data-raw", shellQuote(event.body));
  }

  return parts.join(" ");
}

export function getApiDebugEvents() {
  return [...getStore()].reverse();
}

export function clearApiDebugEvents() {
  getStore().length = 0;
}

export function logApiRequest(event: ApiDebugEvent) {
  if (!isApiDebugEnabled()) return;

  const url = toHostCurlUrl(event.url);
  const curl = formatCurl(event);
  const record: ApiDebugEventRecord = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    at: new Date().toISOString(),
    method: event.method,
    url,
    status: event.status,
    durationMs: event.durationMs,
    error: event.error,
    curl,
    body: event.body,
  };

  const store = getStore();
  store.push(record);
  if (store.length > MAX_EVENTS) {
    store.splice(0, store.length - MAX_EVENTS);
  }

  const status = event.status ?? "ERR";
  const suffix = event.error ? ` — ${event.error}` : "";
  console.info(
    `[api] ${event.method} ${url} → ${status} (${event.durationMs}ms)${suffix}`,
  );
  console.info(`[api:curl] ${curl}`);
}
