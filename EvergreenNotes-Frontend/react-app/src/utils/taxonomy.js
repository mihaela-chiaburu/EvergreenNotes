import { apiRequest } from "./apiClient"

export async function searchTaxonomyTags(token, query, limit = 8) {
  if (!query?.trim()) {
    return []
  }

  const payload = await apiRequest(
    `/api/taxonomy/tags/search?q=${encodeURIComponent(query.trim())}&limit=${limit}`,
    { token },
  )

  return Array.isArray(payload?.items) ? payload.items : []
}
