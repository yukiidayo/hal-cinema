type ApiResponse<T> = { data: T; meta: { requestId: string } }
type ApiErrorBody = {
  error: { code: string; message: string; details?: unknown }
  meta: { requestId: string }
}

export class ApiError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
    public readonly status?: number,
  ) {
    super(message)
    this.name = "ApiError"
  }
}

export async function apiFetch<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const res = await fetch(`/api${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    credentials: "include",
  })

  const json = (await res.json()) as ApiResponse<T> | ApiErrorBody

  if (!res.ok) {
    const body = json as ApiErrorBody
    throw new ApiError(
      body.error.code,
      body.error.message,
      body.error.details,
      res.status,
    )
  }

  return (json as ApiResponse<T>).data
}
