export const API_BASE_URL =
  import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

export type ApiError = {
  status: number
  message: string
  details?: unknown
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
  token?: string,
): Promise<T> {
  const headers = new Headers(options.headers)

  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  if (options.body && !(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  })

  const text = await response.text()
  let data: unknown = null
  if (text) {
    try {
      data = JSON.parse(text)
    } catch {
      data = text
    }
  }

  if (!response.ok) {
    const message =
      (data && typeof data === 'object' && 'message' in data
        ? String((data as { message?: string }).message)
        : null) || `Request failed with status ${response.status}`
    const error: ApiError = {
      status: response.status,
      message,
      details: data,
    }
    throw error
  }

  return data as T
}

export function getApiErrorMessage(error: unknown) {
  if (typeof error === 'object' && error && 'message' in error) {
    return String(error.message)
  }
  return 'Something went wrong. Please try again.'
}
