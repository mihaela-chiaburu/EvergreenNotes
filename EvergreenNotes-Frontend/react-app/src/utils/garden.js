import { apiRequest } from "./apiClient"

export async function fetchGardenGraph(token) {
  return apiRequest("/api/gardens/me/graph", { token })
}

export async function fetchPublicGardenGraph(userId, token) {
  return apiRequest(`/api/gardens/${encodeURIComponent(userId)}/graph`, { token })
}

export async function fetchPublicGarden(userId, token) {
  return apiRequest(`/api/gardens/${encodeURIComponent(userId)}`, { token })
}
