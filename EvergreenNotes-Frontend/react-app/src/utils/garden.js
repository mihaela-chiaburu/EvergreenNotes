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

export async function renameTagNode(token, tagId, name) {
  return apiRequest(`/api/tags/${encodeURIComponent(tagId)}`, {
    method: "PATCH",
    token,
    body: {
      name,
    },
  })
}

export async function deleteTagNode(token, tagId, { moveNotesToTagId = null, cascadeDeleteNotes = false } = {}) {
  return apiRequest(`/api/tags/${encodeURIComponent(tagId)}/delete`, {
    method: "POST",
    token,
    body: {
      moveNotesToTagId,
      cascadeDeleteNotes,
    },
  })
}
