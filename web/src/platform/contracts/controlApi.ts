import type { ZodType } from "zod";

type ControlApiErrorKind = "transport" | "http" | "contract";

export class ControlApiError extends Error {
  kind: ControlApiErrorKind;
  status?: number;
  endpoint: string;

  constructor(options: { kind: ControlApiErrorKind; message: string; endpoint: string; status?: number }) {
    super(options.message);
    this.name = "ControlApiError";
    this.kind = options.kind;
    this.status = options.status;
    this.endpoint = options.endpoint;
  }
}

export async function requestControlApi<T>(url: string, schema: ZodType<T>, init?: RequestInit): Promise<T> {
  const method = init?.method ?? "GET";
  const endpoint = `${method} ${url}`;
  const headers = new Headers(init?.headers);

  headers.set("Accept", "application/json");
  if (init?.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  let response: Response;
  try {
    response = await fetch(url, {
      ...init,
      headers,
    });
  } catch {
    throw new ControlApiError({
      kind: "transport",
      endpoint,
      message: `Unable to reach Control API for ${endpoint}.`,
    });
  }

  if (!response.ok) {
    throw new ControlApiError({
      kind: "http",
      endpoint,
      status: response.status,
      message: `Control API request failed (HTTP ${response.status}) for ${endpoint}: ${await readFailureMessage(response)}`,
    });
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new ControlApiError({
      kind: "contract",
      endpoint,
      message: `Control API contract failure for ${endpoint}: invalid JSON response.`,
    });
  }

  const parsed = schema.safeParse(payload);
  if (!parsed.success) {
    throw new ControlApiError({
      kind: "contract",
      endpoint,
      message: `Control API contract failure for ${endpoint}: ${formatIssues(parsed.error.issues)}`,
    });
  }

  return parsed.data;
}

async function readFailureMessage(response: Response) {
  const contentType = response.headers.get("Content-Type") ?? "";

  if (contentType.includes("application/json")) {
    try {
      const payload = (await response.json()) as { detail?: unknown; message?: unknown };
      if (typeof payload.detail === "string" && payload.detail.trim()) {
        return payload.detail;
      }
      if (typeof payload.message === "string" && payload.message.trim()) {
        return payload.message;
      }
    } catch {
      return "no structured error body";
    }
  }

  try {
    const text = (await response.text()).trim();
    return text || "no response body";
  } catch {
    return "no response body";
  }
}

function formatIssues(issues: Array<{ path: PropertyKey[]; message: string }>) {
  return issues
    .slice(0, 3)
    .map((issue) => {
      const path = issue.path.length ? issue.path.join(".") : "response";
      return `${path}: ${issue.message}`;
    })
    .join("; ");
}
