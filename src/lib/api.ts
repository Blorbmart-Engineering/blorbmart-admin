const API_BASE_URL = import.meta.env.VITE_API_URL || ''

function buildHeaders(options: RequestInit) {
  const headers = new Headers(options.headers || {})

  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json')
  }

  return headers
}

export async function apiFetch(path: string, options: RequestInit = {}) {
  const url = path.startsWith('http') ? path : `${API_BASE_URL}${path}`
  const headers = buildHeaders(options)
  return fetch(url, { ...options, headers })
}

export async function apiFetchWithToken(path: string, token: string, options: RequestInit = {}) {
  const url = path.startsWith('http') ? path : `${API_BASE_URL}${path}`
  const headers = buildHeaders(options)
  headers.set('Authorization', `Bearer ${token}`)
  return fetch(url, { ...options, headers })
}
