const AUTH_STORAGE_KEY = "evergreen.auth"

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "https://localhost:7010").replace(/\/+$/, "")

function toJsonHeaders(token) {
  const headers = {
    "Content-Type": "application/json",
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  return headers
}

async function parseApiResponse(response) {
  const payload = await response.json().catch(() => null)

  if (!response.ok) {
    const message = payload?.error ?? "Request failed. Please try again."
    throw new Error(message)
  }

  return payload
}

function normalizeAuthResponse(payload) {
  if (!payload?.token || !payload?.email || !payload?.username) {
    throw new Error("Unexpected auth response from server.")
  }

  return {
    token: payload.token,
    email: payload.email,
    username: payload.username,
  }
}

export async function registerUser({ email, username, password }) {
  const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
    method: "POST",
    headers: toJsonHeaders(),
    body: JSON.stringify({
      email,
      username,
      password,
    }),
  })

  const payload = await parseApiResponse(response)
  return normalizeAuthResponse(payload)
}

export async function loginUser({ email, password }) {
  const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: toJsonHeaders(),
    body: JSON.stringify({
      email,
      password,
    }),
  })

  const payload = await parseApiResponse(response)
  return normalizeAuthResponse(payload)
}

export async function fetchMe(token) {
  const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
    method: "GET",
    headers: toJsonHeaders(token),
  })

  return parseApiResponse(response)
}

export function saveAuthSession(auth) {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(auth))
}

export function readAuthSession() {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY)
    if (!raw) {
      return null
    }

    const parsed = JSON.parse(raw)
    if (!parsed?.token) {
      return null
    }

    return parsed
  } catch {
    return null
  }
}

export function clearAuthSession() {
  localStorage.removeItem(AUTH_STORAGE_KEY)
}
