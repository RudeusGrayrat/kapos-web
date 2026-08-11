type ApiRequestOptions = {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  accessToken?: string | null;
  headers?: HeadersInit;
  signal?: AbortSignal;
};

type ApiErrorPayload = {
  message?: string | string[];
  error?: string;
  statusCode?: number;
};

export class ApiError extends Error {
  status: number;
  messages: string[];

  constructor(status: number, messages: string[]) {
    super(messages[0] ?? "Ocurrio un error inesperado.");
    this.name = "ApiError";
    this.status = status;
    this.messages = messages;
  }
}

export async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const headers = new Headers(options.headers);
  const hasBody = options.body !== undefined;

  if (hasBody && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (options.accessToken) {
    headers.set("Authorization", `Bearer ${options.accessToken}`);
  }

  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    method: options.method ?? (hasBody ? "POST" : "GET"),
    headers,
    credentials: "include",
    body: hasBody ? JSON.stringify(options.body) : undefined,
    cache: "no-store",
    signal: options.signal,
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const payload = await readResponsePayload(response);

  if (!response.ok) {
    throw new ApiError(response.status, getErrorMessages(payload));
  }

  return payload as T;
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

function getApiBaseUrl(): string {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  if (!apiUrl) {
    throw new Error(
      "NEXT_PUBLIC_API_URL no esta configurada. Revisa el archivo .env del frontend.",
    );
  }

  return apiUrl;
}

async function readResponsePayload(response: Response): Promise<unknown> {
  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    return response.json().catch(() => null);
  }

  const text = await response.text().catch(() => "");
  return text.length > 0 ? text : null;
}

function getErrorMessages(payload: unknown): string[] {
  if (typeof payload === "string" && payload.trim().length > 0) {
    return [payload];
  }

  if (isApiErrorPayload(payload)) {
    if (Array.isArray(payload.message)) {
      return payload.message.filter(
        (message): message is string =>
          typeof message === "string" && message.trim().length > 0,
      );
    }

    if (typeof payload.message === "string" && payload.message.trim().length > 0) {
      return [payload.message];
    }
  }

  return ["Ocurrio un error inesperado."];
}

function isApiErrorPayload(payload: unknown): payload is ApiErrorPayload {
  return typeof payload === "object" && payload !== null;
}
