const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "https://localhost:7010").replace(/\/+$/, "")

function buildHeaders(token) {
  const headers = {
    "Content-Type": "application/json",
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  return headers
}

async function parseResponse(response) {
  const payload = await response.json().catch(() => null)

  if (!response.ok) {
    throw new Error(payload?.error ?? "Request failed. Please try again.")
  }

  return payload
}

export async function apiRequest(path, { method = "GET", token, body } = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: buildHeaders(token),
    body: body === undefined ? undefined : JSON.stringify(body),
  })

  return parseResponse(response)
}
