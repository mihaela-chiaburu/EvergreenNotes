import { apiRequest } from "./apiClient"

export async function fetchGardenGraph(token) {
  return apiRequest("/api/gardens/me/graph", { token })
}
